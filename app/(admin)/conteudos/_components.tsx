"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/form/field";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/components/ui/toast";
import { STATUS, TIPOS } from "@/lib/validation/conteudos";
import { criarConteudo, editarConteudo, excluirConteudo } from "./actions";

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
  const cls =
    s === "publicado"
      ? "bg-success/10 text-success"
      : s === "pendente"
        ? "bg-warning/10 text-warning"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {s}
    </span>
  );
}

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
  const [pending, start] = useTransition();

  const columns: Column<ConteudoRow>[] = [
    {
      key: "thumbnail",
      header: "",
      className: "w-16",
      render: (c) =>
        c.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.thumbnail}
            alt=""
            className="h-10 w-16 rounded border border-border object-cover"
          />
        ) : null,
    },
    { key: "titulo", header: "Título" },
    { key: "tipo", header: "Tipo" },
    {
      key: "categoriaNome",
      header: "Categoria",
      render: (c) => c.categoriaNome ?? "—",
    },
    { key: "status", header: "Status", render: (c) => <StatusBadge s={c.status} /> },
    { key: "destaque", header: "Destaque", render: (c) => (c.destaque ? "★" : "—") },
    { key: "ordem", header: "Ordem", render: (c) => String(c.ordem) },
    {
      key: "acoes",
      header: "Ações",
      render: (c) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setForm({ open: true, item: c })}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDel(c)}>
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setForm({ open: true, item: null })}>
          Novo conteúdo
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={conteudos}
        getFilterText={(c) => `${c.titulo} ${c.tipo} ${c.categoriaNome ?? ""}`}
        filterPlaceholder="Filtrar conteúdos…"
        empty="Nenhum conteúdo cadastrado."
      />

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
    ordem: String(item?.ordem ?? 0),
    data: item?.data ?? "",
  });
  const [thumbnail, setThumbnail] = useState<string | null>(item?.thumbnail ?? null);
  const [destaque, setDestaque] = useState(item?.destaque ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v, val: string) => setV((p) => ({ ...p, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const input = {
        ...v,
        thumbnail,
        categoria_id: v.categoria_id || null,
        tipo: v.tipo as (typeof TIPOS)[number],
        status: v.status as (typeof STATUS)[number],
        destaque,
        ordem: Number(v.ordem) || 0,
      };
      const r = item
        ? await editarConteudo(item.id, input)
        : await criarConteudo(input);
      if (!r.ok) return setError(r.error);
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
        <Field label="Título" htmlFor="ct-titulo">
          <Input id="ct-titulo" value={v.titulo} onChange={(e) => set("titulo", e.target.value)} required />
        </Field>
        <Field label="Thumbnail">
          <ImageUpload bucket="conteudos" value={thumbnail} onChange={setThumbnail} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo" htmlFor="ct-tipo">
            <Select id="ct-tipo" value={v.tipo} onChange={(e) => set("tipo", e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Categoria" htmlFor="ct-cat">
            <Select id="ct-cat" value={v.categoria_id} onChange={(e) => set("categoria_id", e.target.value)}>
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Link (externo)" htmlFor="ct-link">
          <Input id="ct-link" value={v.link} onChange={(e) => set("link", e.target.value)} placeholder="https://…" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Plataforma" htmlFor="ct-plat">
            <Input id="ct-plat" value={v.plataforma} onChange={(e) => set("plataforma", e.target.value)} />
          </Field>
          <Field label="Status" htmlFor="ct-status">
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
          <Field label="Ordem" htmlFor="ct-ordem">
            <Input id="ct-ordem" type="number" min={0} value={v.ordem} onChange={(e) => set("ordem", e.target.value)} />
          </Field>
          <Field label="Data" htmlFor="ct-data">
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
        <Field label="Descrição" htmlFor="ct-desc">
          <textarea
            id="ct-desc"
            value={v.descricao}
            onChange={(e) => set("descricao", e.target.value)}
            rows={2}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
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
