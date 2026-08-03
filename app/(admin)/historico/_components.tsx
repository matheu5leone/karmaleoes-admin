"use client";

import { useMemo, useState } from "react";
import { FilePlus2, PenLine, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/form/field";
import { cn } from "@/lib/utils";

export type LogRow = {
  id: string;
  acao: string;
  entidade: string;
  registroId: string | null;
  diff: Record<string, unknown> | null;
  autor: string;
  createdAt: string;
};

const ACAO = {
  create: { rotulo: "criou", Icone: FilePlus2, cor: "text-success" },
  update: { rotulo: "alterou", Icone: PenLine, cor: "text-info" },
  delete: { rotulo: "removeu", Icone: Trash2, cor: "text-destructive" },
} as const;

function estiloAcao(acao: string) {
  return ACAO[acao as keyof typeof ACAO] ?? ACAO.update;
}

/** "2026-08-02T20:39:28Z" → "02/08/2026" (fuso de São Paulo). */
function dia(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoricoTimeline({ logs }: { logs: LogRow[] }) {
  const [entidade, setEntidade] = useState("");
  const [acao, setAcao] = useState("");

  const entidades = useMemo(
    () => [...new Set(logs.map((l) => l.entidade))].sort(),
    [logs],
  );

  const filtrados = useMemo(
    () =>
      logs.filter(
        (l) =>
          (!entidade || l.entidade === entidade) && (!acao || l.acao === acao),
      ),
    [logs, entidade, acao],
  );

  // Agrupa por dia preservando a ordem (os logs já vêm do mais recente).
  const porDia = useMemo(() => {
    const mapa = new Map<string, LogRow[]>();
    for (const l of filtrados) {
      const d = dia(l.createdAt);
      const lista = mapa.get(d) ?? [];
      lista.push(l);
      mapa.set(d, lista);
    }
    return [...mapa.entries()];
  }, [filtrados]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Entidade" htmlFor="h-ent" className="space-y-1.5">
          <Select
            id="h-ent"
            value={entidade}
            onChange={(e) => setEntidade(e.target.value)}
            className="w-48"
          >
            <option value="">Todas</option>
            {entidades.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ação" htmlFor="h-acao" className="space-y-1.5">
          <Select
            id="h-acao"
            value={acao}
            onChange={(e) => setAcao(e.target.value)}
            className="w-40"
          >
            <option value="">Todas</option>
            <option value="create">criou</option>
            <option value="update">alterou</option>
            <option value="delete">removeu</option>
          </Select>
        </Field>
        <span className="pb-2 text-sm text-muted-foreground">
          {filtrados.length} registro{filtrados.length === 1 ? "" : "s"}
        </span>
      </div>

      {porDia.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhum registro para este filtro.
        </p>
      ) : (
        porDia.map(([d, itens]) => (
          <section key={d}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
              {d}
            </h2>
            <ul className="overflow-hidden rounded-lg border border-border bg-card">
              {itens.map((l) => {
                const { rotulo, Icone, cor } = estiloAcao(l.acao);
                return (
                  <li
                    key={l.id}
                    className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <Icone className={cn("mt-0.5 size-4 shrink-0", cor)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">{l.autor}</span>{" "}
                        {rotulo}{" "}
                        <span className="font-medium">{l.entidade}</span>
                      </p>
                      {l.diff && Object.keys(l.diff).length > 0 && (
                        <ul className="mt-1 flex flex-wrap gap-1.5">
                          {Object.entries(l.diff).map(([campo, valor]) => (
                            <li
                              key={campo}
                              className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                            >
                              {campo} → {String(valor)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <time
                      className="shrink-0 text-xs text-muted-foreground"
                      dateTime={l.createdAt}
                    >
                      {hora(l.createdAt)}
                    </time>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
