import { z } from "zod";

export const musicaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome"),
  data_lancamento: z.string().optional().or(z.literal("")),
  // Entrada em mm:ss (ex.: 3:45); persistida como total de segundos (integer).
  duracao: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d+:[0-5]\d$/.test(v), "Duração no formato mm:ss (ex.: 3:45)")
    .transform((v) => {
      if (!v) return null;
      const [mm, ss] = v.split(":").map(Number);
      return mm * 60 + ss;
    }),
  isrc: z.string().trim().optional().or(z.literal("")),
  cover_image: z.string().trim().nullable().optional(),
  colecao_id: z.string().uuid().nullable().optional(),
});
// Entrada do formulário (duracao ainda como string mm:ss antes do transform).
export type MusicaInput = z.input<typeof musicaSchema>;

export const colecaoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome"),
  descricao: z.string().trim().optional().or(z.literal("")),
  tipo: z.enum(["album", "EP"]),
  cover_image: z.string().trim().nullable().optional(),
  data_lancamento: z.string().optional().or(z.literal("")),
});
export type ColecaoInput = z.infer<typeof colecaoSchema>;

export const colaboradorSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome"),
  instagram: z.string().trim().optional().or(z.literal("")),
  linkedin: z.string().trim().optional().or(z.literal("")),
  descricao: z.string().trim().optional().or(z.literal("")),
});
export type ColaboradorInput = z.infer<typeof colaboradorSchema>;

export const roleSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome"),
});
export type RoleInput = z.infer<typeof roleSchema>;

export const vinculoSchema = z.object({
  colaborador_id: z.string().uuid("Selecione o colaborador"),
  role_id: z.string().uuid("Selecione o papel"),
});
export type VinculoInput = z.infer<typeof vinculoSchema>;

/** Plataformas de streaming aceitas + domínios válidos (para o dropdown e a validação). */
export const PLATAFORMAS = [
  { nome: "Spotify", dominios: ["spotify.com"] },
  { nome: "YouTube", dominios: ["youtube.com", "youtu.be"] },
  { nome: "YouTube Music", dominios: ["music.youtube.com"] },
  { nome: "Apple Music", dominios: ["music.apple.com"] },
  { nome: "Deezer", dominios: ["deezer.com"] },
  { nome: "SoundCloud", dominios: ["soundcloud.com"] },
  { nome: "Amazon Music", dominios: ["music.amazon.com"] },
  { nome: "Tidal", dominios: ["tidal.com"] },
] as const;

function hostCombina(url: string, dominios: readonly string[]): boolean {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return dominios.some((d) => host === d || host.endsWith("." + d));
}

export const linkSchema = z
  .object({
    plataforma: z.string().trim().min(1, "Selecione a plataforma"),
    url: z.string().trim().url("URL inválida (inclua https://)"),
  })
  .superRefine((val, ctx) => {
    const plat = PLATAFORMAS.find((p) => p.nome === val.plataforma);
    if (!plat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["plataforma"],
        message: "Plataforma inválida",
      });
      return;
    }
    if (!hostCombina(val.url, plat.dominios)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: `A URL não parece ser do ${plat.nome}.`,
      });
    }
  });
export type LinkInput = z.infer<typeof linkSchema>;

export type ObraTipo = "musica" | "colecao";
