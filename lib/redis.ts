import { Redis } from "@upstash/redis";

/**
 * Client Redis (Upstash REST) + helpers de SESSÃO ÚNICA e timeout de inatividade.
 * Ver docs/arquitetura/transversal-totp-e-sessao.md.
 *
 * Chave por usuário: `session:{userId}` = id da sessão ativa. Login novo sobrescreve
 * (invalida a anterior). TTL renovável a cada request autenticado (timeout de inatividade).
 */

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

export const SESSION_TTL_SECONDS = Number(
  process.env.SESSION_INACTIVITY_TIMEOUT_SECONDS ?? 1800,
);

export function sessionKey(userId: string): string {
  return `session:${userId}`;
}

/** Grava a sessão atual do usuário (sobrescreve a anterior) com TTL de inatividade. */
export async function setSession(
  userId: string,
  sessionId: string,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<void> {
  await getRedis().set(sessionKey(userId), sessionId, { ex: ttlSeconds });
}

/** Lê o id da sessão ativa do usuário (ou null). */
export async function getSession(userId: string): Promise<string | null> {
  return getRedis().get<string>(sessionKey(userId));
}

/**
 * Lê a sessão ativa **e** renova o TTL de inatividade num único round-trip
 * (Redis GETEX). Substitui o par `getSession` + `touchSession` no caminho
 * quente do middleware (uma ida à rede em vez de duas).
 */
export async function touchAndGetSession(
  userId: string,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<string | null> {
  return getRedis().getex<string>(sessionKey(userId), { ex: ttlSeconds });
}

/** Invalida a sessão do usuário (logout / desativação). */
export async function invalidateSession(userId: string): Promise<void> {
  await getRedis().del(sessionKey(userId));
}

/** Renova o TTL de inatividade (chamado a cada request autenticado). */
export async function touchSession(
  userId: string,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<void> {
  await getRedis().expire(sessionKey(userId), ttlSeconds);
}

/** True se `sessionId` é a sessão ativa do usuário (base da guarda de sessão única). */
export async function isCurrentSession(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const current = await getSession(userId);
  return current !== null && current === sessionId;
}
