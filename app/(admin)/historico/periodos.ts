/** Períodos do filtro de logs. `custom` usa os campos de data livres. */
// `rotulo` vai no seletor; `frase` e `verFrase` entram em texto corrido, por
// isso trazem a preposição e o artigo prontos — a concordância muda entre
// "nas últimas 24 horas" e "nos últimos 7 dias".
export const PERIODOS = {
  "24h": {
    rotulo: "Últimas 24 horas",
    frase: "nas últimas 24 horas",
    verFrase: "as últimas 24 horas",
    horas: 24,
  },
  "7d": {
    rotulo: "Últimos 7 dias",
    frase: "nos últimos 7 dias",
    verFrase: "os últimos 7 dias",
    horas: 24 * 7,
  },
  "15d": {
    rotulo: "Últimos 15 dias",
    frase: "nos últimos 15 dias",
    verFrase: "os últimos 15 dias",
    horas: 24 * 15,
  },
  "30d": {
    rotulo: "Últimos 30 dias",
    frase: "nos últimos 30 dias",
    verFrase: "os últimos 30 dias",
    horas: 24 * 30,
  },
  "3m": {
    rotulo: "Últimos 3 meses",
    frase: "nos últimos 3 meses",
    verFrase: "os últimos 3 meses",
    horas: 24 * 90,
  },
  custom: {
    rotulo: "Personalizado",
    frase: "no período escolhido",
    verFrase: "o período escolhido",
    horas: null,
  },
} as const;

export type Periodo = keyof typeof PERIODOS;

export const PERIODO_PADRAO: Periodo = "24h";

/**
 * Janela seguinte, para o atalho do estado vazio. As últimas 24h costumam não
 * ter movimento nenhum, então a tela oferece o próximo período em vez de
 * deixar o usuário achando que o log quebrou.
 */
export const PROXIMO_PERIODO: Partial<Record<Periodo, Periodo>> = {
  "24h": "7d",
  "7d": "15d",
  "15d": "30d",
  "30d": "3m",
};

export function normalizarPeriodo(v?: string): Periodo {
  return v && v in PERIODOS ? (v as Periodo) : PERIODO_PADRAO;
}
