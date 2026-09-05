"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateSession } from "@/lib/redis";
import { criarUsuarioSchema, telefoneSchema } from "@/lib/validation/usuarios";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Cadastra usuário admin: cria auth user (senha temporária) + linha admin_user (RF-LOGIN-005). */
export async function criarUsuario(input: {
  email: string;
  telefone?: string;
  senhaTemporaria: string;
}): Promise<ActionResult> {
  const parsed = criarUsuarioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  // Criar admin exige a service-role key. Sem ela, o construtor do Supabase
  // lançaria "supabaseKey is required" (500); aqui vira um erro tratado.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      error:
        "Configuração ausente no servidor (SUPABASE_SERVICE_ROLE_KEY). Contate o administrador do sistema.",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.senhaTemporaria,
    email_confirm: true,
  });
  if (error || !data.user) {
    return { ok: false, error: "Não foi possível criar (e-mail já em uso?)." };
  }

  // A linha de admin_user entra pelo cliente da REQUISIÇÃO, não pelo service
  // role: assim auth.uid() existe e o trigger de auditoria (0017) registra quem
  // criou a conta. A RLS já permite insert para admin ativo.
  const supabase = await createClient();
  const { error: insErr } = await supabase.from("admin_user").insert({
    id: data.user.id,
    email: parsed.data.email,
    telefone: parsed.data.telefone || null,
    status: "ativo",
    two_factor_configured: false,
    // Conta nasce com a senha definida pelo admin → troca obrigatória no 1º acesso.
    senha_temporaria: true,
  });
  if (insErr) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false, error: "E-mail já cadastrado." };
  }

  revalidatePath("/usuarios");
  return { ok: true };
}

/** Edita o telefone (e-mail é imutável — RN-LOGIN-007). */
export async function editarTelefone(
  id: string,
  telefone: string,
): Promise<ActionResult> {
  const parsed = telefoneSchema.safeParse({ telefone });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("admin_user")
    .update({ telefone: parsed.data.telefone || null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/usuarios");
  return { ok: true };
}

/** Ativa/desativa usuário (RN-LOGIN-004). Desativar encerra a sessão única. */
export async function alternarStatus(
  id: string,
  ativar: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  // Autoproteção removida a pedido: só o admin raiz é intocável.
  if (!ativar) {
    const { data: primeiro } = await supabase
      .from("admin_user")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    if (primeiro?.id === id) {
      return { ok: false, error: "O administrador raiz não pode ser desativado." };
    }
  }

  const { error } = await supabase
    .from("admin_user")
    .update({ status: ativar ? "ativo" : "inativo" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  if (!ativar) await invalidateSession(id);

  revalidatePath("/usuarios");
  return { ok: true };
}
