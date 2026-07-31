"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/field";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { useToast } from "@/components/ui/toast";
import { criarIcon, editarIcon, excluirIcon } from "./actions";

export type IconRow = { id: string; name: string; extension: string };

/** Caminho do asset do ícone: /icons/<name>.<extension> (arquivos em /public/icons). */
export function iconSrc(icon: { name: string; extension: string }): string {
  return `/icons/${icon.name}.${icon.extension}`;
}

export function IconesManager({ icons }: { icons: IconRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<{ open: boolean; icon: IconRow | null }>({
    open: false,
    icon: null,
  });
  const [del, setDel] = useState<IconRow | null>(null);
  const [pending, start] = useTransition();

  const columns: Column<IconRow>[] = [
    {
      key: "preview",
      header: "",
      render: (i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconSrc(i)}
          alt=""
          className="size-8 rounded border border-border object-contain"
        />
      ),
    },
    { key: "name", header: "Nome" },
    { key: "extension", header: "Ext." },
    {
      key: "acoes",
      header: "Ações",
      render: (i) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setForm({ open: true, icon: i })}
          >
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDel(i)}>
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setForm({ open: true, icon: null })}>
          Novo ícone
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={icons}
        getFilterText={(i) => `${i.name} ${i.extension}`}
        filterPlaceholder="Filtrar ícones…"
        empty="Nenhum ícone."
      />

      {form.open && (
        <IconFormModal
          icon={form.icon}
          onClose={() => setForm({ open: false, icon: null })}
          onSaved={() => {
            setForm({ open: false, icon: null });
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!del}
        title="Excluir ícone"
        description={del ? `Remover "${del.name}"?` : ""}
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            const r = await excluirIcon(del.id);
            setDel(null);
            if (!r.ok) toast.error(r.error);
            else toast.success("Ícone excluído.");
            router.refresh();
          })
        }
      />
    </>
  );
}

function IconFormModal({
  icon,
  onClose,
  onSaved,
}: {
  icon: IconRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(icon?.name ?? "");
  const [extension, setExtension] = useState(icon?.extension ?? "svg");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const input = { name, extension };
      const r = icon ? await editarIcon(icon.id, input) : await criarIcon(input);
      if (!r.ok) return setError(r.error);
      toast.success(icon ? "Ícone atualizado." : "Ícone criado.");
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
          {icon ? "Editar ícone" : "Novo ícone"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome do arquivo" htmlFor="ic-name" error={error}>
            <Input
              id="ic-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="seta"
              required
            />
          </Field>
          <Field label="Extensão" htmlFor="ic-ext">
            <Input
              id="ic-ext"
              value={extension}
              onChange={(e) => setExtension(e.target.value)}
              placeholder="svg"
              required
            />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          Arquivo esperado: <code>/public/icons/{name || "<nome>"}.
          {extension || "<ext>"}</code>
        </p>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={pending}
          >
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
