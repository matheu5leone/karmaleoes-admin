"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ShieldBadge } from "@/components/heraldry/shield-badge";

/** Estrutura mínima que o kanban consome (satisfeita por EventoRow). */
export type KanbanEvento = {
  id: string;
  nome: string;
  lifecycle: string;
  status_efetivo: string;
  enable_efetivo: boolean;
  prioridade: number;
  data: string;
  nova_data: string | null;
};

const LIFECYCLES = ["Em aberto", "Encerrado"] as const;
type Lifecycle = (typeof LIFECYCLES)[number];

/** Tempo de pressão até o card "descolar" no toque. */
const MS_LONG_PRESS = 400;
/** Movimento que cancela o long press — o dedo estava era rolando a lista. */
const TOLERANCIA_PX = 10;

/**
 * Acento por coluna — filete no topo + badge de contagem. Discreto de
 * propósito: DESIGN.md §2 reserva cor forte só para o acento de marca.
 */
const ACENTO: Record<Lifecycle, { filete: string; badge: string }> = {
  "Em aberto": { filete: "bg-info", badge: "bg-info/10 text-info" },
  Encerrado: {
    filete: "bg-muted-foreground/40",
    badge: "bg-muted text-muted-foreground",
  },
};

/** Tinctura por status — a hachura distingue mesmo sem cor. */
function tincturaStatus(s: string) {
  if (s === "Expirado") return "argent" as const;
  if (s === "Cancelado") return "gules" as const;
  if (s === "Sucesso" || s === "Ingressos a venda") return "vert" as const;
  if (s === "Esgotado") return "tenne" as const;
  if (s === "Adiado") return "azure" as const;
  return "sable" as const;
}

/** "2026-08-15" → "15/08". */
function diaMes(iso: string): string {
  const [, m, d] = iso.split("-");
  return d && m ? `${d}/${m}` : iso;
}

/** Data que vale para o evento (nova_data quando adiado). */
function dataReferencia(e: KanbanEvento): string {
  return e.nova_data ?? e.data;
}

export function EventosKanban<T extends KanbanEvento>({
  eventos,
  onEncerrar,
  onEditar,
  onBloqueado,
}: {
  eventos: T[];
  /** Card solto na coluna "Encerrado" → abre o diálogo de encerramento. */
  onEncerrar: (evento: T) => void;
  onEditar: (evento: T) => void;
  /** Tentativa de reabrir (Encerrado → Em aberto), que o domínio não permite. */
  onBloqueado: () => void;
}) {
  const [arrastando, setArrastando] = useState<T | null>(null);
  const [alvo, setAlvo] = useState<Lifecycle | null>(null);
  /** No toque, o card só sai do lugar depois da pressão longa. */
  const [porToque, setPorToque] = useState(false);
  const trilho = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const moveu = useRef(false);

  function limparToque() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    inicio.current = null;
    setPorToque(false);
  }

  function soltar(coluna: Lifecycle | null) {
    const e = arrastando;
    setAlvo(null);
    setArrastando(null);
    limparToque();
    if (!e || !coluna || e.lifecycle === coluna) return;
    // Encerrado → Em aberto não existe no domínio (não há reabrirEvento).
    if (coluna === "Em aberto") return onBloqueado();
    onEncerrar(e);
  }

  // ---------------------------------------------------------------- toque
  function aoTocar(e: React.PointerEvent, evento: T) {
    if (e.pointerType === "mouse") return; // o mouse usa o drag nativo
    inicio.current = { x: e.clientX, y: e.clientY };
    moveu.current = false;
    const alvoEl = e.currentTarget;
    timer.current = setTimeout(() => {
      setArrastando(evento);
      setPorToque(true);
      setAlvo(evento.lifecycle as Lifecycle);
      alvoEl.setPointerCapture(e.pointerId);
      navigator.vibrate?.(10);
    }, MS_LONG_PRESS);
  }

  function aoMover(e: React.PointerEvent) {
    if (e.pointerType === "mouse") return;

    // Antes de descolar, qualquer deslize é rolagem: cancela a pressão.
    if (!porToque) {
      const i = inicio.current;
      if (!i) return;
      if (Math.hypot(e.clientX - i.x, e.clientY - i.y) > TOLERANCIA_PX) {
        moveu.current = true;
        limparToque();
      }
      return;
    }

    // Arrastando: a coluna sob o dedo vira o alvo.
    const sob = document.elementFromPoint(e.clientX, e.clientY);
    const coluna = sob?.closest<HTMLElement>("[data-coluna]")?.dataset.coluna;
    if (coluna) setAlvo(coluna as Lifecycle);

    // Perto da borda, o trilho anda sozinho — a outra coluna fica quase toda
    // fora da tela no celular.
    const t = trilho.current;
    if (t) {
      const r = t.getBoundingClientRect();
      if (e.clientX > r.right - 48) t.scrollBy({ left: 12 });
      else if (e.clientX < r.left + 48) t.scrollBy({ left: -12 });
    }
  }

  function aoSoltarToque(e: React.PointerEvent) {
    if (e.pointerType === "mouse") return;
    if (porToque) soltar(alvo);
    else limparToque();
  }

  return (
    <>
      {/*
        Celular: colunas lado a lado, como no Trello — empilhadas, a segunda
        ficava a uma tela inteira de distância. Do md para cima, as duas cabem.
      */}
      <div
        ref={trilho}
        className={cn(
          "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          // Enquanto arrasta com o dedo, a rolagem do trilho atrapalha.
          porToque && "touch-none",
        )}
      >
        {LIFECYCLES.map((coluna) => {
          const daColuna = eventos.filter((e) => e.lifecycle === coluna);
          const recusa =
            !!arrastando && arrastando.lifecycle !== coluna && coluna === "Em aberto";
          const destaque = alvo === coluna && !recusa && arrastando?.lifecycle !== coluna;

          return (
            <section
              key={coluna}
              data-coluna={coluna}
              onDragOver={(ev) => {
                ev.preventDefault(); // permite o drop para podermos avisar no recusado
                setAlvo(coluna);
              }}
              onDragLeave={() => setAlvo((a) => (a === coluna ? null : a))}
              onDrop={(ev) => {
                ev.preventDefault();
                soltar(coluna);
              }}
              className={cn(
                "w-[86%] shrink-0 snap-start overflow-hidden rounded-lg border bg-card transition-colors md:w-auto",
                destaque && "border-brand",
                recusa && alvo === coluna && "border-destructive",
                !destaque && !(recusa && alvo === coluna) && "border-border",
              )}
            >
              <div className={cn("h-0.5 w-full", ACENTO[coluna].filete)} />
              <header className="flex items-center justify-between gap-2 px-4 py-3">
                <h3 className="text-sm font-semibold tracking-tight">{coluna}</h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    ACENTO[coluna].badge,
                  )}
                >
                  {daColuna.length}
                </span>
              </header>

              <ul className="space-y-2 px-3 pb-3">
                {daColuna.length === 0 && (
                  <li className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    {recusa ? "Não é possível reabrir aqui" : "Nenhum evento."}
                  </li>
                )}
                {daColuna.map((e) => (
                  <li key={e.id}>
                    <article
                      draggable
                      onDragStart={() => setArrastando(e)}
                      onDragEnd={() => {
                        setArrastando(null);
                        setAlvo(null);
                      }}
                      onPointerDown={(ev) => aoTocar(ev, e)}
                      onPointerMove={aoMover}
                      onPointerUp={aoSoltarToque}
                      onPointerCancel={() => limparToque()}
                      onClick={() => {
                        // Um arrasto por toque não é um clique.
                        if (porToque || moveu.current) return;
                        onEditar(e);
                      }}
                      className={cn(
                        "cursor-grab rounded-md border border-border bg-card p-3 shadow-sm transition-[transform,box-shadow,border-color] hover:border-brand active:cursor-grabbing",
                        arrastando?.id === e.id &&
                          (porToque
                            ? "scale-[1.03] border-brand shadow-lg"
                            : "opacity-50"),
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-medium">
                          {e.nome}
                        </p>
                        <span
                          className="mt-1 shrink-0 rounded-full"
                          title={e.enable_efetivo ? "Visível no Hub" : "Oculto no Hub"}
                        >
                          <span
                            className={cn(
                              "block size-2 rounded-full",
                              e.enable_efetivo ? "bg-success" : "bg-muted-foreground/40",
                            )}
                          />
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span>{diaMes(dataReferencia(e))}</span>
                        {e.nova_data && (
                          <span title="Adiado — nova data">· adiado</span>
                        )}
                        <span>· prio {e.prioridade}</span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <ShieldBadge tinctura={tincturaStatus(e.status_efetivo)}>
                          {e.status_efetivo}
                        </ShieldBadge>
                        {e.status_efetivo === "Expirado" && (
                          <ShieldBadge tinctura="tenne">expirado</ShieldBadge>
                        )}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Dica fixa enquanto o dedo segura o card: no celular o alvo some da tela. */}
      {porToque && arrastando && (
        <p
          role="status"
          className={cn(
            "fixed inset-x-4 bottom-4 z-50 rounded-md border px-3 py-2 text-center text-sm shadow-lg md:hidden",
            alvo === "Em aberto" && arrastando.lifecycle !== "Em aberto"
              ? "border-destructive bg-destructive/15 text-destructive"
              : "border-brand bg-brand-subtle text-brand",
          )}
        >
          {alvo === arrastando.lifecycle
            ? "Arraste para a outra coluna"
            : alvo === "Em aberto"
              ? "Não é possível reabrir um evento encerrado"
              : `Solte para encerrar "${arrastando.nome}"`}
        </p>
      )}

      <p className="mt-2 text-center text-xs text-muted-foreground md:hidden">
        Deslize para ver as colunas · segure um card para movê-lo
      </p>
    </>
  );
}
