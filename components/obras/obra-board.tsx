"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  Disc3,
  ExternalLink,
  Music,
  Plus,
  User,
  X,
} from "lucide-react";
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
  type GrafoColaborador,
  type ObraGrafo,
} from "@/app/(admin)/obras/vinculos";

// Espaço de coordenadas do board (o SVG e os nós compartilham este sistema).
const VW = 1000;
const VH = 720;
const CX = VW / 2;
const CY = VH / 2;

type Pos = { x: number; y: number };

/**
 * Cada setor tem dois anéis: o **nó da categoria** (hub), mais perto do centro,
 * e os itens, que ramificam a partir dele. Setores não se cruzam, e o excedente
 * de cada um vira "+N", que abre a lista completa.
 */
const SETOR = {
  topo: {
    angulo: -90,
    hub: { rx: 0, ry: 132 },
    item: { rx: 320, ry: 274 },
    spread: 72,
    passo: 26,
    max: 4,
  },
  lado: {
    // O hub fica entre o centro e os itens: raio do item - meia-largura do card
    // precisa passar da borda da pílula, senão um encosta no outro.
    hub: { rx: 190, ry: 0 },
    item: { rx: 384, ry: 268 },
    spread: 76,
    passo: 26,
    max: 4,
  },
} as const;

const ponto = (anguloGrau: number, rx: number, ry: number): Pos => {
  const rad = (anguloGrau * Math.PI) / 180;
  return { x: CX + Math.cos(rad) * rx, y: CY + Math.sin(rad) * ry };
};

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
  if (n === 1) return [ponto(anguloCentral, rx, ry)];
  const spread = Math.min(spreadMax, passoGrau * (n - 1));
  const inicio = anguloCentral - spread / 2;
  const passo = spread / (n - 1);
  return Array.from({ length: n }, (_, i) => ponto(inicio + passo * i, rx, ry));
}

/** Curva suave entre dois pontos (leve arqueamento perpendicular). */
function curva(de: Pos, para: Pos): string {
  const mx = (de.x + para.x) / 2;
  const my = (de.y + para.y) / 2;
  const dx = para.x - de.x;
  const dy = para.y - de.y;
  const k = 0.1;
  return `M ${de.x} ${de.y} Q ${mx - dy * k} ${my + dx * k} ${para.x} ${para.y}`;
}

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

/** Item em foco: o board destaca e o painel de detalhes abre embaixo. */
type Sel =
  | { kind: "rel"; id: string }
  | { kind: "col"; id: string }
  | { kind: "link"; id: string };

type RemoveAlvo = { kind: "colaborador" | "link"; id: string; label: string };

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
  const [sel, setSel] = useState<Sel | null>(null);
  const [modo, setModo] = useState<"board" | "lista">("board");
  const [painel, setPainel] = useState<"colaborador" | "link" | null>(null);
  const [del, setDel] = useState<RemoveAlvo | null>(null);

  const carregar = useCallback(async () => {
    const r = await getObraGrafo(tipo, obraId);
    if (!r.ok) return setErro(r.error);
    setGrafo(r.grafo);
  }, [tipo, obraId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Escape: primeiro tira o foco do item, depois fecha o board.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (sel) setSel(null);
      else onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, sel]);

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
    // Tela cheia: o board precisa de espaço, e não há fundo para clicar fora —
    // fecha pelo X ou pelo Escape.
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vínculos da obra"
      className="fixed inset-0 z-50 flex flex-col bg-card"
    >
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
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
          {/* Só esta faixa rola; cabeçalho, painéis e rodapé ficam fixos. */}
          <div className="relative flex-1 overflow-y-auto">
            {modo === "board" && (
            <Board
              grafo={grafo}
              hover={hover}
              setHover={setHover}
              sel={sel}
              onSelect={setSel}
              onAdd={setPainel}
              onRemove={setDel}
              onVerTudo={() => setModo("lista")}
            />
            )}
            {/* No mobile é sempre lista; no desktop, só quando o modo é "lista". */}
            <ListaVinculos
              className={modo === "board" ? "lg:hidden" : undefined}
              grafo={grafo}
              sel={sel}
              onSelect={setSel}
              onAdd={setPainel}
              onRemove={setDel}
            />
          </div>

          {sel && (
            <PainelDetalhe
              grafo={grafo}
              sel={sel}
              onClose={() => setSel(null)}
              onAdd={setPainel}
              onRemove={setDel}
            />
          )}

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

          <footer className="flex shrink-0 justify-end border-t border-border px-6 py-3">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/obras/${tipo}/${obraId}`}>Abrir página completa →</Link>
            </Button>
          </footer>
        </>
      )}

      <ConfirmDialog
        open={!!del}
        title={del?.kind === "link" ? "Remover link" : "Remover colaboração"}
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
  );
}

// ---------- Board radial (desktop) ----------

/** Aplica o limite do setor: o excedente vira um único nó "+N". */
function comLimite<T>(itens: T[], max: number): { visiveis: T[]; resto: number } {
  if (itens.length <= max) return { visiveis: itens, resto: 0 };
  return { visiveis: itens.slice(0, max - 1), resto: itens.length - (max - 1) };
}

function Board({
  grafo,
  hover,
  setHover,
  sel,
  onSelect,
  onAdd,
  onRemove,
  onVerTudo,
}: {
  grafo: ObraGrafo;
  hover: string | null;
  setHover: (v: string | null) => void;
  sel: Sel | null;
  onSelect: (s: Sel | null) => void;
  onAdd: (t: "colaborador" | "link") => void;
  onRemove: (a: RemoveAlvo) => void;
  onVerTudo: () => void;
}) {
  const rel = comLimite(grafo.relacionados.itens, SETOR.topo.max);
  const col = comLimite(grafo.colaboradores, SETOR.lado.max);
  const lnk = comLimite(grafo.links, SETOR.lado.max);

  const { topo, lado } = SETOR;
  const hubRel = ponto(topo.angulo, topo.hub.rx, topo.hub.ry);
  const hubCol = ponto(0, lado.hub.rx, lado.hub.ry);
  const hubLnk = ponto(180, lado.hub.rx, lado.hub.ry);

  // Cada setor reserva posições para: itens visíveis + "+N" (se houver) + adicionar.
  const posRel = arco(
    rel.visiveis.length + (rel.resto ? 1 : 0),
    topo.angulo,
    topo.spread,
    topo.passo,
    topo.item.rx,
    topo.item.ry,
  );
  const posCol = arco(
    col.visiveis.length + (col.resto ? 1 : 0) + 1,
    0,
    lado.spread,
    lado.passo,
    lado.item.rx,
    lado.item.ry,
  );
  const posLink = arco(
    lnk.visiveis.length + (lnk.resto ? 1 : 0) + 1,
    180,
    lado.spread,
    lado.passo,
    lado.item.rx,
    lado.item.ry,
  );

  // Chave da linha em destaque: o hover manda; sem hover, o item em foco.
  const focoChave =
    hover ??
    (sel
      ? sel.kind === "rel"
        ? `rel-${grafo.relacionados.itens.findIndex((r) => r.id === sel.id)}`
        : sel.kind === "col"
          ? `col-${grafo.colaboradores.findIndex((c) => c.colaboradorId === sel.id)}`
          : `lnk-${grafo.links.findIndex((l) => l.id === sel.id)}`
      : null);

  const aceso = (chave: string) => focoChave === chave;
  const troncoAceso = (setor: string) => !!focoChave?.startsWith(`${setor}-`);

  const centro = { x: CX, y: CY };
  // Tronco (centro → categoria) e ramos (categoria → item) numa lista só: o
  // halo e o traço percorrem a mesma coleção, sempre na mesma ordem.
  const linhas = [
    { key: "tronco-rel", de: centro, para: hubRel, tronco: true, aceso: troncoAceso("rel") },
    { key: "tronco-col", de: centro, para: hubCol, tronco: true, aceso: troncoAceso("col") },
    { key: "tronco-lnk", de: centro, para: hubLnk, tronco: true, aceso: troncoAceso("lnk") },
    ...posRel.map((p, i) => ({ key: `rel-${i}`, de: hubRel, para: p, tronco: false, aceso: aceso(`rel-${i}`) })),
    ...posCol.map((p, i) => ({ key: `col-${i}`, de: hubCol, para: p, tronco: false, aceso: aceso(`col-${i}`) })),
    ...posLink.map((p, i) => ({ key: `lnk-${i}`, de: hubLnk, para: p, tronco: false, aceso: aceso(`lnk-${i}`) })),
  ].map((l, i) => ({ ...l, d: curva(l.de, l.para), atraso: i * 380 }));
  // Com um item em foco, o resto recua para o segundo plano.
  const apagado = (chave: string) => !!sel && !aceso(chave);

  return (
    <div className="hidden h-full min-h-[560px] px-6 py-4 lg:block">
      <div className="relative mx-auto h-full w-full max-w-6xl">
        <div aria-hidden className="board-grade absolute inset-0 rounded-lg" />
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${VW} ${VH}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* Halos primeiro, para o traço nítido ficar por cima de todos. */}
          {linhas.map(({ key, d, atraso, aceso: on }) => (
            <path
              key={`halo-${key}`}
              d={d}
              fill="none"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              data-aceso={on}
              className="board-halo stroke-brand [stroke-width:9]"
              style={{ animationDelay: `${atraso}ms` }}
            />
          ))}
          {linhas.map(({ key, d, tronco, aceso: on }) => (
            <path
              key={key}
              d={d}
              fill="none"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className={cn(
                "transition-[stroke,stroke-width] duration-300",
                on
                  ? "stroke-brand [stroke-width:2.5]"
                  : tronco
                    ? "stroke-border [stroke-width:1.75]"
                    : "stroke-border [stroke-width:1.25]",
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

        {/* Nós de categoria: a conexão passa por eles antes de ramificar. */}
        <NoCategoria
          pos={hubRel}
          rotulo={grafo.relacionados.rotulo}
          n={grafo.relacionados.itens.length}
          aceso={troncoAceso("rel")}
        />
        <NoCategoria
          pos={hubCol}
          rotulo="Colaboradores"
          n={grafo.colaboradores.length}
          aceso={troncoAceso("col")}
        />
        <NoCategoria
          pos={hubLnk}
          rotulo="Plataformas"
          n={grafo.links.length}
          aceso={troncoAceso("lnk")}
        />

        {/* Relacionados (topo) — chips compactos, somente leitura */}
        {rel.visiveis.map((r, i) => (
          <NoChip
            key={r.id}
            pos={posRel[i]}
            delay={i}
            onHover={(v) => setHover(v ? `rel-${i}` : null)}
            onClick={() => onSelect({ kind: "rel", id: r.id })}
            aceso={aceso(`rel-${i}`)}
            apagado={apagado(`rel-${i}`)}
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

        {/* Colaboradores (direita) — um card por pessoa, papéis recolhíveis */}
        {col.visiveis.map((c, i) => (
          <NoColaborador
            key={c.colaboradorId}
            pos={posCol[i]}
            delay={i}
            colaborador={c}
            aceso={aceso(`col-${i}`)}
            apagado={apagado(`col-${i}`)}
            onHover={(v) => setHover(v ? `col-${i}` : null)}
            onClick={() => onSelect({ kind: "col", id: c.colaboradorId })}
            onRemovePapel={(p) =>
              onRemove({
                kind: "colaborador",
                id: p.vinculoId,
                label: `${c.nome} — ${p.papel}`,
              })
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
            onClick={() => onSelect({ kind: "link", id: l.id })}
            aceso={aceso(`lnk-${i}`)}
            apagado={apagado(`lnk-${i}`)}
            icone={<ExternalLink className="size-4" />}
            titulo={l.plataforma}
            subtitulo={l.url}
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

/** Posiciona um nó no sistema de coordenadas do board. */
function noEstilo(pos: Pos, delay = 0): React.CSSProperties {
  return {
    left: pct(pos.x, VW),
    top: pct(pos.y, VH),
    animationDelay: `${delay * 45}ms`,
  };
}

/** Nó de categoria ("Músicas", "Colaboradores"…) no meio da conexão. */
function NoCategoria({
  pos,
  rotulo,
  n,
  aceso,
}: {
  pos: Pos;
  rotulo: string;
  n: number;
  aceso: boolean;
}) {
  return (
    <div
      className="animate-board-node absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={noEstilo(pos)}
    >
      <span
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] shadow-sm transition-colors",
          aceso
            ? "border-brand bg-brand-subtle text-brand"
            : "border-border bg-muted text-muted-foreground",
        )}
      >
        {rotulo}
        <span className="rounded-full bg-background/70 px-1.5 text-[10px] font-medium tabular-nums">
          {n}
        </span>
      </span>
    </div>
  );
}

function NoCard({
  pos,
  delay,
  titulo,
  subtitulo,
  icone,
  aceso,
  apagado,
  onRemove,
  onHover,
  onClick,
}: {
  pos: Pos;
  delay: number;
  titulo: string;
  subtitulo: string | null;
  icone: React.ReactNode;
  aceso: boolean;
  apagado: boolean;
  onRemove?: () => void;
  onHover: (v: boolean) => void;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "group animate-board-node absolute z-10 w-[158px] -translate-x-1/2 -translate-y-1/2 transition-opacity",
        apagado && "opacity-40",
      )}
      style={noEstilo(pos, delay)}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div
        className={cn(
          "relative rounded-lg border bg-card shadow-sm transition-colors",
          aceso ? "border-brand ring-2 ring-brand/30" : "border-border hover:border-brand",
        )}
      >
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center gap-2 p-2 text-left"
        >
          <span className="shrink-0 text-muted-foreground">{icone}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium leading-tight">
              {titulo}
            </span>
            {subtitulo && (
              <span className="block truncate text-xs text-muted-foreground">
                {subtitulo}
              </span>
            )}
          </span>
        </button>
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

/**
 * Colaborador com todos os seus tipos de colaboração numa caixa só. O corpo
 * foca a pessoa; a seta abre e fecha a lista de papéis.
 */
function NoColaborador({
  pos,
  delay,
  colaborador,
  aceso,
  apagado,
  onHover,
  onClick,
  onRemovePapel,
}: {
  pos: Pos;
  delay: number;
  colaborador: GrafoColaborador;
  aceso: boolean;
  apagado: boolean;
  onHover: (v: boolean) => void;
  onClick: () => void;
  onRemovePapel: (p: { vinculoId: string; papel: string }) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const n = colaborador.papeis.length;

  return (
    <div
      className={cn(
        "animate-board-node absolute w-[164px] -translate-x-1/2 -translate-y-1/2 transition-opacity",
        aberto ? "z-20" : "z-10",
        apagado && "opacity-40",
      )}
      style={noEstilo(pos, delay)}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div
        className={cn(
          "rounded-lg border bg-card shadow-sm transition-colors",
          aceso ? "border-brand ring-2 ring-brand/30" : "border-border hover:border-brand",
        )}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClick}
            className="flex min-w-0 flex-1 items-center gap-2 p-2 text-left"
          >
            <User className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium leading-tight">
                {colaborador.nome}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {/* "Composição +2" cabe; a lista inteira, não. */}
                {n === 1
                  ? colaborador.papeis[0].papel
                  : `${colaborador.papeis[0].papel} +${n - 1}`}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-label={
              aberto
                ? `Recolher tipos de colaboração de ${colaborador.nome}`
                : `Expandir tipos de colaboração de ${colaborador.nome}`
            }
            className="mr-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-150",
                aberto && "rotate-180",
              )}
            />
          </button>
        </div>

        {aberto && (
          <ul className="border-t border-border p-1">
            {colaborador.papeis.map((p) => (
              <li
                key={p.vinculoId}
                className="flex items-center justify-between gap-1 rounded px-1.5 py-1 text-xs hover:bg-accent"
              >
                <span className="min-w-0 truncate">{p.papel}</span>
                <button
                  type="button"
                  onClick={() => onRemovePapel(p)}
                  aria-label={`Remover ${p.papel} de ${colaborador.nome}`}
                  className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
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
  aceso,
  apagado,
  onHover,
  onClick,
}: {
  pos: Pos;
  delay: number;
  titulo: string;
  subtitulo: string | null;
  icone: React.ReactNode;
  aceso: boolean;
  apagado: boolean;
  onHover: (v: boolean) => void;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "animate-board-node absolute z-10 w-[140px] -translate-x-1/2 -translate-y-1/2 transition-opacity",
        apagado && "opacity-40",
      )}
      style={noEstilo(pos, delay)}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-left shadow-sm transition-colors",
          aceso ? "border-brand ring-2 ring-brand/30" : "border-border hover:border-brand",
        )}
      >
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
      </button>
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
      style={noEstilo(pos)}
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
      style={noEstilo(pos)}
    >
      <Plus className="size-4" />
      {rotulo}
    </button>
  );
}

// ---------- Painel de detalhes do item em foco ----------

function PainelDetalhe({
  grafo,
  sel,
  onClose,
  onAdd,
  onRemove,
}: {
  grafo: ObraGrafo;
  sel: Sel;
  onClose: () => void;
  onAdd: (t: "colaborador" | "link") => void;
  onRemove: (a: RemoveAlvo) => void;
}) {
  const rel =
    sel.kind === "rel"
      ? grafo.relacionados.itens.find((r) => r.id === sel.id)
      : undefined;
  const col =
    sel.kind === "col"
      ? grafo.colaboradores.find((c) => c.colaboradorId === sel.id)
      : undefined;
  const link =
    sel.kind === "link" ? grafo.links.find((l) => l.id === sel.id) : undefined;

  // O relacionado é do tipo oposto ao centro: música aponta coleção, e vice-versa.
  const tipoRel: ObraTipo = grafo.centro.tipo === "musica" ? "colecao" : "musica";
  const titulo = rel?.titulo ?? col?.nome ?? link?.plataforma ?? "";
  const categoria =
    sel.kind === "rel"
      ? grafo.relacionados.rotulo
      : sel.kind === "col"
        ? "Colaborador"
        : "Plataforma";

  return (
    <section className="border-t border-border bg-muted/30 px-6 py-4">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
            {categoria}
          </p>
          <h3 className="truncate text-base font-semibold tracking-tight">{titulo}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {rel && (
        <div className="flex flex-wrap items-center gap-3">
          {rel.imagem && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={rel.imagem}
              alt=""
              className="size-14 rounded-md border border-border object-cover"
            />
          )}
          {rel.subtitulo && (
            <p className="text-sm text-muted-foreground">{rel.subtitulo}</p>
          )}
          <Button asChild variant="secondary" size="sm" className="ml-auto">
            <Link href={`/obras/${tipoRel}/${rel.id}`}>Abrir página →</Link>
          </Button>
        </div>
      )}

      {col && (
        <div className="space-y-3">
          {col.instagram && (
            <a
              href={`https://instagram.com/${col.instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
            >
              {col.instagram}
              <ExternalLink className="size-3.5" />
            </a>
          )}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
              Tipos de colaboração ({col.papeis.length})
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {col.papeis.map((p) => (
                <li
                  key={p.vinculoId}
                  className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs"
                >
                  {p.papel}
                  <button
                    type="button"
                    onClick={() =>
                      onRemove({
                        kind: "colaborador",
                        id: p.vinculoId,
                        label: `${col.nome} — ${p.papel}`,
                      })
                    }
                    aria-label={`Remover ${p.papel} de ${col.nome}`}
                    className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <Button variant="secondary" size="sm" onClick={() => onAdd("colaborador")}>
            <Plus className="size-4" /> Outro tipo de colaboração
          </Button>
        </div>
      )}

      {link && (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-sm text-brand hover:underline"
          >
            {link.url}
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() =>
              onRemove({ kind: "link", id: link.id, label: link.plataforma })
            }
          >
            Remover
          </Button>
        </div>
      )}
    </section>
  );
}

// ---------- Lista (mobile e modo "lista") ----------

function ListaVinculos({
  grafo,
  sel,
  onSelect,
  onAdd,
  onRemove,
  className,
}: {
  grafo: ObraGrafo;
  sel: Sel | null;
  onSelect: (s: Sel | null) => void;
  onAdd: (t: "colaborador" | "link") => void;
  onRemove: (a: RemoveAlvo) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-5 px-6 py-4", className)}>
      <Secao titulo={grafo.relacionados.rotulo}>
        {grafo.relacionados.itens.length === 0 && <Vazio>Sem vínculo.</Vazio>}
        {grafo.relacionados.itens.map((r) => (
          <Linha
            key={r.id}
            titulo={r.titulo}
            subtitulo={r.subtitulo}
            aceso={sel?.kind === "rel" && sel.id === r.id}
            onClick={() => onSelect({ kind: "rel", id: r.id })}
          />
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
            key={c.colaboradorId}
            titulo={c.nome}
            subtitulo={c.papeis.map((p) => p.papel).join(", ")}
            aceso={sel?.kind === "col" && sel.id === c.colaboradorId}
            onClick={() => onSelect({ kind: "col", id: c.colaboradorId })}
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
            aceso={sel?.kind === "link" && sel.id === l.id}
            onClick={() => onSelect({ kind: "link", id: l.id })}
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
  aceso,
  onClick,
  onRemove,
}: {
  titulo: string;
  subtitulo: string | null;
  aceso?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2",
        aceso && "bg-brand-subtle",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 text-left"
        disabled={!onClick}
      >
        <span className="block truncate text-sm font-medium">{titulo}</span>
        {subtitulo && (
          <span className="block truncate text-xs text-muted-foreground">
            {subtitulo}
          </span>
        )}
      </button>
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
            <option value="">Tipo de colaboração…</option>
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
