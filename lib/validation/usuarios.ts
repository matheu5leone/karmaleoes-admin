import { z } from "zod";

export const criarUsuarioSchema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  telefone: z.string().trim().optional().or(z.literal("")),
  senhaTemporaria: z
    .string()
    .min(1, "Informe a senha temporária")
    .min(8, "A senha deve ter no mínimo 8 caracteres"),
});
export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;

export const telefoneSchema = z.object({
  telefone: z.string().trim().optional().or(z.literal("")),
});
