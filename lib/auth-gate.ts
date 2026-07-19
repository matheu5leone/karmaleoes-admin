import "server-only";

/**
 * "Gate" de autenticação de curta duração para o middleware do (admin).
 *
 * A revalidação completa (getUser na rede + AAL2 + status do admin no banco +
 * sessão única no Redis) é cara e roda em TODA navegação. Aqui emitimos, após
 * uma revalidação bem-sucedida, um cookie httpOnly **assinado (HMAC)** e de vida
 * curta (~60s). Enquanto ele for válido, o middleware libera a navegação sem
 * nenhuma chamada de rede (fast path).
 *
 * O token é ligado ao `karma_sid` da sessão única: um novo login (novo sid) ou
 * um logout (sid removido) invalidam o gate automaticamente. Trade-off: um admin
 * desativado / uma sessão substituída ainda navegariam por, no máximo, o TTL do
 * gate antes da próxima revalidação completa.
 */

const GATE_COOKIE = "karma_gate";
const GATE_TTL_SECONDS = Number(process.env.AUTH_GATE_TTL_SECONDS ?? 60);

/** Segredo de assinatura (server-only). Cai no service role se não houver dedicado. */
function secret(): string {
  return (
    process.env.AUTH_GATE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  );
}

export const GATE_COOKIE_NAME = GATE_COOKIE;
export const GATE_MAX_AGE = GATE_TTL_SECONDS;

const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64url(sig);
}

/** Comparação em tempo constante (evita timing attacks na verificação do MAC). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Gera o valor do cookie do gate: `userId.exp.sig`, ligado ao `sid` da sessão. */
export async function signGate(userId: string, sid: string): Promise<string> {
  const exp = Date.now() + GATE_TTL_SECONDS * 1000;
  const sig = await hmac(`${userId}.${exp}.${sid}`);
  return `${userId}.${exp}.${sig}`;
}

/**
 * Valida o gate: assinatura íntegra, não expirado e ligado ao `sid` atual.
 * Retorna o `userId` se válido, ou `null` caso contrário (força o slow path).
 */
export async function verifyGate(
  value: string | undefined,
  sid: string,
): Promise<string | null> {
  if (!value || !secret()) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!userId || !Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = await hmac(`${userId}.${exp}.${sid}`);
  return safeEqual(sig, expected) ? userId : null;
}
