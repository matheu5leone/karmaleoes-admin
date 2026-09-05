import { z } from "zod";

export const TIPOS = [
  "video",
  "playlist",
  "noticia",
  "entrevista",
  "podcast",
] as const;
export const STATUS = [
  "draft",
  "pendente",
  "publicado",
  "desabilitado",
] as const;

export const conteudoSchema = z.object({
  titulo: z.string().trim().min(1, "Informe o título"),
  descricao: z.string().trim().optional().or(z.literal("")),
  thumbnail: z.string().trim().nullable().optional(),
  categoria_id: z.string().uuid().nullable().optional(),
  tipo: z.enum(TIPOS),
  plataforma: z.string().trim().optional().or(z.literal("")),
  link: z.string().trim().min(1, "Informe o link"),
  status: z.enum(STATUS),
  destaque: z.boolean().default(false),
  data: z.string().optional().or(z.literal("")),
});
export type ConteudoInput = z.infer<typeof conteudoSchema>;

export const categoriaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome"),
});
export type CategoriaInput = z.infer<typeof categoriaSchema>;
