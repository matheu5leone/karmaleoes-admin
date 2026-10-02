"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  SlidersHorizontal,
  X,
} from "lucide-react";
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
  /**
   * Coluna sem dado próprio: não ordena nem filtra. No card do celular, uma
   * coluna estática **com** cabeçalho vira rodapé de ações; **sem** cabeçalho,
   * vira a miniatura à esquerda.
   */
  estatica?: boolean;
  /** No card do celular, ocupa a linha inteira em vez de meia (campos largos). */
  cardLargo?: boolean;
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
  // No celular não há cabeçalho de tabela: filtros e ordenação vêm deste painel.
  const [painel, setPainel] = useState(false);

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

  /**
   * Papéis no card do celular. A primeira coluna com dado é o título da linha
   * — repetir o rótulo dela ali seria ruído; as demais viram meta em duas
   * colunas, e as estáticas vão para miniatura ou rodapé.
   */
  const papeis = useMemo(() => {
    const [titulo, ...meta] = colunasFiltraveis;
    return {
      titulo,
      meta,
      midia: columns.find((c) => c.estatica && !c.header),
      acoes: columns.filter((c) => c.estatica && c.header),
    };
  }, [columns, colunasFiltraveis]);

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

  const ativos = Object.values(filtros).filter(Boolean).length;

  function limparFiltros() {
    setPagina(1);
    setFiltros({});
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

      {/* Controles do celular: o cabeçalho da tabela some abaixo do md, então
          filtro por coluna e ordenação ganham painel próprio. */}
      <div className="space-y-2 md:hidden">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPainel((v) => !v)}
            aria-expanded={painel}
            className={cn(
              "flex h-10 flex-1 items-center justify-center gap-2 rounded-sm border text-sm transition-colors",
              ativos
                ? "border-brand bg-brand-subtle text-brand"
                : "border-border text-muted-foreground",
            )}
          >
            <SlidersHorizontal className="size-4" />
            Filtros
            {ativos > 0 && (
              <span className="rounded-full bg-brand px-1.5 text-xs font-semibold text-brand-foreground">
                {ativos}
              </span>
            )}
            <ChevronDown
              aria-hidden
              className={cn(
                "size-4 transition-transform duration-150",
                painel && "rotate-180",
              )}
            />
          </button>
          <div className="flex flex-1 gap-1">
            <Select
              aria-label="Ordenar por"
              value={ordem?.key ?? ""}
              onChange={(e) => {
                setPagina(1);
                setOrdem(e.target.value ? { key: e.target.value, dir: "asc" } : null);
              }}
              className="h-10 min-w-0 flex-1 text-sm"
            >
              <option value="">Ordenar por…</option>
              {colunasFiltraveis.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.header || c.key}
                </option>
              ))}
            </Select>
            <button
              type="button"
              disabled={!ordem}
              onClick={() =>
                setOrdem((o) =>
                  o ? { ...o, dir: o.dir === "asc" ? "desc" : "asc" } : o,
                )
              }
              aria-label={
                ordem?.dir === "desc" ? "Ordenar crescente" : "Ordenar decrescente"
              }
              className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors disabled:opacity-40"
            >
              {ordem?.dir === "desc" ? (
                <ChevronDown className="size-4" />
              ) : ordem ? (
                <ChevronUp className="size-4" />
              ) : (
                <ArrowDownUp className="size-4" />
              )}
            </button>
          </div>
        </div>

        {painel && (
          <div className="space-y-2 rounded-sm border border-border bg-card p-3">
            {colunasFiltraveis.map((c) => (
              <label key={c.key} className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {c.header || c.key}
                </span>
                <CampoFiltro
                  coluna={c}
                  opcoes={opcoesPorColuna[c.key]}
                  valor={filtros[c.key] ?? ""}
                  onChange={(v) => filtrar(c.key, v)}
                  className="h-10 w-full text-sm"
                />
              </label>
            ))}
            <button
              type="button"
              onClick={limparFiltros}
              disabled={!ativos}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-sm border border-border text-sm text-muted-foreground transition-colors disabled:opacity-40"
            >
              <X className="size-4" />
              Limpar filtros
            </button>
          </div>
        )}
      </div>

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
                    {c.estatica ? null : (
                      <CampoFiltro
                        coluna={c}
                        opcoes={opcoes}
                        valor={filtros[c.key] ?? ""}
                        onChange={(v) => filtrar(c.key, v)}
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
                      {celula(c, row)}
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
            <Card key={row.id} row={row} papeis={papeis} />
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

/** Conteúdo de uma célula: o `render` da coluna ou o campo cru. */
function celula<T>(c: Column<T>, row: T): ReactNode {
  return c.render
    ? c.render(row)
    : String((row as Record<string, unknown>)[c.key] ?? "");
}

/** Linha como card — o formato do celular, onde a tabela não cabe. */
function Card<T extends { id: string }>({
  row,
  papeis,
}: {
  row: T;
  papeis: {
    titulo?: Column<T>;
    meta: Column<T>[];
    midia?: Column<T>;
    acoes: Column<T>[];
  };
}) {
  const { titulo, meta, midia, acoes } = papeis;
  return (
    <li className="rounded-sm border border-border bg-card px-3 py-2.5 shadow-sm">
      <div className="flex gap-3">
        {midia && <div className="shrink-0">{celula(midia, row)}</div>}
        <div className="min-w-0 flex-1">
          {titulo && (
            <div className="truncate font-medium leading-snug">
              {celula(titulo, row)}
            </div>
          )}
          {/* Meta e ações dividem a mesma faixa: rótulo ao lado do valor (e não
              acima) e os botões à direita. Empilhado, cada card virava uma
              coluna de cinco linhas quase vazias. */}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
            {meta.length > 0 && (
              <dl className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                {meta.map((c) => (
                  <div
                    key={c.key}
                    className={cn(
                      "flex min-w-0 items-baseline gap-1.5",
                      c.cardLargo && "w-full",
                    )}
                  >
                    <dt className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {c.header}
                    </dt>
                    <dd className="min-w-0 truncate text-sm">{celula(c, row)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {acoes.length > 0 && (
              <div className="ml-auto flex flex-wrap items-center gap-1">
                {acoes.map((c) => (
                  <div key={c.key}>{celula(c, row)}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/** Campo de filtro de uma coluna — o mesmo no cabeçalho e no painel do celular. */
function CampoFiltro<T>({
  coluna,
  opcoes,
  valor,
  onChange,
  className,
}: {
  coluna: Column<T>;
  opcoes?: string[];
  valor: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const rotulo = `Filtrar por ${coluna.header || coluna.key}`;
  return opcoes ? (
    <Select
      aria-label={rotulo}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className={className}
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
      aria-label={rotulo}
      placeholder="Filtrar"
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
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
            className="h-9 w-[4.5rem] text-xs md:h-8"
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
      className="flex size-9 items-center justify-center rounded-sm border border-border transition-colors hover:border-brand hover:text-foreground disabled:opacity-40 disabled:hover:border-border md:size-7"
    >
      {children}
    </button>
  );
}
