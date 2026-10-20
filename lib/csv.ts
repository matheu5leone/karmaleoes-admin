/**
 * CSV para abrir no Excel em português: separador `;` (o Excel pt-BR usa a
 * vírgula como decimal) e BOM no início, senão os acentos chegam quebrados.
 */
const SEP = ";";

function celula(v: unknown): string {
  const t = v == null ? "" : String(v);
  // Aspas, separador e quebra de linha obrigam a envolver o campo.
  return /["\n\r;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

export function paraCsv(cabecalhos: string[], linhas: unknown[][]): string {
  const corpo = [cabecalhos, ...linhas]
    .map((l) => l.map(celula).join(SEP))
    .join("\r\n");
  return `﻿${corpo}`;
}

/** Nome de arquivo com a data, sem caracteres que o sistema recuse. */
export function nomeArquivo(base: string): string {
  const agora = new Date()
    .toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
    .replace(/[: ]/g, "-");
  return `${base}-${agora}.csv`;
}
