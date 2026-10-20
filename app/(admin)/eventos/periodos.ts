/**
 * Períodos do filtro de eventos — mesma mecânica do histórico (um seletor mais
 * "Personalizado" com de/até), só que a janela aqui é a **data do evento**,
 * que também olha para a frente. "Últimas 24 horas" não faria sentido num
 * cartaz de shows.
 */
export const PERIODOS_EVENTO = {
  todos: { rotulo: "Todos", dias: null, futuro: null },
  "7d": { rotulo: "Próximos 7 dias", dias: 7, futuro: true },
  "30d": { rotulo: "Próximos 30 dias", dias: 30, futuro: true },
  "3m": { rotulo: "Próximos 3 meses", dias: 90, futuro: true },
  futuros: { rotulo: "Todos os futuros", dias: null, futuro: true },
  passados: { rotulo: "Já passaram", dias: null, futuro: false },
  custom: { rotulo: "Personalizado", dias: null, futuro: null },
} as const;

export type PeriodoEvento = keyof typeof PERIODOS_EVENTO;

export const PERIODO_EVENTO_PADRAO: PeriodoEvento = "todos";

/** Hoje em yyyy-mm-dd, no fuso de São Paulo. */
export function hojeISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/** Data de hoje + `dias`, em yyyy-mm-dd. */
function emDias(dias: number): string {
  return new Date(Date.now() + dias * 86400_000).toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}

/**
 * Intervalo fechado [de, ate] que o período representa. `null` em uma ponta
 * significa sem limite daquele lado.
 */
export function intervaloDoPeriodo(
  periodo: PeriodoEvento,
  de: string,
  ate: string,
): { de: string | null; ate: string | null } {
  const hoje = hojeISO();
  switch (periodo) {
    case "todos":
      return { de: null, ate: null };
    case "futuros":
      return { de: hoje, ate: null };
    case "passados":
      return { de: null, ate: hoje };
    case "custom":
      return { de: de || null, ate: ate || null };
    default:
      return { de: hoje, ate: emDias(PERIODOS_EVENTO[periodo].dias ?? 0) };
  }
}

/** A data do evento cai no período? Comparação em texto ISO, que é ordenável. */
export function dentroDoPeriodo(
  data: string,
  periodo: PeriodoEvento,
  de: string,
  ate: string,
): boolean {
  const faixa = intervaloDoPeriodo(periodo, de, ate);
  if (faixa.de && data < faixa.de) return false;
  if (faixa.ate && data > faixa.ate) return false;
  return true;
}
