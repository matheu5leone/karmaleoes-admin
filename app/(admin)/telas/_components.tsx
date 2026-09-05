"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/field";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { useToast } from "@/components/ui/toast";
import { ShieldBadge } from "@/components/heraldry/shield-badge";
import {
  alternarStatusTela,
  criarTela,
  editarTela,
  excluirTela,
} from "./actions";

export type Tela = { id: string; nome: string; rota: string; status: string };

function StatusBadge({ status }: { status: string }) {
  return (
    <ShieldBadge tinctura={status === "habilitada" ? "vert" : "argent"} escudo>
      {status}
    </ShieldBadge>
  );
}

export function TelasManager({ telas }: { telas: Tela[] }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<{ open: boolean; tela: Tela | null }>({
    open: false,
    tela: null,
  });
  const [del, setDel] = useState<Tela | null>(null);
  const [pending, start] = useTransition();

  const columns: Column<Tela>[] = [
    { key: "nome", header: "Nome" },
    {
      key: "rota",
      header: "Rota",
      render: (t) => <span className="font-mono text-xs">{t.rota}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: "acoes",
      header: "Ações",
      render: (t) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setForm({ open: true, tela: t })}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await alternarStatusTela(t.id, t.status !== "habilitada");
                router.refresh();
              })
            }
          >
            {t.status === "habilitada" ? "Desabilitar" : "Habilitar"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDel(t)}>
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={telas}
        getFilterText={(t) => `${t.nome} ${t.rota}`}
        filterPlaceholder="Filtrar telas…"
        empty="Nenhuma tela cadastrada."
        action={
          <Button onClick={() => setForm({ open: true, tela: null })}>
            Nova tela
          </Button>
        }
      />

      {form.open && (
        <TelaFormModal
          tela={form.tela}
          onClose={() => setForm({ open: false, tela: null })}
          onSaved={() => {
            setForm({ open: false, tela: null });
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!del}
        title="Excluir tela"
        description={
          del ? `Remover "${del.nome}"? Esta ação não pode ser desfeita.` : ""
        }
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            const r = await excluirTela(del.id);
            setDel(null);
            if (!r.ok) toast.error(r.error);
            else toast.success("Tela excluída.");
            router.refresh();
          })
        }
      />
    </>
  );
}

function TelaFormModal({
  tela,
  onClose,
  onSaved,
}: {
  tela: Tela | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(tela?.nome ?? "");
  const [rota, setRota] = useState(tela?.rota ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = tela
        ? await editarTela(tela.id, { nome, rota })
        : await criarTela({ nome, rota });
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
          {tela ? "Editar tela" : "Nova tela"}
        </h2>
        <Field label="Nome" htmlFor="t-nome">
          <Input
            id="t-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </Field>
        <Field label="Rota" htmlFor="t-rota" error={error}>
          <Input
            id="t-rota"
            value={rota}
            onChange={(e) => setRota(e.target.value)}
            placeholder="/ex"
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
