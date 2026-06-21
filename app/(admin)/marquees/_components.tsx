"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/field";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { criarMarquee, excluirMarquee } from "./actions";

export type MarqueeRow = {
  id: string;
  nome: string;
  telas: number;
  itens: number;
};

export function MarqueesManager({ marquees }: { marquees: MarqueeRow[] }) {
  const router = useRouter();
  const [novo, setNovo] = useState(false);
  const [del, setDel] = useState<MarqueeRow | null>(null);
  const [pending, start] = useTransition();

  const columns: Column<MarqueeRow>[] = [
    { key: "nome", header: "Nome" },
    { key: "telas", header: "Telas", render: (m) => String(m.telas) },
    { key: "itens", header: "Itens", render: (m) => String(m.itens) },
    {
      key: "acoes",
      header: "Ações",
      render: (m) => (
        <div className="flex gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/marquees/${m.id}`}>Gerenciar</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDel(m)}>
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setNovo(true)}>Novo marquee</Button>
      </div>

      <DataTable
        columns={columns}
        rows={marquees}
        getFilterText={(m) => m.nome}
        filterPlaceholder="Filtrar marquees…"
        empty="Nenhum marquee cadastrado."
      />

      {novo && (
        <NovoMarqueeModal
          onClose={() => setNovo(false)}
          onCreated={(id) => router.push(`/marquees/${id}`)}
        />
      )}

      <ConfirmDialog
        open={!!del}
        title="Excluir marquee"
        description={del ? `Remover "${del.nome}" e seus itens?` : ""}
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            const r = await excluirMarquee(del.id);
            setDel(null);
            if (!r.ok) alert(r.error);
            router.refresh();
          })
        }
      />
    </>
  );
}

function NovoMarqueeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [nome, setNome] = useState("");
  const [cf, setCf] = useState("");
  const [ct, setCt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await criarMarquee({ nome, cor_fundo: cf, cor_texto: ct });
      if (!r.ok) return setError(r.error);
      onCreated(r.id);
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
        <h2 className="text-lg font-semibold tracking-tight">Novo marquee</h2>
        <Field label="Nome" htmlFor="m-nome">
          <Input
            id="m-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cor de fundo" htmlFor="m-cf">
            <Input
              id="m-cf"
              value={cf}
              onChange={(e) => setCf(e.target.value)}
              placeholder="#F3F4F6"
            />
          </Field>
          <Field label="Cor do texto" htmlFor="m-ct" error={error}>
            <Input
              id="m-ct"
              value={ct}
              onChange={(e) => setCt(e.target.value)}
              placeholder="#18191F"
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Criando…" : "Criar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
