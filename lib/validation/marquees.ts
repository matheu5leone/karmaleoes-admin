import { z } from "zod";

export const marqueeSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome"),
  cor_fundo: z.string().trim().optional().or(z.literal("")),
  cor_texto: z.string().trim().optional().or(z.literal("")),
});
export type MarqueeInput = z.infer<typeof marqueeSchema>;

export const itemSchema = z
  .object({
    titulo: z.string().trim().min(1, "Informe o título"),
    icon_id: z.string().uuid().nullable().optional(),
    tipo_nav: z.enum(["interno", "externo"]),
    tela_destino_id: z.string().uuid().nullable().optional(),
    url_externa: z.string().trim().nullable().optional(),
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
    .min(1, "Informe a extensão")
    .regex(/^[a-z0-9]+$/i, "Extensão inválida (ex.: svg, png)"),
});
export type IconInput = z.infer<typeof iconSchema>;
