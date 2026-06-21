"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/field";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { useToast } from "@/components/ui/toast";
import { criarRole, editarRole, excluirRole } from "./actions";

export type RoleRow = { id: string; nome: string };

export function RolesManager({ roles }: { roles: RoleRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<{ open: boolean; r: RoleRow | null }>({
    open: false,
    r: null,
  });
  const [del, setDel] = useState<RoleRow | null>(null);
  const [pending, start] = useTransition();

  const columns: Column<RoleRow>[] = [
    { key: "nome", header: "Nome" },
    {
      key: "acoes",
      header: "Ações",
      render: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setForm({ open: true, r })}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDel(r)}>
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setForm({ open: true, r: null })}>Novo papel</Button>
      </div>
      <DataTable
        columns={columns}
        rows={roles}
        getFilterText={(r) => r.nome}
        filterPlaceholder="Filtrar papéis…"
        empty="Nenhum papel."
      />
      {form.open && (
        <RoleFormModal
          r={form.r}
          onClose={() => setForm({ open: false, r: null })}
          onSaved={() => {
            setForm({ open: false, r: null });
            router.refresh();
          }}
        />
      )}
      <ConfirmDialog
        open={!!del}
        title="Excluir papel"
        description={del ? `Remover "${del.nome}"?` : ""}
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            const r = await excluirRole(del.id);
            setDel(null);
            if (!r.ok) toast.error(r.error);
            else toast.success("Papel excluído.");
            router.refresh();
          })
        }
      />
    </>
  );
}

function RoleFormModal({
  r,
  onClose,
  onSaved,
}: {
  r: RoleRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [nome, setNome] = useState(r?.nome ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = r ? await editarRole(r.id, { nome }) : await criarRole({ nome });
      if (!res.ok) return setError(res.error);
      toast.success(r ? "Papel atualizado." : "Papel criado.");
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
          {r ? "Editar papel" : "Novo papel"}
        </h2>
        <Field label="Nome" htmlFor="ro-nome" error={error}>
          <Input id="ro-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
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
