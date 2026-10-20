"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Crosshair,
  Disc3,
  ExternalLink,
  Minus,
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

/**
 * O board tem um "mundo" próprio, bem maior que a janela: as coordenadas abaixo
 * são pixels desse mundo, e a janela mostra um pedaço dele com pan e zoom.
 */
const MUNDO = { w: 3200, h: 2200 };
const CX = MUNDO.w / 2;
const CY = MUNDO.h / 2;

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;

type Pos = { x: number; y: number };
type Setor = "rel" | "col" | "lnk";

/**
 * Cada setor tem o **nó da categoria** (hub) mais perto do centro e os itens
 * ramificando a partir dele. Setores não se cruzam. Quando o leque enche, os
 * itens seguintes vão para um anel mais afastado, em vez de virar "+N" — a
 * constelação mostra o acervo inteiro.
 */
const SETOR = {
  /** Vertical: a coleção fica acima da música; as músicas, abaixo da coleção. */
  vertical: {
    hub: { rx: 0, ry: 240 },
    item: { rx: 640, ry: 430 },
    spread: 104,
    passo: 16,
    /** Distância entre um anel e o seguinte. */
    anel: { rx: 170, ry: 150 },
  },
  lado: {
    // O hub fica entre o centro e os itens: raio do item - meia-largura do card
    // precisa passar da borda da pílula, senão um encosta no outro.
    hub: { rx: 420, ry: 0 },
    item: { rx: 860, ry: 420 },
    spread: 80,
    passo: 24,
    anel: { rx: 230, ry: 130 },
  },
} as const;

const ponto = (anguloGrau: number, rx: number, ry: number): Pos => {
  const rad = (anguloGrau * Math.PI) / 180;
  return { x: CX + Math.cos(rad) * rx, y: CY + Math.sin(rad) * ry };
};

type ConfigSetor = {
  readonly hub: { readonly rx: number; readonly ry: number };
  readonly item: { readonly rx: number; readonly ry: number };
  readonly spread: number;
  readonly passo: number;
  readonly anel: { readonly rx: number; readonly ry: number };
};

/**
 * Distribui `n` nós no setor (0° = direita, -90° = topo, 90° = baixo). O leque
 * comporta `floor(spread / passo) + 1` por anel; o que não cabe vai para o
 * anel seguinte, mais afastado, meio passo deslocado para não enfileirar.
 */
function arco(n: number, anguloCentral: number, setor: ConfigSetor): Pos[] {
  if (n === 0) return [];
  const porAnel = Math.max(1, Math.floor(setor.spread / setor.passo) + 1);
  const aneis = Math.ceil(n / porAnel);

  const pos: Pos[] = [];
  for (let a = 0; a < aneis; a++) {
    const neste = Math.min(porAnel, n - a * porAnel);
    const rx = setor.item.rx + a * setor.anel.rx;
    const ry = setor.item.ry + a * setor.anel.ry;
    if (neste === 1) {
      pos.push(ponto(anguloCentral, rx, ry));
      continue;
    }
    const spread = Math.min(setor.spread, setor.passo * (neste - 1));
    // Anel ímpar sai meio passo torto: dois nós não ficam um atrás do outro.
    const desvio = a % 2 === 1 ? setor.passo / 2 : 0;
    const inicio = anguloCentral - spread / 2 + desvio;
    const passo = spread / (neste - 1);
    for (let i = 0; i < neste; i++) {
      pos.push(ponto(inicio + passo * i, rx, ry));
    }
  }
  return pos;
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

const limitar = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Item em foco: o board destaca e o painel de detalhes abre embaixo. */
type Sel =
  | { kind: "rel"; id: string }
  | { kind: "col"; id: string }
  | { kind: "link"; id: string };

type RemoveAlvo = { kind: "colaborador" | "link"; id: string; label: string };

/** Obra que está (ou vai ficar) no centro. */
type Raiz = { tipo: ObraTipo; id: string };

/** Alvo da corrida de câmera; `chave` muda a cada pedido, para a Janela reagir. */
type FocoCamera = { x: number; y: number; chave: string };

/** Duração da corrida de câmera antes de trocar o centro. */
const MS_CAMERA = 520;

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
  /** Obra no centro da constelação — muda ao clicar num relacionado. */
  const [raiz, setRaiz] = useState<Raiz>({ tipo, id: obraId });
  /** Caminho percorrido, para voltar ao que estava no centro antes. */
  const [trilha, setTrilha] = useState<(Raiz & { titulo: string })[]>([]);
  const [grafo, setGrafo] = useState<ObraGrafo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [hover, setHover] = useState<string | null>(null);
  const [sel, setSel] = useState<Sel | null>(null);
  const [modo, setModo] = useState<"board" | "lista">("board");
  const [painel, setPainel] = useState<"colaborador" | "link" | null>(null);
  const [del, setDel] = useState<RemoveAlvo | null>(null);
  /** Ponto do mundo para onde a câmera deve correr antes de reenraizar. */
  const [foco, setFoco] = useState<FocoCamera | null>(null);

  const carregar = useCallback(async () => {
    const r = await getObraGrafo(raiz.tipo, raiz.id);
    if (!r.ok) return setErro(r.error);
    setErro(null);
    setGrafo(r.grafo);
  }, [raiz]);

  /**
   * Clique num relacionado: a câmera corre até ele e, terminada a corrida, ele
   * passa a ser o centro — é o gesto de "entrar" naquele ponto da constelação.
   */
  function reenraizar(destino: Raiz, pos: Pos) {
    if (!grafo) return;
    setFoco({ ...pos, chave: `${destino.tipo}-${destino.id}-${Date.now()}` });
    setTrilha((t) => [...t, { ...raiz, titulo: grafo.centro.titulo }]);
    window.setTimeout(() => {
      setSel(null);
      setGrafo(null);
      setFoco(null);
      setRaiz(destino);
    }, MS_CAMERA);
  }

  function voltar() {
    const anterior = trilha[trilha.length - 1];
    if (!anterior) return;
    setTrilha((t) => t.slice(0, -1));
    setSel(null);
    setGrafo(null);
    setRaiz({ tipo: anterior.tipo, id: anterior.id });
  }

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
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-start gap-2">
          {trilha.length > 0 && (
            <button
              type="button"
              onClick={voltar}
              aria-label="Voltar para a obra anterior"
              title={`Voltar para "${trilha[trilha.length - 1].titulo}"`}
              className="mt-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
              {(grafo?.centro.tipo ?? tipo) === "musica" ? "Música" : "Coleção"} ·
              vínculos
            </p>
            <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
              {grafo?.centro.titulo ?? "Carregando…"}
            </h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {grafo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModo((m) => (m === "board" ? "lista" : "board"))}
            >
              <span className="hidden sm:inline">
                {modo === "board" ? "Ver como lista" : "Ver como board"}
              </span>
              <span className="sm:hidden">{modo === "board" ? "Lista" : "Board"}</span>
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
              // Trocar o centro remonta o board: a vista volta a enquadrar a
              // constelação nova, em vez de ficar na mira da anterior.
              key={raiz.id}
              foco={foco}
              onReenraizar={reenraizar}
              grafo={grafo}
              hover={hover}
              setHover={setHover}
              sel={sel}
              onSelect={setSel}
              onAdd={setPainel}
              onRemove={setDel}
            />
            )}
            {/* A lista é a outra vista, não o fallback do celular: agora a
                constelação também roda lá. */}
            {modo === "lista" && (
              <ListaVinculos
                grafo={grafo}
                sel={sel}
                onSelect={setSel}
                onAdd={setPainel}
                onRemove={setDel}
              />
            )}
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

function Board({
  grafo,
  hover,
  setHover,
  sel,
  onSelect,
  onAdd,
  onRemove,
  foco,
  onReenraizar,
}: {
  grafo: ObraGrafo;
  hover: string | null;
  setHover: (v: string | null) => void;
  sel: Sel | null;
  onSelect: (s: Sel | null) => void;
  onAdd: (t: "colaborador" | "link") => void;
  onRemove: (a: RemoveAlvo) => void;
  foco: FocoCamera | null;
  onReenraizar: (destino: Raiz, pos: Pos) => void;
}) {
  // Setores recolhidos mostram só o nó da categoria; os filhos somem do board.
  const [recolhidos, setRecolhidos] = useState<Set<Setor>>(new Set());
  const aberto = (s: Setor) => !recolhidos.has(s);

  function alternarSetor(setor: Setor) {
    setRecolhidos((atual) => {
      const novo = new Set(atual);
      if (novo.has(setor)) novo.delete(setor);
      else {
        novo.add(setor);
        // Recolher o setor do item em foco deixaria o painel órfão.
        if (sel?.kind === setor) onSelect(null);
      }
      return novo;
    });
  }

  // Todos os itens, sem teto: o que não cabe no leque vai para o anel de fora.
  const rel = aberto("rel") ? grafo.relacionados.itens : [];
  const col = aberto("col") ? grafo.colaboradores : [];
  const lnk = aberto("lnk") ? grafo.links : [];

  const { vertical, lado } = SETOR;
  // A hierarquia manda na direção: coleção acima da música, músicas abaixo da
  // coleção. Antes o relacionado ia sempre para cima, fosse o que fosse.
  const anguloRel = grafo.centro.tipo === "musica" ? -90 : 90;
  const sinal = anguloRel === -90 ? -1 : 1;
  const hubRel = ponto(anguloRel, vertical.hub.rx, vertical.hub.ry);
  const hubCol = ponto(0, lado.hub.rx, lado.hub.ry);
  const hubLnk = ponto(180, lado.hub.rx, lado.hub.ry);

  const posRel = arco(rel.length, anguloRel, vertical);
  // Os setores laterais reservam a última posição para o "+ Adicionar".
  const posCol = arco(col.length + (aberto("col") ? 1 : 0), 0, lado);
  const posLink = arco(lnk.length + (aberto("lnk") ? 1 : 0), 180, lado);

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

  // Retângulo que os nós ocupam de fato — é o que o "ajustar" enquadra.
  const usados = [centro, hubRel, hubCol, hubLnk, ...posRel, ...posCol, ...posLink];
  const limites = {
    x: Math.min(...usados.map((p) => p.x)) - 140,
    y: Math.min(...usados.map((p) => p.y)) - 90,
    w: Math.max(...usados.map((p) => p.x)) - Math.min(...usados.map((p) => p.x)) + 280,
    h: Math.max(...usados.map((p) => p.y)) - Math.min(...usados.map((p) => p.y)) + 180,
  };

  return (
    <div className="h-full min-h-[420px] px-3 py-3 sm:min-h-[560px] sm:px-6 sm:py-4">
      <Janela limites={limites} foco={foco}>
        <div aria-hidden className="board-grade absolute inset-0" />
        <svg
          className="absolute inset-0"
          width={MUNDO.w}
          height={MUNDO.h}
          aria-hidden
        >
          {/* Halos primeiro, para o traço nítido ficar por cima de todos. */}
          {linhas.map(({ key, d, atraso, aceso: on }) => (
            <path
              key={`halo-${key}`}
              d={d}
              fill="none"
              strokeLinecap="round"
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
          style={{ left: CX, top: CY }}
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
          aberto={aberto("rel")}
          onToggle={() => alternarSetor("rel")}
        />
        <NoCategoria
          pos={hubCol}
          rotulo="Colaboradores"
          n={grafo.colaboradores.length}
          aceso={troncoAceso("col")}
          aberto={aberto("col")}
          onToggle={() => alternarSetor("col")}
        />
        <NoCategoria
          pos={hubLnk}
          rotulo="Plataformas"
          n={grafo.links.length}
          aceso={troncoAceso("lnk")}
          aberto={aberto("lnk")}
          onToggle={() => alternarSetor("lnk")}
        />

        {/* Relacionados (topo) — chips compactos, somente leitura */}
        {rel.map((r, i) => (
          <NoChip
            key={r.id}
            pos={posRel[i]}
            delay={i}
            onHover={(v) => setHover(v ? `rel-${i}` : null)}
            onClick={() =>
              onReenraizar(
                // O relacionado é sempre do tipo oposto ao centro.
                {
                  tipo: grafo.centro.tipo === "musica" ? "colecao" : "musica",
                  id: r.id,
                },
                posRel[i],
              )
            }
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

        {/* Colaboradores (direita) — um card por pessoa, papéis recolhíveis */}
        {col.map((c, i) => (
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
        {aberto("col") && (
          <NoAdicionar
            pos={posCol[posCol.length - 1]}
            rotulo="Colaborador"
            onHover={(v) => setHover(v ? `col-${posCol.length - 1}` : null)}
            onClick={() => onAdd("colaborador")}
          />
        )}

        {/* Plataformas (esquerda) */}
        {lnk.map((l, i) => (
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
        {aberto("lnk") && (
          <NoAdicionar
            pos={posLink[posLink.length - 1]}
            rotulo="Link"
            onHover={(v) => setHover(v ? `lnk-${posLink.length - 1}` : null)}
            onClick={() => onAdd("link")}
          />
        )}
      </Janela>
    </div>
  );
}

/**
 * Janela sobre o mundo do board: arrastar com o mouse move, a roda da zoom no
 * ponto do cursor, e "ajustar" enquadra tudo. O arrasto so comeca fora de um
 * controle, para nao roubar o clique dos nos.
 */
function Janela({
  limites,
  foco,
  children,
}: {
  limites: { x: number; y: number; w: number; h: number };
  /** Ponto do mundo para onde a câmera deve correr. */
  foco?: FocoCamera | null;
  children: React.ReactNode;
}) {
  const janelaRef = useRef<HTMLDivElement>(null);
  const [vista, setVista] = useState({ x: 0, y: 0, k: 1 });
  const arrasto = useRef<{ px: number; py: number; x: number; y: number } | null>(
    null,
  );
  const [arrastando, setArrastando] = useState(false);

  const ajustar = useCallback(() => {
    const el = janelaRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const k = limitar(
      Math.min(width / limites.w, height / limites.h) * 0.96,
      ZOOM_MIN,
      ZOOM_MAX,
    );
    setVista({
      k,
      x: width / 2 - (limites.x + limites.w / 2) * k,
      y: height / 2 - (limites.y + limites.h / 2) * k,
    });
  }, [limites.x, limites.y, limites.w, limites.h]);

  // Enquadra uma vez, ao abrir. Depois a vista e do usuario.
  const enquadrou = useRef(false);
  useEffect(() => {
    if (enquadrou.current) return;
    enquadrou.current = true;
    ajustar();
  }, [ajustar]);

  /**
   * Corrida de câmera até um ponto do mundo. Quem anima é o CSS: um tween em
   * JS re-renderizaria o board inteiro a cada quadro, e a transição ainda roda
   * no compositor. Só o destino vira estado.
   */
  const [correndo, setCorrendo] = useState(false);
  useEffect(() => {
    const el = janelaRef.current;
    if (!foco || !el) return;
    const { width, height } = el.getBoundingClientRect();
    const k = limitar(Math.max(vista.k, 1.1), ZOOM_MIN, ZOOM_MAX);
    setCorrendo(true);
    setVista({ k, x: width / 2 - foco.x * k, y: height / 2 - foco.y * k });
    const t = setTimeout(() => setCorrendo(false), MS_CAMERA);
    return () => clearTimeout(t);
    // Só a chave dispara: `vista` entra como ponto de partida, não como gatilho.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foco?.chave]);

  const zoom = useCallback((fator: number, alvo?: { x: number; y: number }) => {
    const el = janelaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = alvo ? alvo.x - r.left : r.width / 2;
    const cy = alvo ? alvo.y - r.top : r.height / 2;
    setVista((v) => {
      const k = limitar(v.k * fator, ZOOM_MIN, ZOOM_MAX);
      const razao = k / v.k;
      return { k, x: cx - (cx - v.x) * razao, y: cy - (cy - v.y) * razao };
    });
  }, []);

  // Listener nativo: o onWheel do React e passivo e nao deixa cancelar a rolagem.
  useEffect(() => {
    const el = janelaRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, { x: e.clientX, y: e.clientY });
    };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, [zoom]);

  function aoApertar(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button, a")) return;
    setCorrendo(false);
    arrasto.current = { px: e.clientX, py: e.clientY, x: vista.x, y: vista.y };
    setArrastando(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function aoMover(e: React.PointerEvent) {
    const a = arrasto.current;
    if (!a) return;
    setVista((v) => ({
      ...v,
      x: a.x + (e.clientX - a.px),
      y: a.y + (e.clientY - a.py),
    }));
  }

  function aoSoltar() {
    arrasto.current = null;
    setArrastando(false);
  }

  /**
   * O mundo é maior que a janela, então o navegador consegue rolá-la por conta
   * própria (ao focar um nó pelo teclado, por exemplo) e a vista sairia do
   * lugar sem o transform saber. Converte essa rolagem em pan e zera o scroll.
   */
  function aoRolar(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const { scrollLeft: dx, scrollTop: dy } = el;
    if (!dx && !dy) return;
    el.scrollLeft = 0;
    el.scrollTop = 0;
    setVista((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
  }

  return (
    <div
      ref={janelaRef}
      onPointerDown={aoApertar}
      onPointerMove={aoMover}
      onPointerUp={aoSoltar}
      onPointerCancel={aoSoltar}
      onScroll={aoRolar}
      className={cn(
        // `touch-none`: no celular o arrasto é o gesto do board, não rolagem.
        "relative h-full w-full touch-none overflow-hidden rounded-lg border border-border/60",
        arrastando ? "cursor-grabbing" : "cursor-grab",
      )}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: MUNDO.w,
          height: MUNDO.h,
          transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.k})`,
          transition: correndo
            ? `transform ${MS_CAMERA}ms cubic-bezier(0.4, 0, 0.2, 1)`
            : undefined,
        }}
      >
        {children}
      </div>

      <div
        aria-hidden
        className="board-vinheta pointer-events-none absolute inset-0"
      />

      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md border border-border bg-card/90 p-1 shadow-sm backdrop-blur-sm">
        <ControleZoom
          rotulo="Diminuir zoom"
          onClick={() => zoom(1 / 1.25)}
          desabilitado={vista.k <= ZOOM_MIN + 0.001}
        >
          <Minus className="size-4" />
        </ControleZoom>
        <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
          {Math.round(vista.k * 100)}%
        </span>
        <ControleZoom
          rotulo="Aumentar zoom"
          onClick={() => zoom(1.25)}
          desabilitado={vista.k >= ZOOM_MAX - 0.001}
        >
          <Plus className="size-4" />
        </ControleZoom>
        <ControleZoom rotulo="Enquadrar tudo" onClick={ajustar}>
          <Crosshair className="size-4" />
        </ControleZoom>
      </div>
    </div>
  );
}

function ControleZoom({
  rotulo,
  onClick,
  desabilitado,
  children,
}: {
  rotulo: string;
  onClick: () => void;
  desabilitado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      aria-label={rotulo}
      title={rotulo}
      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

/** Posiciona um nó no sistema de coordenadas do board. */
function noEstilo(pos: Pos, delay = 0): React.CSSProperties {
  return { left: pos.x, top: pos.y, animationDelay: `${delay * 45}ms` };
}

/**
 * Nó de categoria ("Músicas", "Colaboradores"…) no meio da conexão. Clicar
 * recolhe ou abre os filhos daquele ramo.
 */
function NoCategoria({
  pos,
  rotulo,
  n,
  aceso,
  aberto,
  onToggle,
}: {
  pos: Pos;
  rotulo: string;
  n: number;
  aceso: boolean;
  aberto: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="animate-board-node absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={noEstilo(pos)}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberto}
        title={aberto ? `Recolher ${rotulo}` : `Abrir ${rotulo}`}
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] shadow-sm transition-colors",
          aceso
            ? "border-brand bg-brand-subtle text-brand"
            : "border-border bg-muted text-muted-foreground hover:border-brand hover:text-foreground",
        )}
      >
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 shrink-0 transition-transform duration-150",
            !aberto && "-rotate-90",
          )}
        />
        {rotulo}
        <span className="rounded-full bg-background/70 px-1.5 text-[10px] font-medium tabular-nums">
          {n}
        </span>
      </button>
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
