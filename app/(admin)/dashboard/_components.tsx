"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Disc3,
  ExternalLink,
  Image as ImageIcon,
  Music,
} from "lucide-react";
import { ShieldBadge } from "@/components/heraldry/shield-badge";
import { cn } from "@/lib/utils";
import type { Pendencia, Resumo, TelaNoAr } from "./dados";

// ---------------------------------------------------------------- moldura

/** Bloco do dashboard: mesma moldura das seções do painel. */
export function Painel({
  titulo,
  acao,
  children,
  className,
}: {
  titulo: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-sm border border-border bg-card p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-base font-semibold tracking-tight">
          {titulo}
        </h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

const ATALHO =
  "text-xs text-brand transition-colors hover:underline";

// ---------------------------------------------------------------- números

export function Numeros({ n }: { n: Resumo["numeros"] }) {
  const horas = Math.floor(n.duracaoTotalSeg / 3600);
  const minutos = Math.round((n.duracaoTotalSeg % 3600) / 60);

  const tiles = [
    { rotulo: "Telas no ar", valor: `${n.telasNoAr}`, nota: `de ${n.telasTotal}`, href: "/telas" },
    { rotulo: "Eventos no Hub", valor: `${n.eventosNoHub}`, nota: `de ${n.eventosTotal}`, href: "/eventos" },
    { rotulo: "Conteúdos publicados", valor: `${n.conteudosPublicados}`, nota: `de ${n.conteudosTotal}`, href: "/conteudos" },
    { rotulo: "Músicas", valor: `${n.musicas}`, nota: horas > 0 ? `${horas}h${String(minutos).padStart(2, "0")} de acervo` : `${minutos} min de acervo`, href: "/obras/musicas" },
  ];

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <li key={t.rotulo}>
          <Link
            href={t.href}
            className="flex h-full flex-col justify-between rounded-sm border border-border bg-card p-3 shadow-sm transition-colors hover:border-brand sm:p-4"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {t.rotulo}
            </span>
            <span className="mt-1.5 font-display text-3xl font-semibold leading-none text-brand tabular-nums">
              {t.valor}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">{t.nota}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- carrossel

/** Trilho com rolagem por toque no celular e setas no desktop. */
function Carrossel({
  children,
  rotulo,
  className,
}: {
  children: React.ReactNode;
  rotulo: string;
  className?: string;
}) {
  const trilho = useRef<HTMLUListElement>(null);

  function correr(dir: 1 | -1) {
    const el = trilho.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <ul
        ref={trilho}
        aria-label={rotulo}
        className={cn(
          "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1",
          // A barra de rolagem some: no desktop quem manda são as setas, no
          // celular o gesto já é o controle.
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className,
        )}
      >
        {children}
      </ul>
      <SetaCarrossel lado="esq" onClick={() => correr(-1)} />
      <SetaCarrossel lado="dir" onClick={() => correr(1)} />
    </div>
  );
}

function SetaCarrossel({ lado, onClick }: { lado: "esq" | "dir"; onClick: () => void }) {
  const Icone = lado === "esq" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={lado === "esq" ? "Anterior" : "Próximo"}
      className={cn(
        "absolute top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-brand hover:text-foreground md:flex",
        lado === "esq" ? "-left-3" : "-right-3",
      )}
    >
      <Icone className="size-4" />
    </button>
  );
}

// ---------------------------------------------------------------- no ar

export function NoAr({ telas }: { telas: TelaNoAr[] }) {
  if (telas.length === 0) {
    return <Vazio>Nenhuma tela habilitada.</Vazio>;
  }
  return (
    <Carrossel rotulo="Telas no ar">
      {telas.map((t) => (
        <li
          key={t.id}
          className="w-[85%] shrink-0 snap-start sm:w-[22rem]"
        >
          <article className="h-full overflow-hidden rounded-sm border border-border">
            <div className="relative aspect-video bg-muted">
              {t.banner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.banner.imagem}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
                  <ImageIcon className="size-5" aria-hidden />
                  <span className="text-xs">Sem banner publicado</span>
                </span>
              )}
              <span className="absolute left-2 top-2 rounded-sm bg-black/65 px-2 py-0.5 font-mono text-[11px] text-white backdrop-blur-sm">
                {t.rota}
              </span>
            </div>

            {/* A fita do marquee, como aparece no site. */}
            {t.marquees.map((m) => (
              <div
                key={m.nome}
                className="flex items-center gap-3 overflow-hidden border-t border-border bg-foreground/[0.04] px-3 py-1.5"
              >
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {m.nome}
                </span>
                <span className="truncate text-xs text-foreground/80">
                  {m.itens.length ? m.itens.join("  ·  ") : "sem itens"}
                </span>
              </div>
            ))}

            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.banner ? t.banner.nome : "nada exibindo"}
                </p>
              </div>
              <Link href="/telas" className={cn(ATALHO, "shrink-0")}>
                Gerenciar
              </Link>
            </div>
          </article>
        </li>
      ))}
    </Carrossel>
  );
}

// ---------------------------------------------------------------- capas

export function Capas({ capas }: { capas: Resumo["catalogo"]["capas"] }) {
  if (capas.length === 0) return <Vazio>Nenhuma capa cadastrada.</Vazio>;
  return (
    <Carrossel rotulo="Capas do catálogo">
      {capas.map((c) => (
        <li key={`${c.tipo}-${c.id}`} className="w-28 shrink-0 snap-start sm:w-32">
          <Link
            href={c.tipo === "colecao" ? `/obras/colecao/${c.id}` : `/obras/musica/${c.id}`}
            className="group block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.imagem}
              alt=""
              className="aspect-square w-full rounded-sm border border-border object-cover transition-colors group-hover:border-brand"
            />
            <p className="mt-1.5 flex items-center gap-1 truncate text-xs">
              {c.tipo === "colecao" ? (
                <Disc3 aria-hidden className="size-3 shrink-0 text-muted-foreground" />
              ) : (
                <Music aria-hidden className="size-3 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">{c.titulo}</span>
            </p>
          </Link>
        </li>
      ))}
    </Carrossel>
  );
}

// ---------------------------------------------------------------- pendências

export function Pendencias({ itens }: { itens: Pendencia[] }) {
  if (itens.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-success">
        <ShieldBadge tinctura="vert" escudo>
          ok
        </ShieldBadge>
        Nada pendente — o Hub está completo.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border/70">
      {itens.map((p) => (
        <li key={p.chave}>
          <Link
            href={p.href}
            className="flex items-center gap-3 py-2 transition-colors hover:text-brand"
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-sm text-xs font-semibold tabular-nums",
                p.grave
                  ? "bg-destructive/15 text-destructive"
                  : "bg-warning/15 text-warning",
              )}
            >
              {p.n}
            </span>
            <span className="min-w-0 flex-1 text-sm">{p.rotulo}</span>
            <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- agenda

export function Agenda({ agenda }: { agenda: Resumo["agenda"] }) {
  const maior = Math.max(1, ...agenda.porMes.map((m) => m.passados + m.futuros));

  return (
    <div className="space-y-4">
      {agenda.atrasados > 0 && (
        <p className="flex items-start gap-2 rounded-sm border border-destructive/40 border-l-[3px] border-l-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            {agenda.atrasados === 1
              ? "1 evento já passou e continua em aberto."
              : `${agenda.atrasados} eventos já passaram e continuam em aberto.`}{" "}
            <Link href="/eventos" className="underline">
              Encerrar
            </Link>
          </span>
        </p>
      )}

      {agenda.proximos.length === 0 ? (
        <Vazio>Nenhum evento futuro.</Vazio>
      ) : (
        <ul className="space-y-2">
          {agenda.proximos.map((e) => (
            <li key={e.id} className="flex items-center gap-3">
              <DataSelo iso={e.data} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[e.local, e.status].filter(Boolean).join(" · ")}
                </p>
              </div>
              {e.noHub && (
                <ShieldBadge tinctura="vert" escudo>
                  no ar
                </ShieldBadge>
              )}
            </li>
          ))}
        </ul>
      )}

      {agenda.porMes.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Eventos por mês
          </p>
          <ul className="flex h-24 items-end gap-1.5">
            {agenda.porMes.map((m) => {
              const total = m.passados + m.futuros;
              return (
                <li
                  key={m.mes}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1"
                  title={`${rotuloMes(m.mes)}: ${total} evento(s)`}
                >
                  <span className="flex w-full flex-col justify-end" style={{ height: 72 }}>
                    {m.futuros > 0 && (
                      <span
                        className="w-full rounded-t-sm bg-brand"
                        style={{ height: `${(m.futuros / maior) * 72}px` }}
                      />
                    )}
                    {m.passados > 0 && (
                      <span
                        className="w-full bg-brand/35"
                        style={{ height: `${(m.passados / maior) * 72}px` }}
                      />
                    )}
                  </span>
                  <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                    {rotuloMes(m.mes)}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-sm bg-brand" /> futuros
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-sm bg-brand/35" /> passados
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

function DataSelo({ iso }: { iso: string }) {
  const [, mes, dia] = iso.split("-");
  return (
    <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-sm border border-border bg-muted/50 leading-none">
      <span className="font-display text-sm font-semibold tabular-nums">{dia}</span>
      <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
        {MESES[Number(mes) - 1]}
      </span>
    </span>
  );
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const rotuloMes = (iso: string) => `${MESES[Number(iso.slice(5, 7)) - 1]}/${iso.slice(2, 4)}`;

// ---------------------------------------------------------------- barras

export function Cobertura({ itens }: { itens: Resumo["catalogo"]["cobertura"] }) {
  return (
    <ul className="space-y-2.5">
      {itens.map((c) => {
        const pct = c.total ? Math.round((c.ok / c.total) * 100) : 0;
        return (
          <li key={c.rotulo}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span>{c.rotulo}</span>
              <span className="tabular-nums text-muted-foreground">
                {c.ok}/{c.total}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  pct >= 80 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-destructive",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Ranking({
  itens,
  vazio,
}: {
  itens: { nome: string; n: number }[];
  vazio: string;
}) {
  if (itens.length === 0) return <Vazio>{vazio}</Vazio>;
  const maior = Math.max(...itens.map((i) => i.n));
  return (
    <ul className="space-y-2">
      {itens.map((i) => (
        <li key={i.nome} className="flex items-center gap-2 text-sm">
          <span className="w-28 shrink-0 truncate sm:w-36">{i.nome}</span>
          <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-brand/70"
              style={{ width: `${(i.n / maior) * 100}%` }}
            />
          </span>
          <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {i.n}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- operação

export function Operacao({ op }: { op: Resumo["operacao"] }) {
  const buckets = op.buckets ?? [];
  const totalBytes = buckets.reduce((s, b) => s + b.bytes, 0);
  const totalOrfaos = buckets.reduce((s, b) => s + b.orfaos, 0);

  return (
    <div className="space-y-4">
      {op.buckets && (
      <div>
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Imagens
          </span>
          <span className="tabular-nums text-muted-foreground">{tamanho(totalBytes)}</span>
        </div>
        <ul className="space-y-1.5">
          {buckets.map((b) => (
            <li key={b.nome} className="flex items-center gap-2 text-xs">
              <span className="w-20 shrink-0 capitalize">{b.nome}</span>
              <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-brand/60"
                  style={{ width: `${totalBytes ? (b.bytes / totalBytes) * 100 : 0}%` }}
                />
              </span>
              <span className="w-24 shrink-0 text-right tabular-nums text-muted-foreground">
                {b.arquivos} · {tamanho(b.bytes)}
              </span>
            </li>
          ))}
        </ul>
        {totalOrfaos > 0 && (
          <p className="mt-1.5 text-xs text-warning">
            {totalOrfaos} arquivo(s) sem registro usando — espaço a recuperar.
          </p>
        )}
      </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Dado rotulo="Contas ativas" valor={`${op.contas.ativos} de ${op.contas.total}`} />
        <Dado rotulo="Super admins" valor={String(op.contas.supers)} />
        <Dado
          rotulo="Sem 2FA"
          valor={String(op.contas.sem2fa)}
          alerta={op.contas.sem2fa > 0}
        />
        <Dado
          rotulo="Senha temporária"
          valor={String(op.contas.senhaTemp)}
          alerta={op.contas.senhaTemp > 0}
        />
      </dl>

      <p className="border-t border-border pt-2.5 text-xs text-muted-foreground">
        Cron de keep-alive:{" "}
        {op.cron.ultima ? (
          <>
            última em <strong className="font-medium">{dataHora(op.cron.ultima)}</strong> ·{" "}
            {op.cron.total} execuções
          </>
        ) : (
          "nunca executou"
        )}
      </p>
    </div>
  );
}

function Dado({
  rotulo,
  valor,
  alerta,
}: {
  rotulo: string;
  valor: string;
  alerta?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className={cn("tabular-nums", alerta && "font-semibold text-warning")}>
        {valor}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------- atividade

export function Atividade({ a }: { a: NonNullable<Resumo["atividade"]> }) {
  const maior = Math.max(1, ...a.porDia.map((d) => d.n));
  const foraDoPainel = a.total ? Math.round((a.semAutor / a.total) * 100) : 0;
  const [dia, setDia] = useState<{ dia: string; n: number } | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Alterações nos últimos 30 dias
        </p>
        <ul className="flex gap-[3px]">
          {a.porDia.map((d) => (
            <li
              key={d.dia}
              onMouseEnter={() => setDia(d)}
              onMouseLeave={() => setDia(null)}
              title={`${d.dia}: ${d.n}`}
              className={cn(
                "h-7 min-w-0 flex-1 rounded-[2px]",
                d.n === 0
                  ? "bg-muted"
                  : d.n / maior > 0.66
                    ? "bg-brand"
                    : d.n / maior > 0.33
                      ? "bg-brand/60"
                      : "bg-brand/30",
              )}
            />
          ))}
        </ul>
        <p className="mt-1 h-4 text-[10px] text-muted-foreground">
          {dia ? `${dia.dia}: ${dia.n} alteração(ões)` : `${a.total} registros no total`}
        </p>
      </div>

      {a.semAutor > 0 && (
        <p className="rounded-sm border border-warning/40 border-l-[3px] border-l-warning bg-warning/10 px-3 py-2 text-xs text-warning">
          <strong className="font-semibold">{a.semAutor}</strong> de {a.total} alterações
          ({foraDoPainel}%) foram feitas direto no banco, fora do painel.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Mais mexidos
          </p>
          <Ranking
            itens={a.porEntidade.map((e) => ({ nome: e.entidade, n: e.n }))}
            vazio="Sem registros."
          />
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Quem editou
          </p>
          <Ranking
            itens={a.porAutor.map((x) => ({ nome: x.autor, n: x.n }))}
            vazio="Sem registros."
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Últimas alterações
        </p>
        <ul className="divide-y divide-border/70 text-sm">
          {a.ultimas.map((u) => (
            <li key={u.id} className="flex items-center gap-2 py-1.5">
              <ShieldBadge tinctura={TINCTURA_ACAO[u.acao] ?? "argent"}>
                {u.acao}
              </ShieldBadge>
              <span className="min-w-0 flex-1 truncate">{u.entidade}</span>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                {u.autor}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {dataHora(u.quando)}
              </span>
            </li>
          ))}
        </ul>
        <Link href="/historico" className={cn(ATALHO, "mt-2 inline-flex items-center gap-1")}>
          Ver histórico completo
          <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
}

const TINCTURA_ACAO: Record<string, "vert" | "azure" | "gules"> = {
  create: "vert",
  update: "azure",
  delete: "gules",
};

// ---------------------------------------------------------------- utilitários

function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-center text-sm text-muted-foreground">{children}</p>;
}

function tamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function dataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
