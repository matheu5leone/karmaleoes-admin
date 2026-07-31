"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/field";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { useToast } from "@/components/ui/toast";
import {
  criarCategoriaEvento,
  editarCategoriaEvento,
  excluirCategoriaEvento,
} from "./actions";

export type CategoriaEventoRow = {
  id: string;
  name: string;
  lifecycle: string | null;
};

export function CategoriasEventoManager({
  categorias,
}: {
  categorias: CategoriaEventoRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<{
    open: boolean;
    cat: CategoriaEventoRow | null;
  }>({ open: false, cat: null });
  const [del, setDel] = useState<CategoriaEventoRow | null>(null);
  const [pending, start] = useTransition();

  const columns: Column<CategoriaEventoRow>[] = [
    { key: "name", header: "Nome" },
    {
      key: "acoes",
      header: "Ações",
      render: (c) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setForm({ open: true, cat: c })}
          >
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
        <Button onClick={() => setForm({ open: true, cat: null })}>
          Nova categoria
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={categorias}
        getFilterText={(c) => c.name}
        filterPlaceholder="Filtrar categorias…"
        empty="Nenhuma categoria."
      />

      {form.open && (
        <CategoriaFormModal
          cat={form.cat}
          onClose={() => setForm({ open: false, cat: null })}
          onSaved={() => {
            setForm({ open: false, cat: null });
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!del}
        title="Excluir categoria"
        description={del ? `Remover "${del.name}"?` : ""}
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            const r = await excluirCategoriaEvento(del.id);
            setDel(null);
            if (!r.ok) toast.error(r.error);
            else toast.success("Categoria excluída.");
            router.refresh();
          })
        }
      />
    </>
  );
}

function CategoriaFormModal({
  cat,
  onClose,
  onSaved,
}: {
  cat: CategoriaEventoRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(cat?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const input = { name, lifecycle: "" };
      const r = cat
        ? await editarCategoriaEvento(cat.id, input)
        : await criarCategoriaEvento(input);
      if (!r.ok) return setError(r.error);
      toast.success(cat ? "Categoria atualizada." : "Categoria criada.");
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
          {cat ? "Editar categoria" : "Nova categoria"}
        </h2>
        <Field label="Nome" htmlFor="c-nome" error={error}>
          <Input
            id="c-nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
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
