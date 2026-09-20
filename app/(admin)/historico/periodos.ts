/** Períodos do filtro de logs. `custom` usa os campos de data livres. */
export const PERIODOS = {
  "24h": { rotulo: "Últimas 24 horas", horas: 24 },
  "7d": { rotulo: "Últimos 7 dias", horas: 24 * 7 },
  "15d": { rotulo: "Últimos 15 dias", horas: 24 * 15 },
  "30d": { rotulo: "Últimos 30 dias", horas: 24 * 30 },
  "3m": { rotulo: "Últimos 3 meses", horas: 24 * 90 },
  custom: { rotulo: "Personalizado", horas: null },
} as const;

export type Periodo = keyof typeof PERIODOS;

export const PERIODO_PADRAO: Periodo = "7d";

export function normalizarPeriodo(v?: string): Periodo {
  return v && v in PERIODOS ? (v as Periodo) : PERIODO_PADRAO;
}
