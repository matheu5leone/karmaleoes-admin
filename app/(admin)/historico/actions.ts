"use server";

import { createClient } from "@/lib/supabase/server";
import { getContaAtual } from "@/lib/conta";
import { paraCsv } from "@/lib/csv";
import { PERIODOS, normalizarPeriodo } from "./periodos";

/** Teto do arquivo: o histórico cresce sem parar e ninguém abre 50 mil linhas. */
const MAX_LINHAS = 5000;

export type FiltrosExport = {
  entidade?: string;
  acao?: string;
  autor?: string;
  periodo?: string;
  de?: string;
  ate?: string;
  ordem?: string;
  dir?: string;
};

export type ExportResult =
  | { ok: true; csv: string; linhas: number; truncado: boolean }
  | { ok: false; error: string };

/**
 * Exporta o histórico **com os filtros da tela**, não só a página visível —
 * por isso a consulta roda de novo aqui em vez de usar as linhas do cliente.
 */
export async function exportarHistorico(f: FiltrosExport): Promise<ExportResult> {
  if (!(await getContaAtual()).isSuper) {
    return { ok: false, error: "Sem permissão." };
  }

  const supabase = await createClient();
  let q = supabase
    .from("audit_log")
    .select("acao, entidade, registro_id, diff, user_id, created_at");

  if (f.entidade) q = q.eq("entidade", f.entidade);
  if (f.acao) q = q.eq("acao", f.acao);
  if (f.autor) q = q.eq("user_id", f.autor);

  const horas = PERIODOS[normalizarPeriodo(f.periodo)].horas;
  if (horas === null) {
    if (f.de) q = q.gte("created_at", `${f.de}T00:00:00`);
    if (f.ate) q = q.lte("created_at", `${f.ate}T23:59:59`);
  } else {
    q = q.gte("created_at", new Date(Date.now() - horas * 3600_000).toISOString());
  }

  const ordem = f.ordem ?? "created_at";
  const [{ data, error }, { data: admins }] = await Promise.all([
    q.order(ordem, { ascending: f.dir === "asc" }).limit(MAX_LINHAS + 1),
    supabase.from("admin_user").select("id, email"),
  ]);
  if (error) return { ok: false, error: error.message };

  const emailPorId = new Map((admins ?? []).map((a) => [a.id, a.email] as const));
  const todas = data ?? [];
  const truncado = todas.length > MAX_LINHAS;
  const linhas = truncado ? todas.slice(0, MAX_LINHAS) : todas;

  const csv = paraCsv(
    ["Data/hora", "Ação", "Entidade", "Registro", "Autor", "Campos alterados"],
    linhas.map((l) => [
      new Date(l.created_at).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }),
      l.acao,
      l.entidade,
      l.registro_id ?? "",
      l.user_id ? (emailPorId.get(l.user_id) ?? l.user_id) : "fora do painel",
      // Só os nomes dos campos: o conteúdo antes/depois não cabe numa célula.
      l.diff && typeof l.diff === "object"
        ? Object.keys(l.diff as Record<string, unknown>).join(", ")
        : "",
    ]),
  );

  return { ok: true, csv, linhas: linhas.length, truncado };
}
