"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  /**
   * Torna a coluna ordenável. Sem `sortValue`, ordena pelo campo `key` da linha;
   * com ele, dá para ordenar por algo diferente do que é exibido (ex.: data ISO
   * por trás de um texto formatado).
   */
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
};

type Ordem = { key: string; dir: "asc" | "desc" } | null;

/** Tabela reutilizável: colunas configuráveis, filtro de texto opcional,
 *  ordenação por coluna e estado vazio. Padrão das listagens (DESIGN.md §7.4). */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  getFilterText,
  filterPlaceholder = "Filtrar…",
  empty = "Nenhum registro.",
  action,
}: {
  columns: Column<T>[];
  rows: T[];
  getFilterText?: (row: T) => string;
  filterPlaceholder?: string;
  empty?: ReactNode;
  /** Ação exibida na mesma linha do filtro (ex.: botão "Nova tela"). */
  action?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [ordem, setOrdem] = useState<Ordem>(null);

  const filtered = useMemo(() => {
    if (!getFilterText || !q.trim()) return rows;
    const t = q.toLowerCase();
    return rows.filter((r) => getFilterText(r).toLowerCase().includes(t));
  }, [rows, q, getFilterText]);

  const visiveis = useMemo(() => {
    if (!ordem) return filtered;
    const col = columns.find((c) => c.key === ordem.key);
    if (!col) return filtered;
    const valor = (r: T): string | number =>
      col.sortValue
        ? col.sortValue(r)
        : ((r as Record<string, unknown>)[col.key] as string | number) ?? "";
    const sinal = ordem.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = valor(a);
      const vb = valor(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * sinal;
      return String(va).localeCompare(String(vb), "pt-BR", { numeric: true }) * sinal;
    });
  }, [filtered, ordem, columns]);

  function alternar(key: string) {
    setOrdem((o) =>
      o?.key === key
        ? o.dir === "asc"
          ? { key, dir: "desc" }
          : null // 3º clique volta à ordem original
        : { key, dir: "asc" },
    );
  }

  return (
    <div className="space-y-3">
      {(getFilterText || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {getFilterText ? (
            <Input
              placeholder={filterPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      {/* Livro-razão: cabeçalho rubricado, filete duplo e linhas regradas. */}
      {/* Tabela: só do md para cima. Abaixo disso vira lista de cards —
          6 colunas não cabem em 375px. */}
      <div className="hidden overflow-x-auto rounded-sm border border-border bg-card shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-double border-border bg-muted/60 text-left text-[11px] uppercase tracking-[0.12em] text-brand">
            <tr>
              {columns.map((c) => {
                const ativo = ordem?.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={cn("px-4 py-2.5 font-semibold", c.className)}
                    aria-sort={
                      ativo
                        ? ordem!.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => alternar(c.key)}
                        className="inline-flex items-center gap-1 uppercase tracking-[0.12em] hover:underline"
                      >
                        {c.header}
                        {ativo ? (
                          ordem!.dir === "asc" ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )
                        ) : (
                          <span className="opacity-30">↕</span>
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visiveis.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              visiveis.map((row) => (
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

      {/* Cards — mobile */}
      <ul className="space-y-2 md:hidden">
        {visiveis.length === 0 ? (
          <li className="rounded-sm border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
            {empty}
          </li>
        ) : (
          visiveis.map((row) => (
            <li
              key={row.id}
              className="rounded-sm border border-border bg-card p-3 shadow-sm"
            >
              <dl className="space-y-1.5">
                {columns.map((c) => {
                  const conteudo = c.render
                    ? c.render(row)
                    : String((row as Record<string, unknown>)[c.key] ?? "");
                  return (
                    <div key={c.key} className="flex flex-wrap items-baseline gap-x-2">
                      <dt className="min-w-[5.5rem] text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        {c.header}
                      </dt>
                      <dd className="min-w-0 flex-1 text-sm">{conteudo}</dd>
                    </div>
                  );
                })}
              </dl>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
