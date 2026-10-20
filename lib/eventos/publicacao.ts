/**
 * Regra para o evento entrar no Hub (`enable`).
 *
 * Um card no site precisa de nome, data, onde é e em que categoria entra —
 * sem isso o visitante vê um buraco. E evento encerrado não volta à vitrine:
 * se saiu de cartaz, sai do ar.
 */
export type CamposDoEvento = {
  nome?: string | null;
  data?: string | null;
  local?: string | null;
  category_id?: string | null;
  lifecycle?: string | null;
};

const OBRIGATORIOS: { campo: keyof CamposDoEvento; rotulo: string }[] = [
  { campo: "nome", rotulo: "nome" },
  { campo: "data", rotulo: "data" },
  { campo: "local", rotulo: "local" },
  { campo: "category_id", rotulo: "categoria" },
];

/** O que falta para o evento poder ir ao ar. Vazio = pode publicar. */
export function impedimentosParaPublicar(e: CamposDoEvento): string[] {
  const faltas = OBRIGATORIOS.filter(({ campo }) => {
    const v = e[campo];
    return v === null || v === undefined || String(v).trim() === "";
  }).map(({ rotulo }) => rotulo);

  if (e.lifecycle === "Encerrado") faltas.unshift("evento encerrado");
  return faltas;
}

export const podePublicar = (e: CamposDoEvento) =>
  impedimentosParaPublicar(e).length === 0;

/** Frase pronta para o tooltip e para o erro da action. */
export function motivoDeNaoPublicar(e: CamposDoEvento): string | null {
  const faltas = impedimentosParaPublicar(e);
  if (faltas.length === 0) return null;
  if (faltas[0] === "evento encerrado") {
    return "Evento encerrado não vai ao Hub.";
  }
  return `Falta preencher: ${faltas.join(", ")}.`;
}
