"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/form/field";
import { ColorPicker } from "@/components/form/color-picker";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { ListaOrdenavel } from "@/components/form/lista-ordenavel";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  associarTelas,
  editarMarquee,
  excluirItem,
  reordenarItens,
  salvarItem,
} from "../actions";

export type EditorTela = { id: string; nome: string; status: string };
export type IconOpt = { id: string; name: string; extension: string };
export type EditorItem = {
  id: string;
  titulo: string;
  icon_id: string | null;
  icon: { name: string; extension: string } | null;
  tipo_nav: string;
  tela_destino_id: string | null;
  url_externa: string | null;
  ordem: number;
};

/** Caminho do asset do ícone: /icons/<name>.<extension> (arquivos em /public/icons). */
function iconSrc(icon: { name: string; extension: string }): string {
  return `/icons/${icon.name}.${icon.extension}`;
}

export function MarqueeEditor({
  marqueeId,
  nomeInicial,
  corFundoInicial,
  corTextoInicial,
  telas,
  telaIdsAssociadas,
  itens,
  icons,
}: {
  marqueeId: string;
  nomeInicial: string;
  corFundoInicial: string;
  corTextoInicial: string;
  telas: EditorTela[];
  telaIdsAssociadas: string[];
  itens: EditorItem[];
  icons: IconOpt[];
}) {
  const router = useRouter();
  // As cores moram aqui para o preview acompanhar a digitação, antes de salvar.
  const [cores, setCores] = useState({
    fundo: corFundoInicial,
    texto: corTextoInicial,
  });
  // Item sendo escrito no modal: entra no preview antes de existir no banco.
  const [rascunho, setRascunho] = useState<EditorItem | null>(null);

  const itensPreview = useMemo(() => {
    if (!rascunho) return itens;
    if (!rascunho.id) return [...itens, rascunho];
    return itens.map((it) => (it.id === rascunho.id ? rascunho : it));
  }, [itens, rascunho]);

  return (
    <>
      <PreviewFixo cores={cores} itens={itensPreview} />
      <div className="mt-6 space-y-10">
        <DadosSection
          marqueeId={marqueeId}
          nomeInicial={nomeInicial}
          cores={cores}
          onCores={setCores}
          onSaved={() => router.refresh()}
        />
        <TelasSection
          marqueeId={marqueeId}
          telas={telas}
          associadas={telaIdsAssociadas}
          onSaved={() => router.refresh()}
        />
        <ItensSection
          marqueeId={marqueeId}
          telas={telas}
          itens={itens}
          icons={icons}
          onRascunho={setRascunho}
        />
      </div>
    </>
  );
}

type Cores = { fundo: string; texto: string };

const CHAVE_FIXO = "karma-marquee-preview-fixo";

/**
 * Preview do marquee. Por padrão ele gruda no topo quando a página rola, como
 * uma navbar; o pin desliga essa fixação para quem preferir que ele suba junto
 * com o resto. A escolha fica guardada entre visitas.
 */
function PreviewFixo({ cores, itens }: { cores: Cores; itens: EditorItem[] }) {
  const [fixo, setFixo] = useState(true);
  const [preso, setPreso] = useState(false);
  const sentinela = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_FIXO);
      if (salvo !== null) setFixo(salvo === "1");
    } catch {
      /* sem storage: segue fixo, que é o padrão */
    }
  }, []);

  // Sentinela logo acima: quando ela sai da tela, o preview está grudado.
  useEffect(() => {
    if (!fixo) return setPreso(false);
    const el = sentinela.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setPreso(!e.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, [fixo]);

  function alternar() {
    setFixo((v) => {
      try {
        localStorage.setItem(CHAVE_FIXO, v ? "0" : "1");
      } catch {
        /* ignora */
      }
      return !v;
    });
  }

  return (
    <>
      <div ref={sentinela} aria-hidden className="h-px" />
      <div
        className={cn(
          "z-20 -mx-4 px-4 pt-4 sm:-mx-6 sm:px-6",
          fixo && "sticky top-14 md:top-0",
          preso && "border-b border-border bg-background/95 pb-3 backdrop-blur-sm",
        )}
      >
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
            Preview
          </p>
          <button
            type="button"
            onClick={alternar}
            aria-pressed={fixo}
            title={fixo ? "Soltar o preview do topo" : "Fixar o preview no topo"}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
              fixo
                ? "border-brand bg-brand-subtle text-brand"
                : "border-border text-muted-foreground hover:border-brand hover:text-foreground",
            )}
          >
            {fixo ? <Pin className="size-3.5" /> : <PinOff className="size-3.5" />}
            {fixo ? "Fixado" : "Fixar"}
          </button>
        </div>
        <MarqueePreview cores={cores} itens={itens} />
      </div>
    </>
  );
}

/** A fita em si: itens em sequência, deslizando como no site. */
function MarqueePreview({ cores, itens }: { cores: Cores; itens: EditorItem[] }) {
  const fundo = cores.fundo || "#17130d";
  const texto = cores.texto || "#f2e9d8";

  return (
    <div
      className="overflow-hidden rounded-md border border-border"
      style={{ backgroundColor: fundo }}
    >
      {itens.length === 0 ? (
        <p className="px-4 py-3 text-center text-sm opacity-70" style={{ color: texto }}>
          Nenhum item ainda.
        </p>
      ) : (
        <div className="marquee-fita flex w-max">
          {/* A fita é duplicada: a animação anda metade dela e volta ao início
              sem emenda visível. A cópia é escondida dos leitores de tela. */}
          {[0, 1].map((copia) => (
            <ul
              key={copia}
              aria-hidden={copia === 1 ? true : undefined}
              className="flex shrink-0 items-center gap-10 px-5 py-2.5"
            >
              {itens.map((it, i) => (
                <li
                  key={`${copia}-${it.id || "novo"}-${i}`}
                  className="flex items-center gap-2 whitespace-nowrap"
                  style={{ color: texto }}
                >
                  {it.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={iconSrc(it.icon)} alt="" className="size-5 object-contain" />
                  )}
                  <span className="text-sm font-medium">
                    {it.titulo || "Sem texto"}
                  </span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      )}
    </div>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold tracking-tight">{titulo}</h2>
      {children}
    </section>
  );
}

function DadosSection({
  marqueeId,
  nomeInicial,
  cores,
  onCores,
  onSaved,
}: {
  marqueeId: string;
  nomeInicial: string;
  cores: Cores;
  onCores: (c: Cores) => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const { fundo: cf, texto: ct } = cores;
  const setCf = (v: string) => onCores({ ...cores, fundo: v });
  const setCt = (v: string) => onCores({ ...cores, texto: v });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    start(async () => {
      const r = await editarMarquee(marqueeId, {
        nome,
        cor_fundo: cf,
        cor_texto: ct,
      });
      if (!r.ok) return setError(r.error);
      setOk(true);
      onSaved();
    });
  }

  return (
    <Secao titulo="Dados">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nome" htmlFor="e-nome">
          <Input id="e-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </Field>
        <Field label="Cor de fundo" htmlFor="e-cf">
          <ColorPicker id="e-cf" value={cf} onChange={setCf} />
        </Field>
        <Field label="Cor do texto" htmlFor="e-ct">
          <ColorPicker id="e-ct" value={ct} onChange={setCt} />
        </Field>
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar dados"}
          </Button>
          {error && <span className="ml-3 text-sm text-destructive">{error}</span>}
          {ok && <span className="ml-3 text-sm text-success">Salvo.</span>}
        </div>
      </form>
    </Secao>
  );
}

function TelasSection({
  marqueeId,
  telas,
  associadas,
  onSaved,
}: {
  marqueeId: string;
  telas: EditorTela[];
  associadas: string[];
  onSaved: () => void;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set(associadas));
  const [pending, start] = useTransition();
  const [ok, setOk] = useState(false);

  function toggle(id: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Secao titulo="Telas associadas">
      {telas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Cadastre telas primeiro.</p>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
          {telas.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-2 rounded-sm border border-border px-2.5 py-2 text-sm transition-colors hover:border-brand"
            >
              <input
                type="checkbox"
                checked={sel.has(t.id)}
                onChange={() => toggle(t.id)}
                className="size-4 accent-brand"
              />
              {t.nome}
              <span className="font-mono text-xs text-muted-foreground">
                {t.status === "habilitada" ? "" : "(desabilitada)"}
              </span>
            </label>
          ))}
          </div>
          <Button
            className="mt-2"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setOk(false);
                await associarTelas(marqueeId, [...sel]);
                setOk(true);
                onSaved();
              })
            }
          >
            {pending ? "Salvando…" : "Salvar telas"}
          </Button>
          {ok && <span className="ml-3 text-sm text-success">Associações salvas.</span>}
        </div>
      )}
    </Secao>
  );
}

function ItensSection({
  marqueeId,
  telas,
  itens,
  icons,
  onRascunho,
}: {
  marqueeId: string;
  telas: EditorTela[];
  itens: EditorItem[];
  icons: IconOpt[];
  onRascunho: (i: EditorItem | null) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [modal, setModal] = useState<{ open: boolean; item: EditorItem | null }>({
    open: false,
    item: null,
  });
  const [del, setDel] = useState<EditorItem | null>(null);
  const [pending, start] = useTransition();

  return (
    <Secao titulo="Itens">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setModal({ open: true, item: null })}>
          Adicionar item
        </Button>
      </div>

      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item ainda.</p>
      ) : (
        <ListaOrdenavel
          itens={itens}
          onReordenar={(ids) =>
            start(async () => {
              const r = await reordenarItens(marqueeId, ids);
              if (!r.ok) toast.error(r.error);
              router.refresh();
            })
          }
        >
          {(it) => (
            <div className="flex items-center gap-3">
              {it.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={iconSrc(it.icon)}
                  alt=""
                  className="size-10 rounded-md border border-border object-contain"
                />
              ) : (
                <div className="size-10 rounded-md border border-dashed border-border" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{it.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {it.tipo_nav === "interno"
                    ? `interno → ${telas.find((t) => t.id === it.tela_destino_id)?.nome ?? "—"}`
                    : `externo → ${it.url_externa}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModal({ open: true, item: it })}
              >
                Editar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDel(it)}>
                Remover
              </Button>
            </div>
          )}
        </ListaOrdenavel>
      )}

      {modal.open && (
        <ItemModal
          marqueeId={marqueeId}
          telas={telas}
          icons={icons}
          item={modal.item}
          onRascunho={onRascunho}
          onClose={() => {
            onRascunho(null);
            setModal({ open: false, item: null });
          }}
          onSaved={() => {
            onRascunho(null);
            setModal({ open: false, item: null });
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!del}
        title="Remover item"
        description={del ? `Remover "${del.titulo}"?` : ""}
        confirmLabel="Remover"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            await excluirItem(marqueeId, del.id);
            setDel(null);
            router.refresh();
          })
        }
      />
    </Secao>
  );
}

function ItemModal({
  marqueeId,
  telas,
  icons,
  item,
  onClose,
  onRascunho,
  onSaved,
}: {
  marqueeId: string;
  telas: EditorTela[];
  icons: IconOpt[];
  item: EditorItem | null;
  onClose: () => void;
  onRascunho: (i: EditorItem | null) => void;
  onSaved: () => void;
}) {
  const [titulo, setTitulo] = useState(item?.titulo ?? "");
  const [iconId, setIconId] = useState<string>(item?.icon_id ?? "");
  const [tipoNav, setTipoNav] = useState(item?.tipo_nav ?? "interno");
  const [telaId, setTelaId] = useState(item?.tela_destino_id ?? "");
  const [url, setUrl] = useState(item?.url_externa ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const habilitadas = telas.filter((t) => t.status === "habilitada");

  // Enquanto o modal está aberto, o preview mostra o item como ele está ficando.
  useEffect(() => {
    const icon = icons.find((ic) => ic.id === iconId);
    onRascunho({
      id: item?.id ?? "",
      titulo,
      icon_id: iconId || null,
      icon: icon ? { name: icon.name, extension: icon.extension } : null,
      tipo_nav: tipoNav,
      tela_destino_id: telaId || null,
      url_externa: url || null,
      ordem: item?.ordem ?? Number.MAX_SAFE_INTEGER,
    });
  }, [titulo, iconId, tipoNav, telaId, url, icons, item, onRascunho]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await salvarItem(marqueeId, item?.id ?? null, {
        titulo,
        icon_id: iconId || null,
        tipo_nav: tipoNav as "interno" | "externo",
        tela_destino_id: tipoNav === "interno" ? telaId || null : null,
        url_externa: tipoNav === "externo" ? url || null : null,
      });
      if (!r.ok) return setError(r.error);
      onSaved();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <h2 className="text-lg font-semibold tracking-tight">
          {item ? "Editar item" : "Novo item"}
        </h2>
        <Field label="Texto" htmlFor="i-titulo">
          <Input id="i-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </Field>
        <Field label="Ícone" htmlFor="i-icon">
          <Select
            id="i-icon"
            value={iconId}
            onChange={(e) => setIconId(e.target.value)}
          >
            <option value="">Sem ícone</option>
            {icons.map((ic) => (
              <option key={ic.id} value={ic.id}>
                {ic.name}.{ic.extension}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Navegação" htmlFor="i-tipo">
            <Select id="i-tipo" value={tipoNav} onChange={(e) => setTipoNav(e.target.value)}>
              <option value="interno">Interno (tela)</option>
              <option value="externo">Externo (URL)</option>
            </Select>
          </Field>
        </div>
        {tipoNav === "interno" ? (
          <Field label="Tela de destino (habilitada)" htmlFor="i-tela" error={error}>
            <Select id="i-tela" value={telaId} onChange={(e) => setTelaId(e.target.value)}>
              <option value="">Selecione…</option>
              {habilitadas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="URL externa" htmlFor="i-url" error={error}>
            <Input
              id="i-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar item"}
          </Button>
        </div>
      </form>
    </div>
  );
}
