import { z } from "zod";
import { dataOpcional, url } from "./comum";
import { LIMITES, excedeu } from "./limites";

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
  titulo: z
    .string()
    .trim()
    .min(1, "Informe o título")
    .max(LIMITES.conteudoTitulo, excedeu(LIMITES.conteudoTitulo)),
  descricao: z.string().trim().optional().or(z.literal("")),
  thumbnail: z.string().trim().nullable().optional(),
  categoria_id: z.string().uuid().nullable().optional(),
  tipo: z.enum(TIPOS),
  plataforma: z.string().trim().optional().or(z.literal("")),
  link: url,
  status: z.enum(STATUS),
  destaque: z.boolean().default(false),
  data: dataOpcional,
});
export type ConteudoInput = z.infer<typeof conteudoSchema>;

export const categoriaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome")
    .max(LIMITES.categoriaNome, excedeu(LIMITES.categoriaNome)),
});
export type CategoriaInput = z.infer<typeof categoriaSchema>;
