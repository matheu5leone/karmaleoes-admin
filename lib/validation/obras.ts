import { z } from "zod";

export const musicaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome"),
  data_lancamento: z.string().optional().or(z.literal("")),
  duracao: z.string().trim().optional().or(z.literal("")),
  isrc: z.string().trim().optional().or(z.literal("")),
  cover_image: z.string().trim().nullable().optional(),
  colecao_id: z.string().uuid().nullable().optional(),
});
export type MusicaInput = z.infer<typeof musicaSchema>;

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

export const linkSchema = z.object({
  plataforma: z.string().trim().min(1, "Informe a plataforma"),
  url: z.string().trim().min(1, "Informe a URL"),
});
export type LinkInput = z.infer<typeof linkSchema>;

export type ObraTipo = "musica" | "colecao";
