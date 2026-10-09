import { z } from "zod";
import { corHexOpcional, urlOpcional } from "./comum";
import { LIMITES, excedeu } from "./limites";

export const marqueeSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome")
    .max(LIMITES.marqueeNome, excedeu(LIMITES.marqueeNome)),
  cor_fundo: corHexOpcional,
  cor_texto: corHexOpcional,
});
export type MarqueeInput = z.infer<typeof marqueeSchema>;

export const itemSchema = z
  .object({
    titulo: z
      .string()
      .trim()
      .min(1, "Informe o título")
      .max(LIMITES.marqueeItemTitulo, excedeu(LIMITES.marqueeItemTitulo)),
    icon_id: z.string().uuid().nullable().optional(),
    tipo_nav: z.enum(["interno", "externo"]),
    tela_destino_id: z.string().uuid().nullable().optional(),
    url_externa: urlOpcional.nullable(),
  })
  .refine(
    (d) =>
      d.tipo_nav === "interno"
        ? !!d.tela_destino_id && !d.url_externa
        : !!d.url_externa && !d.tela_destino_id,
    {
      message: "Defina exatamente um destino conforme o tipo de navegação.",
      path: ["tipo_nav"],
    },
  );
export type ItemInput = z.infer<typeof itemSchema>;

export const iconSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do arquivo"),
  extension: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z.enum(["png", "webp", "ico", "svg"], {
        message: "Ícone deve ser PNG, WEBP, ICO ou SVG",
      }),
    ),
});
// z.input: o formulário envia texto livre; o schema normaliza e restringe.
export type IconInput = z.input<typeof iconSchema>;
