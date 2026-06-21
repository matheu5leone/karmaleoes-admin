import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const codigoTotpSchema = z.object({
  codigo: z
    .string()
    .regex(/^\d{6}$/, "O código deve ter 6 dígitos"),
});
export type CodigoTotpInput = z.infer<typeof codigoTotpSchema>;

export const emailSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const novaSenhaSchema = z
  .object({
    senha: z.string().min(8, "Mínimo de 8 caracteres"),
    confirmar: z.string(),
  })
  .refine((d) => d.senha === d.confirmar, {
    message: "As senhas não conferem",
    path: ["confirmar"],
  });
