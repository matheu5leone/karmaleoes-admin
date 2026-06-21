import { z } from "zod";

export const bannerSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome"),
  imagem: z.string().trim().min(1, "Envie uma imagem"),
});
export type BannerInput = z.infer<typeof bannerSchema>;
