import { z } from "zod";
import { rota } from "./comum";
import { LIMITES, excedeu } from "./limites";

export const telaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome")
    .max(LIMITES.telaNome, excedeu(LIMITES.telaNome)),
  rota,
});
export type TelaInput = z.infer<typeof telaSchema>;
