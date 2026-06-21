"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clearSession, establishSession } from "@/lib/session";
import {
  codigoTotpSchema,
  emailSchema,
  loginSchema,
  novaSenhaSchema,
} from "@/lib/validation/auth";

export type Step = "enroll" | "challenge";
export type SignInResult =
  | { ok: true; step: Step }
  | { ok: false; error: string };
export type ActionResult = { ok: true } | { ok: false; error: string };

/** Passo 1: e-mail + senha. Decide entre enroll (1º acesso) e challenge (TOTP). */
export async function signIn(input: {
  email: string;
  senha: string;
}): Promise<SignInResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  });
  if (error || !data.user) {
    return { ok: false, error: "Credenciais inválidas." };
  }

  const { data: admin } = await supabase
    .from("admin_user")
    .select("status, two_factor_configured")
    .eq("id", data.user.id)
    .single();

  if (!admin || admin.status !== "ativo") {
    await supabase.auth.signOut();
    return { ok: false, error: "Usuário inativo ou não autorizado." };
  }

  return { ok: true, step: admin.two_factor_configured ? "challenge" : "enroll" };
}

/** 1º acesso: inicia enrollment TOTP e devolve o QR + segredo. */
export async function enrollTotp(): Promise<
  { ok: true; factorId: string; qr: string; secret: string } | {
    ok: false;
    error: string;
  }
> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
  });
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Falha ao iniciar o 2FA." };
  }
  return {
    ok: true,
    factorId: data.id,
    qr: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

/** 1º acesso: valida o 1º código, marca two_factor_configured e abre sessão. */
export async function verifyEnroll(
  factorId: string,
  codigo: string,
): Promise<ActionResult> {
  const parsed = codigoTotpSchema.safeParse({ codigo });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const ch = await supabase.auth.mfa.challenge({ factorId });
  if (ch.error) return { ok: false, error: ch.error.message };

  const v = await supabase.auth.mfa.verify({
    factorId,
    challengeId: ch.data.id,
    code: parsed.data.codigo,
  });
  if (v.error) return { ok: false, error: "Código inválido." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  await supabase
    .from("admin_user")
    .update({ two_factor_configured: true })
    .eq("id", user.id);
  await establishSession(user.id);
  return { ok: true };
}

/** Logins seguintes: valida o código TOTP do fator existente e abre sessão. */
export async function challengeTotp(codigo: string): Promise<ActionResult> {
  const parsed = codigoTotpSchema.safeParse({ codigo });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp?.[0];
  if (fErr || !totp) {
    return { ok: false, error: "Nenhum fator TOTP configurado." };
  }

  const ch = await supabase.auth.mfa.challenge({ factorId: totp.id });
  if (ch.error) return { ok: false, error: ch.error.message };

  const v = await supabase.auth.mfa.verify({
    factorId: totp.id,
    challengeId: ch.data.id,
    code: parsed.data.codigo,
  });
  if (v.error) return { ok: false, error: "Código inválido." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  await establishSession(user.id);
  return { ok: true };
}

/** Logout: limpa sessão única (Redis + cookie) e encerra no Supabase. */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await clearSession(user?.id ?? null);
  await supabase.auth.signOut();
  redirect("/login");
}

/** Recuperação: envia e-mail de redefinição (nativo Supabase). Não revela existência. */
export async function requestReset(email: string): Promise<ActionResult> {
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/recuperar-senha/redefinir`,
  });
  return { ok: true };
}

/** Redefinição: aplica a nova senha (sessão de recovery vinda do link do e-mail). */
export async function updatePassword(
  senha: string,
  confirmar: string,
): Promise<ActionResult> {
  const parsed = novaSenhaSchema.safeParse({ senha, confirmar });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
