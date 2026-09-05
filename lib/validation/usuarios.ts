import { z } from "zod";

/**
 * Senha: apenas ASCII imprimível (letras, dígitos, pontuação e espaço).
 * Optamos por lista de permitidos em vez de "bloquear emoji": emoji tem
 * sequências ZWJ, tons de pele e símbolos que passariam por qualquer regex de
 * bloqueio. O que não está aqui não entra.
 */
const ASCII_IMPRIMIVEL = /^[\x20-\x7E]+$/;

export const senhaSchema = z
  .string()
  .min(1, "Informe a senha")
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(
    ASCII_IMPRIMIVEL,
    "Use apenas letras, números e pontuação — emojis e acentos não são aceitos",
  );

/** Só os dígitos do telefone (o que vai para o banco). */
export function apenasDigitos(v: string): string {
  return v.replace(/\D/g, "").slice(0, 11);
}

/**
 * Máscara de exibição:
 *  - celular (11 dígitos) → "11 9 4520-4308"
 *  - fixo    (10 dígitos) → "11 4520-4308"
 */
export function formatarTelefone(valor: string): string {
  const d = apenasDigitos(valor);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 10) return `${d.slice(0, 2)} ${d.slice(2, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
}

/**
 * Telefone é opcional. Quando preenchido, guardamos só os dígitos — a máscara é
 * de exibição. Como o campo só aceita dígitos, emoji não tem por onde entrar.
 */
export const telefoneOpcional = z
  .string()
  .trim()
  .transform(apenasDigitos)
  .refine((d) => d.length === 0 || d.length === 10 || d.length === 11, {
    message: "Telefone deve ter 10 (fixo) ou 11 (celular) dígitos",
  });

export const criarUsuarioSchema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  telefone: telefoneOpcional,
  senhaTemporaria: senhaSchema,
});
export type CriarUsuarioInput = z.input<typeof criarUsuarioSchema>;

export const telefoneSchema = z.object({
  telefone: telefoneOpcional,
});

/** Troca de senha pelo próprio usuário (exige a senha atual). */
export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual"),
    novaSenha: senhaSchema,
    confirmar: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.novaSenha === d.confirmar, {
    message: "As senhas não conferem",
    path: ["confirmar"],
  })
  .refine((d) => d.novaSenha !== d.senhaAtual, {
    message: "A nova senha deve ser diferente da atual",
    path: ["novaSenha"],
  });
export type AlterarSenhaInput = z.input<typeof alterarSenhaSchema>;
