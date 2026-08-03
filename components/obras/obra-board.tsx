"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Disc3, ExternalLink, Music, Plus, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { PLATAFORMAS, type ObraTipo } from "@/lib/validation/obras";
import { cn } from "@/lib/utils";
import {
  adicionarLink,
  getObraGrafo,
  removerColaborador,
  removerLink,
  vincularColaborador,
  type ObraGrafo,
} from "@/app/(admin)/obras/vinculos";

// Espaço de coordenadas do board (o SVG e os nós compartilham este sistema).
const VW = 1000;
const VH = 720;
const CX = VW / 2;
const CY = VH / 2;

type Pos = { x: number; y: number };

/**
 * Setores angulares que NÃO se cruzam (evita colisão entre topo e laterais),
 * com limite de nós por setor — o excedente vira "+N" que abre a lista completa.
 */
const SETOR = {
  topo: { angulo: -90, spread: 78, passo: 26, rx: 330, ry: 258, max: 4 },
  lado: { spread: 70, passo: 24, rx: 340, ry: 265, max: 4 },
} as const;

/** Distribui `n` nós num arco ao redor do centro (0° = direita, -90° = topo). */
function arco(
  n: number,
  anguloCentral: number,
  spreadMax: number,
  passoGrau: number,
  rx: number,
  ry: number,
): Pos[] {
  if (n === 0) return [];
  if (n === 1) {
    const rad = (anguloCentral * Math.PI) / 180;
    return [{ x: CX + Math.cos(rad) * rx, y: CY + Math.sin(rad) * ry }];
  }
  const spread = Math.min(spreadMax, passoGrau * (n - 1));
  const inicio = anguloCentral - spread / 2;
  const passo = spread / (n - 1);
  return Array.from({ length: n }, (_, i) => {
    const rad = ((inicio + passo * i) * Math.PI) / 180;
    return { x: CX + Math.cos(rad) * rx, y: CY + Math.sin(rad) * ry };
  });
}

/** Curva suave do centro até o nó (leve arqueamento perpendicular). */
function curva({ x, y }: Pos): string {
  const mx = (CX + x) / 2;
  const my = (CY + y) / 2;
  const dx = x - CX;
  const dy = y - CY;
  const k = 0.1;
  return `M ${CX} ${CY} Q ${mx - dy * k} ${my + dx * k} ${x} ${y}`;
}

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

export function ObraBoardModal({
  tipo,
  obraId,
  onClose,
}: {
  tipo: ObraTipo;
  obraId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [grafo, setGrafo] = useState<ObraGrafo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [hover, setHover] = useState<string | null>(null);
  const [modo, setModo] = useState<"board" | "lista">("board");
  const [painel, setPainel] = useState<"colaborador" | "link" | null>(null);
  const [del, setDel] = useState<
    { kind: "colaborador" | "link"; id: string; label: string } | null
  >(null);

  const carregar = useCallback(async () => {
    const r = await getObraGrafo(tipo, obraId);
    if (!r.ok) return setErro(r.error);
    setGrafo(r.grafo);
  }, [tipo, obraId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Fecha no Escape.
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  /** Executa mutação, recarrega o grafo e atualiza a listagem por trás. */
  function mutar(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    start(async () => {
      const r = await fn();
      if (!r.ok) return toast.error(r.error ?? "Falha.");
      toast.success(ok);
      await carregar();
      router.refresh();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vínculos da obra"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
              {tipo === "musica" ? "Música" : "Coleção"} · vínculos
            </p>
            <h2 className="text-xl font-semibold tracking-tight">
              {grafo?.centro.titulo ?? "Carregando…"}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {grafo && (
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:inline-flex"
                onClick={() => setModo((m) => (m === "board" ? "lista" : "board"))}
              >
                {modo === "board" ? "Ver como lista" : "Ver como board"}
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
        </header>

        {erro ? (
          <p className="px-6 py-10 text-center text-sm text-destructive">{erro}</p>
        ) : !grafo ? (
          <BoardSkeleton />
        ) : (
          <>
            {modo === "board" && (
              <Board
                grafo={grafo}
                hover={hover}
                setHover={setHover}
                onAdd={setPainel}
                onRemove={setDel}
                onVerTudo={() => setModo("lista")}
              />
            )}
            {/* No mobile é sempre lista; no desktop, só quando o modo é "lista". */}
            <ListaVinculos
              className={modo === "board" ? "lg:hidden" : undefined}
              grafo={grafo}
              onAdd={setPainel}
              onRemove={setDel}
            />

            {painel && (
              <PainelAdicionar
                tipo={painel}
                grafo={grafo}
                pending={pending}
                onClose={() => setPainel(null)}
                onColaborador={(colaborador_id, role_id) =>
                  mutar(
                    () =>
                      vincularColaborador(tipo, obraId, { colaborador_id, role_id }),
                    "Colaborador vinculado.",
                  )
                }
                onLink={(plataforma, url) =>
                  mutar(
                    () => adicionarLink(tipo, obraId, { plataforma, url }),
                    "Link adicionado.",
                  )
                }
              />
            )}

            <footer className="flex justify-end border-t border-border px-6 py-3">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/obras/${tipo}/${obraId}`}>Abrir página completa →</Link>
              </Button>
            </footer>
          </>
        )}

        <ConfirmDialog
          open={!!del}
          title={del?.kind === "link" ? "Remover link" : "Remover colaborador"}
          description={del ? `Remover "${del.label}" desta obra?` : ""}
          confirmLabel="Remover"
          pending={pending}
          onCancel={() => setDel(null)}
          onConfirm={() => {
            if (!del) return;
            const alvo = del;
            setDel(null);
            mutar(
              () =>
                alvo.kind === "link"
                  ? removerLink(tipo, obraId, alvo.id)
                  : removerColaborador(tipo, obraId, alvo.id),
              "Vínculo removido.",
            );
          }}
        />
      </div>
    </div>
  );
}

// ---------- Board radial (desktop) ----------

type RemoveAlvo = { kind: "colaborador" | "link"; id: string; label: string };

/** Aplica o limite do setor: o excedente vira um único nó "+N". */
function comLimite<T>(itens: T[], max: number): { visiveis: T[]; resto: number } {
  if (itens.length <= max) return { visiveis: itens, resto: 0 };
  return { visiveis: itens.slice(0, max - 1), resto: itens.length - (max - 1) };
}

function Board({
  grafo,
  hover,
  setHover,
  onAdd,
  onRemove,
  onVerTudo,
}: {
  grafo: ObraGrafo;
  hover: string | null;
  setHover: (v: string | null) => void;
  onAdd: (t: "colaborador" | "link") => void;
  onRemove: (a: RemoveAlvo) => void;
  onVerTudo: () => void;
}) {
  const rel = comLimite(grafo.relacionados.itens, SETOR.topo.max);
  const col = comLimite(grafo.colaboradores, SETOR.lado.max);
  const lnk = comLimite(grafo.links, SETOR.lado.max);

  const { topo, lado } = SETOR;
  // Cada setor reserva posições para: itens visíveis + "+N" (se houver) + adicionar.
  const posRel = arco(
    rel.visiveis.length + (rel.resto ? 1 : 0),
    topo.angulo,
    topo.spread,
    topo.passo,
    topo.rx,
    topo.ry,
  );
  const posCol = arco(
    col.visiveis.length + (col.resto ? 1 : 0) + 1,
    0,
    lado.spread,
    lado.passo,
    lado.rx,
    lado.ry,
  );
  const posLink = arco(
    lnk.visiveis.length + (lnk.resto ? 1 : 0) + 1,
    180,
    lado.spread,
    lado.passo,
    lado.rx,
    lado.ry,
  );

  const conexoes: { key: string; pos: Pos }[] = [
    ...posRel.map((p, i) => ({ key: `rel-${i}`, pos: p })),
    ...posCol.map((p, i) => ({ key: `col-${i}`, pos: p })),
    ...posLink.map((p, i) => ({ key: `lnk-${i}`, pos: p })),
  ];

  return (
    <div className="hidden px-6 py-4 lg:block">
      <div className="relative mx-auto aspect-[10/7] w-full max-w-4xl">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${VW} ${VH}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          {conexoes.map(({ key, pos }) => (
            <path
              key={key}
              d={curva(pos)}
              fill="none"
              className={cn(
                "transition-[stroke,stroke-width] duration-200",
                hover === key
                  ? "stroke-brand [stroke-width:3]"
                  : "stroke-border [stroke-width:1.5]",
              )}
            />
          ))}
        </svg>

        {/* Centro */}
        <div
          className="absolute z-10 w-[210px] -translate-x-1/2 -translate-y-1/2"
          style={{ left: pct(CX, VW), top: pct(CY, VH) }}
        >
          <div className="rounded-lg border border-brand/40 bg-card p-3 text-center shadow-md ring-4 ring-brand/5">
            {grafo.centro.imagem ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={grafo.centro.imagem}
                alt=""
                className="mx-auto mb-2 size-20 rounded-md border border-border object-cover"
              />
            ) : (
              <div className="mx-auto mb-2 flex size-20 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                {grafo.centro.tipo === "musica" ? (
                  <Music className="size-7" />
                ) : (
                  <Disc3 className="size-7" />
                )}
              </div>
            )}
            <p className="truncate font-semibold leading-tight" title={grafo.centro.titulo}>
              {grafo.centro.titulo}
            </p>
            {grafo.centro.meta.length > 0 && (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {grafo.centro.meta.join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* Relacionados (topo) — chips compactos, somente leitura */}
        {rel.visiveis.map((r, i) => (
          <NoChip
            key={r.id}
            pos={posRel[i]}
            delay={i}
            onHover={(v) => setHover(v ? `rel-${i}` : null)}
            icone={
              grafo.centro.tipo === "musica" ? (
                <Disc3 className="size-3.5" />
              ) : (
                <Music className="size-3.5" />
              )
            }
            titulo={r.titulo}
            subtitulo={r.subtitulo}
          />
        ))}
        {rel.resto > 0 && (
          <NoMais
            pos={posRel[posRel.length - 1]}
            n={rel.resto}
            onHover={(v) => setHover(v ? `rel-${posRel.length - 1}` : null)}
            onClick={onVerTudo}
          />
        )}

        {/* Colaboradores (direita) */}
        {col.visiveis.map((c, i) => (
          <NoCard
            key={c.vinculoId}
            pos={posCol[i]}
            delay={i}
            onHover={(v) => setHover(v ? `col-${i}` : null)}
            icone={<User className="size-4" />}
            titulo={c.nome}
            subtitulo={c.papel}
            onRemove={() =>
              onRemove({ kind: "colaborador", id: c.vinculoId, label: c.nome })
            }
          />
        ))}
        {col.resto > 0 && (
          <NoMais
            pos={posCol[col.visiveis.length]}
            n={col.resto}
            onHover={(v) => setHover(v ? `col-${col.visiveis.length}` : null)}
            onClick={onVerTudo}
          />
        )}
        <NoAdicionar
          pos={posCol[posCol.length - 1]}
          rotulo="Colaborador"
          onHover={(v) => setHover(v ? `col-${posCol.length - 1}` : null)}
          onClick={() => onAdd("colaborador")}
        />

        {/* Plataformas (esquerda) */}
        {lnk.visiveis.map((l, i) => (
          <NoCard
            key={l.id}
            pos={posLink[i]}
            delay={i}
            onHover={(v) => setHover(v ? `lnk-${i}` : null)}
            icone={<ExternalLink className="size-4" />}
            titulo={l.plataforma}
            subtitulo={l.url}
            href={l.url}
            onRemove={() => onRemove({ kind: "link", id: l.id, label: l.plataforma })}
          />
        ))}
        {lnk.resto > 0 && (
          <NoMais
            pos={posLink[lnk.visiveis.length]}
            n={lnk.resto}
            onHover={(v) => setHover(v ? `lnk-${lnk.visiveis.length}` : null)}
            onClick={onVerTudo}
          />
        )}
        <NoAdicionar
          pos={posLink[posLink.length - 1]}
          rotulo="Link"
          onHover={(v) => setHover(v ? `lnk-${posLink.length - 1}` : null)}
          onClick={() => onAdd("link")}
        />
      </div>
    </div>
  );
}

function NoCard({
  pos,
  delay,
  titulo,
  subtitulo,
  imagem,
  icone,
  href,
  onRemove,
  onHover,
}: {
  pos: Pos;
  delay: number;
  titulo: string;
  subtitulo: string | null;
  imagem?: string | null;
  icone: React.ReactNode;
  href?: string;
  onRemove?: () => void;
  onHover: (v: boolean) => void;
}) {
  const Conteudo = (
    <>
      <span className="shrink-0 text-muted-foreground">{icone}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium leading-tight">{titulo}</span>
        {subtitulo && (
          <span className="block truncate text-xs text-muted-foreground">{subtitulo}</span>
        )}
      </span>
    </>
  );

  return (
    <div
      className="group animate-board-node absolute z-10 w-[160px] -translate-x-1/2 -translate-y-1/2"
      style={{
        left: pct(pos.x, VW),
        top: pct(pos.y, VH),
        animationDelay: `${delay * 45}ms`,
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className="relative flex items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-sm transition-colors hover:border-brand">
        {imagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagem}
            alt=""
            className="size-9 shrink-0 rounded border border-border object-cover"
          />
        ) : null}
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 flex-1 items-center gap-2 hover:underline"
          >
            {Conteudo}
          </a>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">{Conteudo}</div>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${titulo}`}
            className="absolute -right-2 -top-2 rounded-full border border-border bg-card p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Chip compacto do setor superior (cabem mais itens que um card). */
function NoChip({
  pos,
  delay,
  titulo,
  subtitulo,
  icone,
  onHover,
}: {
  pos: Pos;
  delay: number;
  titulo: string;
  subtitulo: string | null;
  icone: React.ReactNode;
  onHover: (v: boolean) => void;
}) {
  return (
    <div
      className="animate-board-node absolute z-10 w-[130px] -translate-x-1/2 -translate-y-1/2"
      style={{
        left: pct(pos.x, VW),
        top: pct(pos.y, VH),
        animationDelay: `${delay * 45}ms`,
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm transition-colors hover:border-brand">
        <span className="shrink-0 text-muted-foreground">{icone}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium leading-tight" title={titulo}>
            {titulo}
          </span>
          {subtitulo && (
            <span className="block truncate text-[11px] text-muted-foreground">
              {subtitulo}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

/** Nó de excedente: abre a visão em lista com todos os vínculos. */
function NoMais({
  pos,
  n,
  onClick,
  onHover,
}: {
  pos: Pos;
  n: number;
  onClick: () => void;
  onHover: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="animate-board-node absolute z-10 w-[130px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
      style={{ left: pct(pos.x, VW), top: pct(pos.y, VH) }}
    >
      +{n} mais
    </button>
  );
}

function NoAdicionar({
  pos,
  rotulo,
  onClick,
  onHover,
}: {
  pos: Pos;
  rotulo: string;
  onClick: () => void;
  onHover: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="animate-board-node absolute z-10 flex w-[160px] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1.5 rounded-lg border border-dashed border-input bg-muted/40 p-2 text-xs text-muted-foreground transition-colors hover:border-brand hover:bg-brand-subtle hover:text-foreground"
      style={{ left: pct(pos.x, VW), top: pct(pos.y, VH) }}
    >
      <Plus className="size-4" />
      {rotulo}
    </button>
  );
}

// ---------- Lista (mobile e modo "lista") ----------

function ListaVinculos({
  grafo,
  onAdd,
  onRemove,
  className,
}: {
  grafo: ObraGrafo;
  onAdd: (t: "colaborador" | "link") => void;
  onRemove: (a: RemoveAlvo) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-5 px-6 py-4", className)}>
      <Secao titulo={grafo.relacionados.rotulo}>
        {grafo.relacionados.itens.length === 0 && <Vazio>Sem vínculo.</Vazio>}
        {grafo.relacionados.itens.map((r) => (
          <Linha key={r.id} titulo={r.titulo} subtitulo={r.subtitulo} />
        ))}
      </Secao>

      <Secao
        titulo="Colaboradores"
        acao={
          <Button size="sm" variant="secondary" onClick={() => onAdd("colaborador")}>
            <Plus className="size-4" /> Adicionar
          </Button>
        }
      >
        {grafo.colaboradores.length === 0 && <Vazio>Nenhum colaborador.</Vazio>}
        {grafo.colaboradores.map((c) => (
          <Linha
            key={c.vinculoId}
            titulo={c.nome}
            subtitulo={c.papel}
            onRemove={() =>
              onRemove({ kind: "colaborador", id: c.vinculoId, label: c.nome })
            }
          />
        ))}
      </Secao>

      <Secao
        titulo="Plataformas"
        acao={
          <Button size="sm" variant="secondary" onClick={() => onAdd("link")}>
            <Plus className="size-4" /> Adicionar
          </Button>
        }
      >
        {grafo.links.length === 0 && <Vazio>Nenhum link.</Vazio>}
        {grafo.links.map((l) => (
          <Linha
            key={l.id}
            titulo={l.plataforma}
            subtitulo={l.url}
            href={l.url}
            onRemove={() => onRemove({ kind: "link", id: l.id, label: l.plataforma })}
          />
        ))}
      </Secao>
    </div>
  );
}

function Secao({
  titulo,
  acao,
  children,
}: {
  titulo: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
          {titulo}
        </h3>
        {acao}
      </div>
      <ul className="divide-y divide-border rounded-md border border-border">{children}</ul>
    </section>
  );
}

function Vazio({ children }: { children: React.ReactNode }) {
  return <li className="px-3 py-2 text-sm text-muted-foreground">{children}</li>;
}

function Linha({
  titulo,
  subtitulo,
  href,
  onRemove,
}: {
  titulo: string;
  subtitulo: string | null;
  href?: string;
  onRemove?: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2">
      <div className="min-w-0">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm font-medium hover:underline"
          >
            {titulo}
          </a>
        ) : (
          <p className="truncate text-sm font-medium">{titulo}</p>
        )}
        {subtitulo && (
          <p className="truncate text-xs text-muted-foreground">{subtitulo}</p>
        )}
      </div>
      {onRemove && (
        <Button variant="ghost" size="sm" onClick={onRemove}>
          Remover
        </Button>
      )}
    </li>
  );
}

// ---------- Painel de adicionar ----------

function PainelAdicionar({
  tipo,
  grafo,
  pending,
  onClose,
  onColaborador,
  onLink,
}: {
  tipo: "colaborador" | "link";
  grafo: ObraGrafo;
  pending: boolean;
  onClose: () => void;
  onColaborador: (colaboradorId: string, roleId: string) => void;
  onLink: (plataforma: string, url: string) => void;
}) {
  const [colId, setColId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [plataforma, setPlataforma] = useState("");
  const [url, setUrl] = useState("");

  return (
    <div className="border-t border-border bg-muted/30 px-6 py-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {tipo === "colaborador" ? "Vincular colaborador" : "Adicionar link"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {tipo === "colaborador" ? (
        <div className="flex flex-wrap items-end gap-2">
          <Select
            value={colId}
            onChange={(e) => setColId(e.target.value)}
            className="w-44"
          >
            <option value="">Colaborador…</option>
            {grafo.opcoes.colaboradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
          <Select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="w-40"
          >
            <option value="">Papel…</option>
            {grafo.opcoes.roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </Select>
          <Button
            disabled={pending || !colId || !roleId}
            onClick={() => onColaborador(colId, roleId)}
          >
            Vincular
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <Select
            value={plataforma}
            onChange={(e) => setPlataforma(e.target.value)}
            className="w-40"
          >
            <option value="">Plataforma…</option>
            {PLATAFORMAS.map((p) => (
              <option key={p.nome} value={p.nome}>
                {p.nome}
              </option>
            ))}
          </Select>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="spotify.com/… (https:// opcional)"
            className="w-64"
          />
          <Button
            disabled={pending || !plataforma || !url}
            onClick={() => onLink(plataforma, url)}
          >
            Adicionar
          </Button>
        </div>
      )}
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="space-y-3 px-6 py-10">
      <Skeleton className="mx-auto h-28 w-52" />
      <div className="flex justify-center gap-3">
        <Skeleton className="h-14 w-40" />
        <Skeleton className="h-14 w-40" />
        <Skeleton className="h-14 w-40" />
      </div>
    </div>
  );
}
