import { z } from "zod";
import { LIMITES, excedeu } from "./limites";

export const bannerSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome")
    .max(LIMITES.bannerNome, excedeu(LIMITES.bannerNome)),
  imagem: z.string().trim().min(1, "Envie uma imagem"),
});
export type BannerInput = z.infer<typeof bannerSchema>;
