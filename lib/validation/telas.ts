import { z } from "zod";
import { LIMITES, excedeu } from "./limites";

export const telaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome")
    .max(LIMITES.telaNome, excedeu(LIMITES.telaNome)),
  rota: z
    .string()
    .trim()
    .min(1, "Informe a rota")
    .regex(/^\/[\w\-/]*$/, "Rota deve começar com / e conter apenas letras, números, - e /"),
});
export type TelaInput = z.infer<typeof telaSchema>;
