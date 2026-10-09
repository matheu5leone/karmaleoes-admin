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
  criarColaborador,
  editarColaborador,
  excluirColaborador,
} from "./actions";
import { LIMITES } from "@/lib/validation/limites";
import { ResumoErros } from "@/components/form/resumo-erros";
import { useFormErros } from "@/lib/forms/use-form-erros";
import { colaboradorSchema } from "@/lib/validation/obras";

export type ColaboradorRow = {
  id: string;
  nome: string;
  instagram: string | null;
  linkedin: string | null;
  descricao: string | null;
};

export function ColaboradoresManager({
  colaboradores,
}: {
  colaboradores: ColaboradorRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<{ open: boolean; c: ColaboradorRow | null }>({
    open: false,
    c: null,
  });
  const [del, setDel] = useState<ColaboradorRow | null>(null);
  const [pending, start] = useTransition();

  const columns: Column<ColaboradorRow>[] = [
    { key: "nome", header: "Nome" },
    { key: "instagram", header: "Instagram", render: (c) => c.instagram ?? "—" },
    {
      key: "acoes",
      estatica: true,
      header: "Ações",
      render: (c) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setForm({ open: true, c })}>
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
        <Button onClick={() => setForm({ open: true, c: null })}>
          Novo colaborador
        </Button>
      </div>
      <DataTable
        id="colaboradores"
        columns={columns}
        rows={colaboradores}
        getFilterText={(c) => c.nome}
        filterPlaceholder="Filtrar colaboradores…"
        empty="Nenhum colaborador."
      />
      {form.open && (
        <ColaboradorFormModal
          c={form.c}
          onClose={() => setForm({ open: false, c: null })}
          onSaved={() => {
            setForm({ open: false, c: null });
            router.refresh();
          }}
        />
      )}
      <ConfirmDialog
        open={!!del}
        title="Excluir colaborador"
        description={del ? `Remover "${del.nome}"?` : ""}
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            const r = await excluirColaborador(del.id);
            setDel(null);
            if (!r.ok) toast.error(r.error);
            else toast.success("Colaborador excluído.");
            router.refresh();
          })
        }
      />
    </>
  );
}

function ColaboradorFormModal({
  c,
  onClose,
  onSaved,
}: {
  c: ColaboradorRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [v, setV] = useState({
    nome: c?.nome ?? "",
    instagram: c?.instagram ?? "",
    linkedin: c?.linkedin ?? "",
    descricao: c?.descricao ?? "",
  });
  const { erros, validar, doServidor } = useFormErros();
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v, val: string) => setV((p) => ({ ...p, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const dados = validar(colaboradorSchema, v);
    if (!dados) return;
    start(async () => {
      const r = c ? await editarColaborador(c.id, dados) : await criarColaborador(dados);
      if (!r.ok) return doServidor(r.error);
      toast.success(c ? "Colaborador atualizado." : "Colaborador criado.");
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
        className="w-full max-w-md space-y-3 rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <h2 className="text-lg font-semibold tracking-tight">
          {c ? "Editar colaborador" : "Novo colaborador"}
        </h2>
        <ResumoErros
          erros={erros}
          rotulos={{
            nome: "Nome",
            instagram: "Instagram",
            linkedin: "LinkedIn",
            descricao: "Descrição",
          }}
        />
        <Field label="Nome" htmlFor="co-nome" error={erros.nome}>
          <Input
            id="co-nome"
            maxLength={LIMITES.colaboradorNome}
            value={v.nome}
            onChange={(e) => set("nome", e.target.value)}
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Instagram" htmlFor="co-ig" error={erros.instagram}>
            <Input id="co-ig" value={v.instagram} onChange={(e) => set("instagram", e.target.value)} />
          </Field>
          <Field label="LinkedIn" htmlFor="co-li" error={erros.linkedin}>
            <Input id="co-li" value={v.linkedin} onChange={(e) => set("linkedin", e.target.value)} />
          </Field>
        </div>
        <Field label="Descrição" htmlFor="co-desc" error={erros.descricao}>
          <Input id="co-desc" value={v.descricao} onChange={(e) => set("descricao", e.target.value)} />
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
