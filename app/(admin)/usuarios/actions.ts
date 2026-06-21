"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateSession } from "@/lib/redis";
import { audit } from "@/lib/audit";
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

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.senhaTemporaria,
    email_confirm: true,
  });
  if (error || !data.user) {
    return { ok: false, error: "Não foi possível criar (e-mail já em uso?)." };
  }

  const { error: insErr } = await admin.from("admin_user").insert({
    id: data.user.id,
    email: parsed.data.email,
    telefone: parsed.data.telefone || null,
    status: "ativo",
    two_factor_configured: false,
  });
  if (insErr) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false, error: "E-mail já cadastrado." };
  }

  await audit({ acao: "create", entidade: "admin_user", registroId: data.user.id });
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

  await audit({ acao: "update", entidade: "admin_user", registroId: id });
  revalidatePath("/usuarios");
  return { ok: true };
}

/** Ativa/desativa usuário (RN-LOGIN-004). Desativar encerra a sessão única. */
export async function alternarStatus(
  id: string,
  ativar: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === id && !ativar) {
    return { ok: false, error: "Você não pode desativar a si mesmo." };
  }

  const { error } = await supabase
    .from("admin_user")
    .update({ status: ativar ? "ativo" : "inativo" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  if (!ativar) await invalidateSession(id);

  await audit({
    acao: "update",
    entidade: "admin_user",
    registroId: id,
    diff: { status: ativar ? "ativo" : "inativo" },
  });
  revalidatePath("/usuarios");
  return { ok: true };
}
