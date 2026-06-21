"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/form/field";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { useToast } from "@/components/ui/toast";
import { criarStatus, editarStatus, excluirStatus } from "./actions";

export type StatusRow = {
  id: string;
  nome: string;
  lifecycle: string;
  protegido: boolean;
};

export function StatusManager({ statuses }: { statuses: StatusRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<{ open: boolean; status: StatusRow | null }>({
    open: false,
    status: null,
  });
  const [del, setDel] = useState<StatusRow | null>(null);
  const [pending, start] = useTransition();

  const columns: Column<StatusRow>[] = [
    { key: "nome", header: "Nome" },
    { key: "lifecycle", header: "Lifecycle" },
    {
      key: "protegido",
      header: "Protegido",
      render: (s) => (s.protegido ? "sim" : "—"),
    },
    {
      key: "acoes",
      header: "Ações",
      render: (s) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={s.protegido}
            onClick={() => setForm({ open: true, status: s })}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={s.protegido}
            onClick={() => setDel(s)}
          >
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setForm({ open: true, status: null })}>
          Novo status
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={statuses}
        getFilterText={(s) => `${s.nome} ${s.lifecycle}`}
        filterPlaceholder="Filtrar status…"
        empty="Nenhum status."
      />

      {form.open && (
        <StatusFormModal
          status={form.status}
          onClose={() => setForm({ open: false, status: null })}
          onSaved={() => {
            setForm({ open: false, status: null });
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!del}
        title="Excluir status"
        description={del ? `Remover "${del.nome}"?` : ""}
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            const r = await excluirStatus(del.id);
            setDel(null);
            if (!r.ok) toast.error(r.error);
            else toast.success("Status excluído.");
            router.refresh();
          })
        }
      />
    </>
  );
}

function StatusFormModal({
  status,
  onClose,
  onSaved,
}: {
  status: StatusRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [nome, setNome] = useState(status?.nome ?? "");
  const [lifecycle, setLifecycle] = useState(status?.lifecycle ?? "Em aberto");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const input = {
        nome,
        lifecycle: lifecycle as "Em aberto" | "Encerrado",
      };
      const r = status
        ? await editarStatus(status.id, input)
        : await criarStatus(input);
      if (!r.ok) return setError(r.error);
      toast.success(status ? "Status atualizado." : "Status criado.");
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
          {status ? "Editar status" : "Novo status"}
        </h2>
        <Field label="Nome" htmlFor="s-nome" error={error}>
          <Input id="s-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </Field>
        <Field label="Lifecycle" htmlFor="s-life">
          <Select
            id="s-life"
            value={lifecycle}
            onChange={(e) => setLifecycle(e.target.value)}
          >
            <option value="Em aberto">Em aberto</option>
            <option value="Encerrado">Encerrado</option>
          </Select>
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
