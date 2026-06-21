"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/field";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/components/ui/toast";
import { criarBanner, editarBanner, excluirBanner } from "./actions";

export type BannerRow = {
  id: string;
  nome: string;
  imagem: string;
  associacoes: number;
  publicadas: number;
};

export function BannersManager({ banners }: { banners: BannerRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<{ open: boolean; banner: BannerRow | null }>({
    open: false,
    banner: null,
  });
  const [del, setDel] = useState<BannerRow | null>(null);
  const [pending, start] = useTransition();

  const columns: Column<BannerRow>[] = [
    {
      key: "imagem",
      header: "",
      className: "w-16",
      render: (b) =>
        b.imagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={b.imagem}
            alt=""
            className="h-10 w-16 rounded border border-border object-cover"
          />
        ) : null,
    },
    { key: "nome", header: "Nome" },
    { key: "associacoes", header: "Telas", render: (b) => String(b.associacoes) },
    {
      key: "publicadas",
      header: "Publicadas",
      render: (b) => String(b.publicadas),
    },
    {
      key: "acoes",
      header: "Ações",
      render: (b) => (
        <div className="flex gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/banners/${b.id}`}>Gerenciar</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setForm({ open: true, banner: b })}
          >
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDel(b)}>
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setForm({ open: true, banner: null })}>
          Novo banner
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={banners}
        getFilterText={(b) => b.nome}
        filterPlaceholder="Filtrar banners…"
        empty="Nenhum banner cadastrado."
      />

      {form.open && (
        <BannerFormModal
          banner={form.banner}
          onClose={() => setForm({ open: false, banner: null })}
          onSaved={(id) => {
            setForm({ open: false, banner: null });
            if (id) router.push(`/banners/${id}`);
            else router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!del}
        title="Excluir banner"
        description={del ? `Remover "${del.nome}" e suas associações?` : ""}
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            const r = await excluirBanner(del.id);
            setDel(null);
            if (!r.ok) toast.error(r.error);
            else toast.success("Banner excluído.");
            router.refresh();
          })
        }
      />
    </>
  );
}

function BannerFormModal({
  banner,
  onClose,
  onSaved,
}: {
  banner: BannerRow | null;
  onClose: () => void;
  onSaved: (id: string | null) => void;
}) {
  const toast = useToast();
  const [nome, setNome] = useState(banner?.nome ?? "");
  const [imagem, setImagem] = useState<string | null>(banner?.imagem ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const input = { nome, imagem: imagem ?? "" };
      const r = banner
        ? await editarBanner(banner.id, input)
        : await criarBanner(input);
      if (!r.ok) return setError(r.error);
      toast.success(banner ? "Banner atualizado." : "Banner criado.");
      onSaved(banner ? null : (r as { ok: true; id: string }).id);
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
          {banner ? "Editar banner" : "Novo banner"}
        </h2>
        <Field label="Nome (interno)" htmlFor="b-nome">
          <Input
            id="b-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </Field>
        <Field label="Imagem" error={error}>
          <ImageUpload bucket="banners" value={imagem} onChange={setImagem} />
        </Field>
        <div className="flex justify-end gap-2">
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
