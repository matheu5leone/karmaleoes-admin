"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, FilePlus2, Minus, PenLine, Plus, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { ShieldBadge, type Tinctura } from "@/components/heraldry/shield-badge";
import { cn } from "@/lib/utils";

export type LogRow = {
  id: string;
  acao: string;
  entidade: string;
  registroId: string | null;
  antes: Record<string, unknown> | null;
  depois: Record<string, unknown> | null;
  diff: Record<string, unknown> | null;
  autor: string;
  createdAt: string;
};

const ACAO: Record<string, { rotulo: string; Icone: typeof Plus; tinctura: Tinctura }> = {
  create: { rotulo: "criou", Icone: FilePlus2, tinctura: "vert" },
  update: { rotulo: "alterou", Icone: PenLine, tinctura: "azure" },
  delete: { rotulo: "removeu", Icone: Trash2, tinctura: "gules" },
};
const acaoDe = (a: string) => ACAO[a] ?? ACAO.update;

/** Campos que servem de rótulo humano, na ordem de preferência. */
const CAMPOS_ROTULO = ["nome", "titulo", "email", "name", "rota"];

/**
 * Nome legível do registro. Vem do snapshot gravado no próprio log, então
 * continua funcionando mesmo depois de a linha ser excluída do banco.
 */
function rotuloDoRegistro(l: LogRow): string | null {
  const fonte = l.depois ?? l.antes;
  if (!fonte) return null;
  for (const c of CAMPOS_ROTULO) {
    const v = fonte[c];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

/** "2026-09-03T01:42:27Z" → "03/09/2026 01:42:27" (São Paulo). */
function dataHora(iso: string): string {
  const f = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t: string) => f.find((x) => x.type === t)?.value ?? "00";
  return `${g("day")}/${g("month")}/${g("year")} ${g("hour")}:${g("minute")}:${g("second")}`;
}

function valorSql(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

/**
 * Instrução SQL **equivalente**, reconstruída a partir do que o trigger gravou.
 * Não é a query capturada: as escritas passam pelo PostgREST, então não existe
 * texto de SQL em lugar nenhum para guardar.
 */
function sqlEquivalente(l: LogRow): string {
  const tabela = `public.${l.entidade}`;
  const onde = l.registroId ? ` where id = '${l.registroId}'` : "";

  if (l.acao === "create" && l.depois) {
    const cols = Object.keys(l.depois);
    const vals = cols.map((c) => valorSql(l.depois![c]));
    return `insert into ${tabela}\n  (${cols.join(", ")})\nvalues\n  (${vals.join(", ")});`;
  }
  if (l.acao === "delete") {
    return `delete from ${tabela}${onde};`;
  }
  const campos = l.diff ?? {};
  const sets = Object.keys(campos).map((c) => `  ${c} = ${valorSql(campos[c])}`);
  if (!sets.length) return `-- sem detalhe registrado para esta alteração`;
  return `update ${tabela} set\n${sets.join(",\n")}\n${onde.trim()};`;
}

function Seta({ ativo, dir }: { ativo: boolean; dir: string }) {
  if (!ativo) return <span className="opacity-30">↕</span>;
  return dir === "asc" ? (
    <ChevronUp className="size-3.5" />
  ) : (
    <ChevronDown className="size-3.5" />
  );
}

export function HistoricoTabela({
  logs,
  total,
  pagina,
  porPagina,
  ordem,
  dir,
  filtros,
  entidadesDisponiveis,
  autoresDisponiveis,
}: {
  logs: LogRow[];
  total: number;
  pagina: number;
  porPagina: number;
  ordem: string;
  dir: string;
  filtros: { entidade: string; acao: string; autor: string; de: string; ate: string };
  entidadesDisponiveis: string[];
  autoresDisponiveis: { id: string; email: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [aberto, setAberto] = useState<string | null>(null);

  /** Monta a URL preservando os demais parâmetros. */
  function comParams(mudancas: Record<string, string | null>): string {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(mudancas)) {
      if (v === null || v === "") p.delete(k);
      else p.set(k, v);
    }
    return `${pathname}?${p.toString()}`;
  }

  function ordenarPor(col: string) {
    const inverte = ordem === col && dir === "desc" ? "asc" : "desc";
    return comParams({ ordem: col, dir: inverte, pagina: null });
  }

  function filtrar(campo: string, valor: string) {
    router.push(comParams({ [campo]: valor || null, pagina: null }));
  }

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  const colunas: { chave: string; rotulo: string; ordenavel?: boolean }[] = [
    { chave: "created_at", rotulo: "Data/hora", ordenavel: true },
    { chave: "autor", rotulo: "Autor" },
    { chave: "acao", rotulo: "Ação", ordenavel: true },
    { chave: "entidade", rotulo: "Entidade", ordenavel: true },
    { chave: "registro_id", rotulo: "Registro", ordenavel: true },
    { chave: "diff", rotulo: "Alterações" },
  ];

  return (
    <div className="space-y-3">
      {/* filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Entidade" htmlFor="f-ent" className="space-y-1.5">
          <Select id="f-ent" value={filtros.entidade} className="w-44"
            onChange={(e) => filtrar("entidade", e.target.value)}>
            <option value="">Todas</option>
            {entidadesDisponiveis.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
        </Field>
        <Field label="Ação" htmlFor="f-acao" className="space-y-1.5">
          <Select id="f-acao" value={filtros.acao} className="w-36"
            onChange={(e) => filtrar("acao", e.target.value)}>
            <option value="">Todas</option>
            <option value="create">criou</option>
            <option value="update">alterou</option>
            <option value="delete">removeu</option>
          </Select>
        </Field>
        <Field label="Autor" htmlFor="f-autor" className="space-y-1.5">
          <Select id="f-autor" value={filtros.autor} className="w-56"
            onChange={(e) => filtrar("autor", e.target.value)}>
            <option value="">Todos</option>
            {autoresDisponiveis.map((a) => <option key={a.id} value={a.id}>{a.email}</option>)}
          </Select>
        </Field>
        <Field label="De" htmlFor="f-de" className="space-y-1.5">
          <Input id="f-de" type="date" value={filtros.de} className="w-40"
            onChange={(e) => filtrar("de", e.target.value)} />
        </Field>
        <Field label="Até" htmlFor="f-ate" className="space-y-1.5">
          <Input id="f-ate" type="date" value={filtros.ate} className="w-40"
            onChange={(e) => filtrar("ate", e.target.value)} />
        </Field>
        <span className="pb-2 text-sm text-muted-foreground">{total} registro{total === 1 ? "" : "s"}</span>
      </div>

      <div className="overflow-x-auto rounded-sm border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-double border-border bg-muted/60 text-left text-[11px] uppercase tracking-[0.12em] text-brand">
            <tr>
              <th className="w-8 px-2 py-3" aria-label="Detalhe" />
              {colunas.map((c) => (
                <th key={c.chave} className="px-4 py-3 font-semibold"
                  aria-sort={ordem === c.chave ? (dir === "asc" ? "ascending" : "descending") : undefined}>
                  {c.ordenavel ? (
                    <Link href={ordenarPor(c.chave)} className="inline-flex items-center gap-1 hover:underline">
                      {c.rotulo} <Seta ativo={ordem === c.chave} dir={dir} />
                    </Link>
                  ) : c.rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                Nenhum registro para este filtro.
              </td></tr>
            )}
            {logs.map((l) => {
              const { rotulo, Icone, tinctura } = acaoDe(l.acao);
              const nome = rotuloDoRegistro(l);
              const expandido = aberto === l.id;
              return (
                <tr key={l.id} className="border-t border-border/70 align-top odd:bg-background/30">
                  <td className="px-2 py-3">
                    <button type="button" aria-expanded={expandido}
                      aria-label={expandido ? "Ocultar detalhe" : "Ver detalhe"}
                      onClick={() => setAberto(expandido ? null : l.id)}
                      className="rounded border border-border p-0.5 text-muted-foreground transition-colors hover:border-brand hover:text-brand">
                      {expandido ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{dataHora(l.createdAt)}</td>
                  <td className="px-4 py-3">{l.autor}</td>
                  <td className="px-4 py-3">
                    <ShieldBadge tinctura={tinctura}>
                      <Icone className="size-3" /> {rotulo}
                    </ShieldBadge>
                  </td>
                  <td className="px-4 py-3 font-medium">{l.entidade}</td>
                  <td className="px-4 py-3">
                    {nome && <div className="font-medium">{nome}</div>}
                    <div className="select-all font-mono text-[11px] text-muted-foreground">
                      {l.registroId ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {l.diff && Object.keys(l.diff).length > 0 ? (
                      <ul className="space-y-0.5">
                        {Object.entries(l.diff).map(([campo, depois]) => (
                          <li key={campo} className="font-mono text-[11px]">
                            <span className="text-muted-foreground">{campo}:</span>{" "}
                            <span className="text-destructive/80 line-through">
                              {String(l.antes?.[campo] ?? "—")}
                            </span>{" "}
                            <span className="text-muted-foreground">→</span>{" "}
                            <span className="text-success">{String(depois ?? "—")}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {l.acao === "create" ? "registro criado" : l.acao === "delete" ? "registro removido" : "—"}
                      </span>
                    )}
                    {expandido && <DetalheOperacao log={l} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Página {pagina} de {totalPaginas}</span>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm" disabled={pagina <= 1}>
              <Link href={comParams({ pagina: String(pagina - 1) })}>Anterior</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" disabled={pagina >= totalPaginas}>
              <Link href={comParams({ pagina: String(pagina + 1) })}>Próxima</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Painel do "+": SQL equivalente + linha completa antes/depois. */
function DetalheOperacao({ log }: { log: LogRow }) {
  return (
    <div className="mt-3 space-y-3 rounded-sm border border-border bg-muted/40 p-3">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Operação equivalente
        </p>
        <pre className="overflow-x-auto rounded-sm bg-background/60 p-2 font-mono text-[11px] leading-relaxed">
          {sqlEquivalente(log)}
        </pre>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Reconstruída do registro — as escritas passam pelo PostgREST, então não
          há texto de SQL para capturar.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Painel titulo="Antes" dados={log.antes} />
        <Painel titulo="Depois" dados={log.depois} />
      </div>
    </div>
  );
}

function Painel({ titulo, dados }: { titulo: string; dados: Record<string, unknown> | null }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {titulo}
      </p>
      <pre className={cn(
        "max-h-64 overflow-auto rounded-sm bg-background/60 p-2 font-mono text-[11px] leading-relaxed",
        !dados && "text-muted-foreground",
      )}>
        {dados ? JSON.stringify(dados, null, 2) : "—"}
      </pre>
    </div>
  );
}
