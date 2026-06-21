import { z } from "zod";

export const criarUsuarioSchema = z.object({
  email: z.string().email("E-mail inválido"),
  telefone: z.string().trim().optional().or(z.literal("")),
  senhaTemporaria: z.string().min(8, "Mínimo de 8 caracteres"),
});
export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;

export const telefoneSchema = z.object({
  telefone: z.string().trim().optional().or(z.literal("")),
});
