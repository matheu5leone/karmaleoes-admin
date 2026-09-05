"use server";

import { createClient as createPlainClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { establishSession } from "@/lib/session";
import { audit } from "@/lib/audit";
import {
  alterarSenhaSchema,
  type AlterarSenhaInput,
} from "@/lib/validation/usuarios";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Confere a senha atual SEM tocar na sessão vigente.
 *
 * Usar o cliente da requisição para isso rebaixaria a sessão para AAL1 (o
 * signInWithPassword abre uma sessão nova, sem o 2FA), e o middleware chutaria
 * o usuário para o login. Por isso a checagem roda num cliente isolado, que não
 * persiste nada.
 */
async function senhaAtualConfere(
  email: string,
  senha: string,
): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return false;

  const isolado = createPlainClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await isolado.auth.signInWithPassword({
    email,
    password: senha,
  });
  return !error;
}

/** Troca a senha do próprio usuário. Encerra as demais sessões ao concluir. */
export async function alterarSenha(
  input: AlterarSenhaInput,
): Promise<ActionResult> {
  const parsed = alterarSenhaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Sessão expirada." };

  if (!(await senhaAtualConfere(user.email, parsed.data.senhaAtual))) {
    return { ok: false, error: "Senha atual incorreta." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.novaSenha,
  });
  if (error) return { ok: false, error: error.message };

  await supabase
    .from("admin_user")
    .update({ senha_temporaria: false })
    .eq("id", user.id);

  // Novo sessionId no Redis → as outras sessões deste usuário deixam de bater.
  await establishSession(user.id);

  await audit({
    acao: "update",
    entidade: "admin_user",
    registroId: user.id,
    diff: { senha: "alterada" },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
