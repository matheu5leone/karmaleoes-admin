/**
 * Opções de "itens por página" das listagens. Fica fora do componente porque a
 * página do histórico (servidor) também valida o parâmetro da URL com ela.
 */
export const TAMANHOS_PAGINA = [10, 25, 50] as const;
export const TAMANHO_PAGINA_PADRAO = 25;
