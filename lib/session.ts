import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { invalidateSession, setSession } from "@/lib/redis";

/**
 * Sessão única (server). Após o login atingir AAL2 (2FA), geramos um `sessionId`,
 * gravamos cookie httpOnly `karma_sid` e o registramos no Redis. Login novo
 * sobrescreve no Redis → a sessão anterior deixa de bater (RF-LOGIN-004).
 * Ver docs/arquitetura/transversal-totp-e-sessao.md.
 */
export const KARMA_SID = "karma_sid";

export async function establishSession(userId: string): Promise<void> {
  const sessionId = randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(KARMA_SID, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  await setSession(userId, sessionId);
}

export async function clearSession(userId: string | null): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(KARMA_SID);
  if (userId) await invalidateSession(userId);
}
