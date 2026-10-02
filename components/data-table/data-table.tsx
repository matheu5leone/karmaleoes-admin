"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  TAMANHOS_PAGINA,
  TAMANHO_PAGINA_PADRAO,
} from "@/components/data-table/tamanhos";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  /**
   * Valor da célula para ordenar e filtrar. O padrão é `row[key]` — defina
   * quando o que importa não é o campo cru (data ISO por trás de um texto
   * formatado, nome da coleção em vez do id, etc.).
   */
  valor?: (row: T) => string | number | null | undefined;
  /** Coluna sem dado próprio (ações, miniatura): não ordena nem filtra. */
  estatica?: boolean;
};

type Ordem = { key: string; dir: "asc" | "desc" } | null;

/** Até esta quantidade de valores distintos, o filtro da coluna vira lista. */
const MAX_OPCOES = 8;

/** Sem acento e em minúsculas: "São" casa com "sao". */
function normalizar(v: unknown): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Tabela padrão das listagens (DESIGN.md §7.4): ordenação e filtro em toda
 * coluna com dado, busca geral opcional, paginação de 10/25/50 e, abaixo do
 * `md`, lista de cards — seis colunas não cabem em 375px.
 */
export function DataTable<T extends { id: string }>({
  id,
  columns,
  rows,
  getFilterText,
  filterPlaceholder = "Filtrar…",
  empty = "Nenhum registro.",
  action,
}: {
  /** Identifica a tabela para lembrar os itens por página entre visitas. */
  id?: string;
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
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const [porPagina, setPorPagina] = useState<number>(TAMANHO_PAGINA_PADRAO);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    if (!id) return;
    try {
      const salvo = Number(localStorage.getItem(`karma-tabela-${id}-porpagina`));
      if (TAMANHOS_PAGINA.includes(salvo as (typeof TAMANHOS_PAGINA)[number])) {
        setPorPagina(salvo);
      }
    } catch {
      /* sem storage: fica no padrão */
    }
  }, [id]);

  function mudarPorPagina(n: number) {
    setPorPagina(n);
    setPagina(1);
    if (!id) return;
    try {
      localStorage.setItem(`karma-tabela-${id}-porpagina`, String(n));
    } catch {
      /* ignora */
    }
  }

  const valorDe = (c: Column<T>, r: T): string | number =>
    (c.valor ? c.valor(r) : (r as Record<string, unknown>)[c.key]) as
      | string
      | number;

  const colunasFiltraveis = useMemo(
    () => columns.filter((c) => !c.estatica),
    [columns],
  );

  /** Colunas com poucos valores distintos ganham lista em vez de campo livre. */
  const opcoesPorColuna = useMemo(() => {
    const mapa: Record<string, string[]> = {};
    for (const c of colunasFiltraveis) {
      const vistos = new Set<string>();
      for (const r of rows) {
        const v = valorDe(c, r);
        if (v === null || v === undefined || v === "") continue;
        vistos.add(String(v));
        if (vistos.size > MAX_OPCOES) break;
      }
      if (vistos.size > 0 && vistos.size <= MAX_OPCOES) {
        mapa[c.key] = [...vistos].sort((a, b) =>
          a.localeCompare(b, "pt-BR", { numeric: true }),
        );
      }
    }
    return mapa;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colunasFiltraveis, rows]);

  const filtradas = useMemo(() => {
    const busca = normalizar(q).trim();
    return rows.filter((r) => {
      if (busca && getFilterText && !normalizar(getFilterText(r)).includes(busca)) {
        return false;
      }
      for (const [key, termo] of Object.entries(filtros)) {
        if (!termo) continue;
        const col = columns.find((c) => c.key === key);
        if (!col) continue;
        const valor = normalizar(valorDe(col, r));
        // Lista: casa exato. Campo livre: casa pedaço.
        const exato = opcoesPorColuna[key]?.length;
        if (exato ? valor !== normalizar(termo) : !valor.includes(normalizar(termo))) {
          return false;
        }
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, filtros, columns, getFilterText, opcoesPorColuna]);

  const ordenadas = useMemo(() => {
    if (!ordem) return filtradas;
    const col = columns.find((c) => c.key === ordem.key);
    if (!col) return filtradas;
    const sinal = ordem.dir === "asc" ? 1 : -1;
    return [...filtradas].sort((a, b) => {
      const va = valorDe(col, a) ?? "";
      const vb = valorDe(col, b) ?? "";
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * sinal;
      return (
        String(va).localeCompare(String(vb), "pt-BR", { numeric: true }) * sinal
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtradas, ordem, columns]);

  const total = ordenadas.length;
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  // Apagar linhas ou apertar o filtro pode deixar a página atual no vazio.
  const paginaAtual = Math.min(pagina, paginas);
  const inicio = (paginaAtual - 1) * porPagina;
  const visiveis = ordenadas.slice(inicio, inicio + porPagina);

  function alternar(key: string) {
    setPagina(1);
    setOrdem((o) =>
      o?.key === key
        ? o.dir === "asc"
          ? { key, dir: "desc" }
          : null // 3º clique volta à ordem original
        : { key, dir: "asc" },
    );
  }

  function filtrar(key: string, v: string) {
    setPagina(1);
    setFiltros((f) => ({ ...f, [key]: v }));
  }

  return (
    <div className="space-y-3">
      {(getFilterText || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {getFilterText ? (
            <Input
              placeholder={filterPlaceholder}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPagina(1);
              }}
              className="max-w-xs"
            />
          ) : (
            <span />
          )}
          {action}
        </div>
      )}

      {/* Livro-razão: cabeçalho rubricado, filete duplo e linhas regradas. */}
      <div className="hidden overflow-x-auto rounded-sm border border-border bg-card shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-double border-border bg-muted/60 text-left text-[11px] uppercase tracking-[0.12em] text-brand">
            <tr>
              {columns.map((c) => {
                const ativo = ordem?.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={cn("px-4 pt-2.5 font-semibold", c.className)}
                    aria-sort={
                      ativo
                        ? ordem!.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    {c.estatica ? (
                      c.header
                    ) : (
                      <button
                        type="button"
                        onClick={() => alternar(c.key)}
                        title={`Ordenar por ${c.header || c.key}`}
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
                    )}
                  </th>
                );
              })}
            </tr>
            <tr>
              {columns.map((c) => {
                const opcoes = opcoesPorColuna[c.key];
                return (
                  <th key={c.key} className="px-2 pb-2 pt-1 font-normal">
                    {c.estatica ? null : opcoes ? (
                      <Select
                        aria-label={`Filtrar por ${c.header || c.key}`}
                        value={filtros[c.key] ?? ""}
                        onChange={(e) => filtrar(c.key, e.target.value)}
                        className="h-8 w-full min-w-24 text-xs"
                      >
                        <option value="">Todos</option>
                        {opcoes.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        aria-label={`Filtrar por ${c.header || c.key}`}
                        placeholder="Filtrar"
                        value={filtros[c.key] ?? ""}
                        onChange={(e) => filtrar(c.key, e.target.value)}
                        className="h-8 w-full min-w-24 text-xs"
                      />
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

      <Paginacao
        total={total}
        inicio={inicio}
        mostrados={visiveis.length}
        pagina={paginaAtual}
        paginas={paginas}
        porPagina={porPagina}
        onPagina={setPagina}
        onPorPagina={mudarPorPagina}
      />
    </div>
  );
}

function Paginacao({
  total,
  inicio,
  mostrados,
  pagina,
  paginas,
  porPagina,
  onPagina,
  onPorPagina,
}: {
  total: number;
  inicio: number;
  mostrados: number;
  pagina: number;
  paginas: number;
  porPagina: number;
  onPagina: (p: number) => void;
  onPorPagina: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <p>
        {total === 0
          ? "Nenhum registro"
          : `${inicio + 1}–${inicio + mostrados} de ${total}`}
      </p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5">
          <span className="whitespace-nowrap text-xs">Por página</span>
          <Select
            value={String(porPagina)}
            onChange={(e) => onPorPagina(Number(e.target.value))}
            className="h-8 w-[4.5rem] text-xs"
          >
            {TAMANHOS_PAGINA.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </label>
        {paginas > 1 && (
          <div className="flex items-center gap-1">
            <BotaoPagina
              rotulo="Página anterior"
              desabilitado={pagina <= 1}
              onClick={() => onPagina(pagina - 1)}
            >
              <ChevronLeft className="size-4" />
            </BotaoPagina>
            <span className="px-1 text-xs tabular-nums">
              {pagina} / {paginas}
            </span>
            <BotaoPagina
              rotulo="Próxima página"
              desabilitado={pagina >= paginas}
              onClick={() => onPagina(pagina + 1)}
            >
              <ChevronRight className="size-4" />
            </BotaoPagina>
          </div>
        )}
      </div>
    </div>
  );
}

function BotaoPagina({
  rotulo,
  desabilitado,
  onClick,
  children,
}: {
  rotulo: string;
  desabilitado: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      aria-label={rotulo}
      title={rotulo}
      className="rounded-sm border border-border p-1 transition-colors hover:border-brand hover:text-foreground disabled:opacity-40 disabled:hover:border-border"
    >
      {children}
    </button>
  );
}
