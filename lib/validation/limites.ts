/**
 * Limite de caracteres dos campos de texto, em um lugar só: os schemas do Zod,
 * o `maxLength` dos formulários e as constraints do banco (migração 0021)
 * usam estes mesmos números.
 */
export const LIMITES = {
  telaNome: 70,
  marqueeNome: 70,
  marqueeItemTitulo: 70,
  bannerNome: 70,
  eventoNome: 120,
  musicaNome: 120,
  colecaoNome: 120,
  colaboradorNome: 200,
  roleNome: 200,
  conteudoTitulo: 120,
  categoriaNome: 70,
  statusNome: 70,
} as const;

/** Mensagem única para não variar de campo para campo. */
export const excedeu = (max: number) => `Máximo de ${max} caracteres`;
