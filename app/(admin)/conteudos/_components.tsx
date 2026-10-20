"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/form/field";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ImageOff,
  Maximize2,
} from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/components/ui/toast";
import { ShieldBadge } from "@/components/heraldry/shield-badge";
import { STATUS, TIPOS } from "@/lib/validation/conteudos";
import {
  criarConteudo,
  editarConteudo,
  excluirConteudo,
  moverConteudo,
} from "./actions";
import { criarCategoria, excluirCategoria } from "./categorias/actions";
import { LIMITES } from "@/lib/validation/limites";
import { ResumoErros } from "@/components/form/resumo-erros";
import { useFormErros } from "@/lib/forms/use-form-erros";
import { conteudoSchema } from "@/lib/validation/conteudos";
import { Lightbox } from "@/components/lightbox";

export type CategoriaOpt = { id: string; nome: string };
export type ConteudoRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  categoria_id: string | null;
  categoriaNome: string | null;
  tipo: string;
  plataforma: string | null;
  link: string;
  status: string;
  destaque: boolean;
  ordem: number;
  data: string | null;
};

function StatusBadge({ s }: { s: string }) {
  const tinctura =
    s === "publicado" ? "vert" : s === "pendente" ? "tenne" : "argent";
  return (
    <ShieldBadge tinctura={tinctura} escudo>
      {s}
    </ShieldBadge>
  );
}

const ROTULOS_CONTEUDO = {
  titulo: "Título",
  tipo: "Tipo",
  link: "Link",
  plataforma: "Plataforma",
  status: "Status",
  data: "Data",
  descricao: "Descrição",
  categoria_id: "Categoria",
  thumbnail: "Thumbnail",
};

export function ConteudosManager({
  conteudos,
  categorias,
}: {
  conteudos: ConteudoRow[];
  categorias: CategoriaOpt[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<{ open: boolean; item: ConteudoRow | null }>({
    open: false,
    item: null,
  });
  const [del, setDel] = useState<ConteudoRow | null>(null);
  const [ampliado, setAmpliado] = useState<ConteudoRow | null>(null);
  const [filtro, setFiltro] = useState("");
  const [pending, start] = useTransition();


  const visiveis = useMemo(() => {
    const termo = filtro.trim().toLowerCase();
    if (!termo) return conteudos;
    return conteudos.filter((c) =>
      `${c.titulo} ${c.tipo} ${c.categoriaNome ?? ""}`.toLowerCase().includes(termo),
    );
  }, [conteudos, filtro]);

  function mover(id: string, dir: "cima" | "baixo") {
    start(async () => {
      await moverConteudo(id, dir);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar conteúdos…"
          aria-label="Filtrar conteúdos"
          className="sm:max-w-xs"
        />
        <Button onClick={() => setForm({ open: true, item: null })}>
          Novo conteúdo
        </Button>
      </div>

      {visiveis.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {conteudos.length === 0
            ? "Nenhum conteúdo cadastrado."
            : "Nenhum conteúdo com esse termo."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visiveis.map((c, i) => (
            <CardConteudo
              key={c.id}
              c={c}
              pending={pending}
              primeiro={i === 0}
              ultimo={i === visiveis.length - 1}
              onMover={mover}
              onEditar={() => setForm({ open: true, item: c })}
              onExcluir={() => setDel(c)}
              onAmpliar={() => setAmpliado(c)}
            />
          ))}
        </ul>
      )}

      {ampliado?.thumbnail && (
        <Lightbox
          src={ampliado.thumbnail}
          legenda={ampliado.titulo}
          onClose={() => setAmpliado(null)}
        />
      )}

      {form.open && (
        <ConteudoFormModal
          item={form.item}
          categorias={categorias}
          onClose={() => setForm({ open: false, item: null })}
          onSaved={() => {
            setForm({ open: false, item: null });
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!del}
        title="Excluir conteúdo"
        description={del ? `Remover "${del.titulo}"?` : ""}
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            const r = await excluirConteudo(del.id);
            setDel(null);
            if (!r.ok) toast.error(r.error);
            else toast.success("Conteúdo excluído.");
            router.refresh();
          })
        }
      />
    </>
  );
}

/**
 * Conteúdo como card: a thumbnail é o conteúdo em si, então ela manda na
 * composição — ficava do tamanho de um selo na tabela.
 */
function CardConteudo({
  c,
  pending,
  primeiro,
  ultimo,
  onMover,
  onEditar,
  onExcluir,
  onAmpliar,
}: {
  c: ConteudoRow;
  pending: boolean;
  primeiro: boolean;
  ultimo: boolean;
  onMover: (id: string, dir: "cima" | "baixo") => void;
  onEditar: () => void;
  onExcluir: () => void;
  onAmpliar: () => void;
}) {
  return (
    <li className="group flex flex-col">
      <div className="relative">
        <button
          type="button"
          onClick={onEditar}
          aria-label={`Editar ${c.titulo}`}
          className="block w-full overflow-hidden rounded-lg border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {c.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.thumbnail}
              alt=""
              className="aspect-video w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          ) : (
            <span className="flex aspect-video w-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-6" aria-hidden />
            </span>
          )}
        </button>

        {c.thumbnail && (
          <button
            type="button"
            onClick={onAmpliar}
            aria-label={`Ver "${c.titulo}" em tela cheia`}
            title="Ver em tela cheia"
            className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Maximize2 className="size-4" />
          </button>
        )}

        <span className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <StatusBadge s={c.status} />
          {c.destaque && (
            <span
              title="Em destaque"
              className="rounded bg-black/70 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm"
            >
              ★
            </span>
          )}
        </span>
      </div>

      <div className="mt-2 flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          onClick={onEditar}
          className="line-clamp-2 text-left text-sm font-medium leading-snug hover:text-brand"
        >
          {c.titulo}
        </button>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {[c.tipo, c.categoriaNome].filter(Boolean).join(" · ")}
        </p>

        <div className="mt-2 flex items-center gap-1 border-t border-border/70 pt-1.5">
          <button
            type="button"
            aria-label="Subir"
            disabled={pending || primeiro}
            onClick={() => onMover(c.id, "cima")}
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-brand disabled:opacity-30"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Descer"
            disabled={pending || ultimo}
            onClick={() => onMover(c.id, "baixo")}
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-brand disabled:opacity-30"
          >
            <ChevronDown className="size-4" />
          </button>
          <a
            href={c.link}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir link"
            aria-label={`Abrir link de ${c.titulo}`}
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-brand"
          >
            <ExternalLink className="size-4" />
          </a>
          <span className="ml-auto flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEditar}>
              Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={onExcluir}>
              Excluir
            </Button>
          </span>
        </div>
      </div>
    </li>
  );
}

function ConteudoFormModal({
  item,
  categorias,
  onClose,
  onSaved,
}: {
  item: ConteudoRow | null;
  categorias: CategoriaOpt[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [v, setV] = useState({
    titulo: item?.titulo ?? "",
    descricao: item?.descricao ?? "",
    categoria_id: item?.categoria_id ?? "",
    tipo: item?.tipo ?? "video",
    plataforma: item?.plataforma ?? "",
    link: item?.link ?? "",
    status: item?.status ?? "draft",
    data: item?.data ?? "",
  });
  const [thumbnail, setThumbnail] = useState<string | null>(item?.thumbnail ?? null);
  const [destaque, setDestaque] = useState(item?.destaque ?? false);
  const { erros, validar, doServidor } = useFormErros();
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v, val: string) => setV((p) => ({ ...p, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = validar(conteudoSchema, {
      ...v,
      thumbnail,
      categoria_id: v.categoria_id || null,
      destaque,
    });
    if (!input) return;
    start(async () => {
      const r = item
        ? await editarConteudo(item.id, input)
        : await criarConteudo(input);
      if (!r.ok) return doServidor(r.error);
      toast.success(item ? "Conteúdo atualizado." : "Conteúdo criado.");
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
        className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <h2 className="text-lg font-semibold tracking-tight">
          {item ? "Editar conteúdo" : "Novo conteúdo"}
        </h2>
        <ResumoErros erros={erros} rotulos={ROTULOS_CONTEUDO} />
        <Field label="Título" htmlFor="ct-titulo" error={erros.titulo}>
          <Input
            id="ct-titulo"
            maxLength={LIMITES.conteudoTitulo}
            value={v.titulo}
            onChange={(e) => set("titulo", e.target.value)}
            required
          />
        </Field>
        <Field label="Thumbnail">
          <ImageUpload bucket="conteudos" value={thumbnail} onChange={setThumbnail} />
        </Field>
        <Field label="Tipo" htmlFor="ct-tipo" error={erros.tipo}>
          <Select id="ct-tipo" value={v.tipo} onChange={(e) => set("tipo", e.target.value)}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Categoria">
          <CategoriaControl
            categorias={categorias}
            value={v.categoria_id}
            onChange={(id) => set("categoria_id", id)}
          />
        </Field>
        <Field label="Link (externo)" htmlFor="ct-link" error={erros.link}>
          <Input id="ct-link" value={v.link} onChange={(e) => set("link", e.target.value)} placeholder="https://…" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Plataforma" htmlFor="ct-plat" error={erros.plataforma}>
            <Input id="ct-plat" value={v.plataforma} onChange={(e) => set("plataforma", e.target.value)} />
          </Field>
          <Field label="Status" htmlFor="ct-status" error={erros.status}>
            <Select id="ct-status" value={v.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data" htmlFor="ct-data" error={erros.data}>
            <Input id="ct-data" type="date" value={v.data} onChange={(e) => set("data", e.target.value)} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={destaque}
            onChange={(e) => setDestaque(e.target.checked)}
            className="size-4 accent-brand"
          />
          Destaque
        </label>
        <Field label="Descrição" htmlFor="ct-desc" error={erros.descricao}>
          <textarea
            id="ct-desc"
            value={v.descricao}
            onChange={(e) => set("descricao", e.target.value)}
            rows={2}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * Seleção + CRUD de categorias de conteúdo dentro do modal (substitui a página
 * /conteudos/categorias, removida). Criar auto-seleciona; excluir via ConfirmDialog.
 */
function CategoriaControl({
  categorias,
  value,
  onChange,
}: {
  categorias: CategoriaOpt[];
  value: string;
  onChange: (id: string) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [nova, setNova] = useState("");
  const [gerenciar, setGerenciar] = useState(false);
  const [del, setDel] = useState<CategoriaOpt | null>(null);
  const [pending, start] = useTransition();

  function criar() {
    if (!nova.trim()) return;
    start(async () => {
      const r = await criarCategoria({ nome: nova });
      if (!r.ok) return toast.error(r.error);
      setNova("");
      onChange(r.id);
      toast.success("Categoria criada.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        >
          <option value="">Sem categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setGerenciar((g) => !g)}
        >
          {gerenciar ? "Fechar" : "Gerenciar"}
        </Button>
      </div>

      {gerenciar && (
        <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
          <div className="flex gap-2">
            <Input
              value={nova}
              onChange={(e) => setNova(e.target.value)}
              placeholder="Nova categoria"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  criar();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              disabled={pending || !nova.trim()}
              onClick={criar}
            >
              Criar
            </Button>
          </div>
          <ul className="divide-y divide-border text-sm">
            {categorias.length === 0 && (
              <li className="py-1 text-muted-foreground">Nenhuma categoria.</li>
            )}
            {categorias.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-1">
                <span>{c.nome}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDel(c)}
                >
                  Excluir
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={!!del}
        title="Excluir categoria"
        description={
          del ? `Remover "${del.nome}"? Conteúdos ficam sem categoria.` : ""
        }
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            const alvo = del.id;
            const r = await excluirCategoria(alvo);
            setDel(null);
            if (!r.ok) toast.error(r.error);
            else {
              toast.success("Categoria excluída.");
              if (value === alvo) onChange("");
            }
            router.refresh();
          })
        }
      />
    </div>
  );
}
