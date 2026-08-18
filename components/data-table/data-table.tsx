"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

/** Tabela reutilizável: colunas configuráveis, filtro de texto opcional e
 *  estado vazio. Padrão das listagens (DESIGN.md §7.4). */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  getFilterText,
  filterPlaceholder = "Filtrar…",
  empty = "Nenhum registro.",
}: {
  columns: Column<T>[];
  rows: T[];
  getFilterText?: (row: T) => string;
  filterPlaceholder?: string;
  empty?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!getFilterText || !q.trim()) return rows;
    const t = q.toLowerCase();
    return rows.filter((r) => getFilterText(r).toLowerCase().includes(t));
  }, [rows, q, getFilterText]);

  return (
    <div className="space-y-3">
      {getFilterText && (
        <Input
          placeholder={filterPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
      )}
      {/* Livro-razão: cabeçalho rubricado, filete duplo e linhas regradas. */}
      <div className="overflow-hidden rounded-sm border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-double border-border bg-muted/60 text-left text-[11px] uppercase tracking-[0.12em] text-brand">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cn("px-4 py-2.5 font-semibold", c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-border/70 transition-colors odd:bg-background/30 hover:bg-brand-subtle/60"
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3", c.className)}>
                      {c.render
                        ? c.render(row)
                        : String((row as Record<string, unknown>)[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
