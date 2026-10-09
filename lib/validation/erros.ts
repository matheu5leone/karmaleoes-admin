import type { ZodError } from "zod";

/** Mensagem por campo do formulário. A chave é o nome do campo no schema. */
export type ErrosCampo = Record<string, string>;

/** Erro que não pertence a nenhum campo (refine no objeto inteiro, falha do servidor). */
export const ERRO_GERAL = "_geral";

/**
 * Transforma o retorno do Zod num mapa campo → mensagem, para o formulário
 * acender todos os campos de uma vez em vez de só o primeiro erro.
 * Mantém a primeira mensagem de cada campo: é a mais específica.
 */
export function errosPorCampo(error: ZodError): ErrosCampo {
  const mapa: ErrosCampo = {};
  for (const issue of error.issues) {
    const chave = issue.path.length ? String(issue.path[0]) : ERRO_GERAL;
    mapa[chave] ??= issue.message;
  }
  return mapa;
}

/** Quantos problemas o formulário tem agora. */
export function contarErros(erros: ErrosCampo): number {
  return Object.values(erros).filter(Boolean).length;
}
