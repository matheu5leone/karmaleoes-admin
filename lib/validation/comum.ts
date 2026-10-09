import { z } from "zod";

/**
 * Validações reaproveitadas pelos formulários. Ficam juntas para a mensagem de
 * erro ser a mesma em todo o painel — "E-mail inválido" escrito de três jeitos
 * diferentes é ruído para quem usa.
 */

/** Campo de texto opcional: "" e espaços viram "" (e não um valor sujo). */
const opcional = z.string().trim().optional().or(z.literal(""));

// ---------------------------------------------------------------- e-mail
/**
 * O `.email()` do Zod aceita coisas que nenhum provedor entrega, como
 * "a@b" (sem ponto no domínio) — daí a conferida extra.
 */
export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Informe o e-mail")
  .email("E-mail inválido")
  .refine((v) => /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(v), {
    message: "E-mail inválido — falta o domínio (ex.: nome@dominio.com)",
  });

// ---------------------------------------------------------------- URL
const URL_PROTOCOLO = /^https?:\/\//i;

/** Aceita "site.com" e completa para https://. */
export function normalizarUrl(v: string): string {
  const t = v.trim();
  return t && !URL_PROTOCOLO.test(t) ? `https://${t}` : t;
}

function urlValida(v: string): boolean {
  try {
    const u = new URL(v);
    // Hostname precisa de ponto: "https://localhost" não serve para o público.
    return /^https?:$/.test(u.protocol) && /\.[a-z]{2,}$/i.test(u.hostname);
  } catch {
    return false;
  }
}

const URL_MSG = "Endereço inválido (ex.: site.com.br/pagina)";

// `transform` em vez de `preprocess`: o preprocess tipa a entrada como
// `unknown` e isso vaza para o `z.infer` do objeto inteiro.
export const url = z
  .string()
  .trim()
  .min(1, "Informe o endereço")
  .transform((v) => normalizarUrl(v))
  .refine(urlValida, URL_MSG);

export const urlOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? normalizarUrl(v) : v))
  .refine((v) => !v || urlValida(v), URL_MSG);

// ---------------------------------------------------------------- redes
/** Guardamos o handle sem "@" e sem URL — a exibição decide o prefixo. */
export const instagramOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v) =>
    v
      ?.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/^@/, "")
      .replace(/\/+$/, ""),
  )
  .refine((v) => !v || /^[A-Za-z0-9._]{1,30}$/.test(v), {
    message: "Use só letras, números, ponto e _ (até 30) — ex.: banda.karma",
  });

export const linkedinOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? normalizarUrl(v) : v))
  .refine((v) => !v || urlValida(v), {
    message: "Informe o endereço do perfil (ex.: linkedin.com/in/nome)",
  });

// ---------------------------------------------------------------- data/hora
/** `yyyy-mm-dd` que existe no calendário — "2026-02-31" não passa. */
function dataReal(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [a, m, d] = v.split("-").map(Number);
  if (m < 1 || m > 12) return false;
  const dias = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return d >= 1 && d <= dias;
}

const DATA_MSG = "Data inválida";

export const data = z
  .string()
  .trim()
  .min(1, "Informe a data")
  .refine(dataReal, DATA_MSG);

export const dataOpcional = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || dataReal(v), DATA_MSG);

export const horarioOpcional = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), {
    message: "Horário inválido (use HH:MM, ex.: 20:30)",
  });

// ---------------------------------------------------------------- outros
/** ISRC: 2 letras de país + 3 do registrante + ano + 5 dígitos. */
export const isrcOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v) => v?.toUpperCase().replace(/-/g, ""))
  .refine((v) => !v || /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(v), {
    message: "ISRC inválido (ex.: BR-ABC-25-00001)",
  });

export const corHexOpcional = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^#[0-9a-fA-F]{6}$/.test(v), {
    message: "Cor inválida (use #RRGGBB, ex.: #2b1d12)",
  });

/** Rota interna do site: começa com / e aceita letras, números, - e /. */
export const rota = z
  .string()
  .trim()
  .min(1, "Informe a rota")
  .regex(/^\/[\w\-/]*$/, "A rota começa com / e aceita letras, números, - e /");

export { opcional as textoOpcional };
