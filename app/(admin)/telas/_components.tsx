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
  desvincularTudo,
  editarTela,
  excluirTela,
  type ItemPendente,
} from "./actions";

export type Tela = {
  id: string;
  nome: string;
  rota: string;
  status: string;
  /** Quantos vínculos a tela tem hoje (alimenta o botão Desvincular). */
  vinculos: { banners: number; marquees: number; itens: number };
};

/** "2 banner(s) e 1 marquee(s)" — só o que de fato existe. */
function resumoVinculos(t: Tela): string {
  const partes: string[] = [];
  if (t.vinculos.banners) partes.push(`${t.vinculos.banners} banner(s)`);
  if (t.vinculos.marquees) partes.push(`${t.vinculos.marquees} marquee(s)`);
  return partes.join(" e ") || "nenhum vínculo";
}

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
  const [desvincular, setDesvincular] = useState<Tela | null>(null);
  // Itens de marquee que continuam apontando para a tela após desvincular.
  const [pendentes, setPendentes] = useState<ItemPendente[] | null>(null);
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
          {t.vinculos.banners + t.vinculos.marquees > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDesvincular(t)}
            >
              Desvincular
            </Button>
          )}
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
        open={!!desvincular}
        title="Desvincular tudo desta tela?"
        description={
          desvincular
            ? `Remove ${resumoVinculos(desvincular)} de "${desvincular.nome}". Os banners e marquees continuam cadastrados — some apenas a ligação com esta tela.`
            : ""
        }
        confirmLabel="Desvincular"
        pending={pending}
        onCancel={() => setDesvincular(null)}
        onConfirm={() =>
          start(async () => {
            if (!desvincular) return;
            const alvo = desvincular;
            const r = await desvincularTudo(alvo.id);
            setDesvincular(null);
            if (!r.ok) {
              toast.error(r.error);
            } else {
              toast.success(
                `Desvinculado de "${alvo.nome}": ${r.banners} banner(s) e ${r.marquees} marquee(s).`,
              );
              if (r.pendentes.length) setPendentes(r.pendentes);
            }
            router.refresh();
          })
        }
      />

      {pendentes && (
        <PendentesModal
          itens={pendentes}
          onClose={() => setPendentes(null)}
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

/**
 * Itens de marquee com navegação interna continuam apontando para a tela: o
 * banco não deixa ficarem sem destino, então só o próprio item pode resolver.
 */
function PendentesModal({
  itens,
  onClose,
}: {
  itens: ItemPendente[];
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold tracking-tight">
          Ainda há itens apontando para esta tela
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Estes itens de marquee têm navegação interna para ela e não podem
          ficar sem destino. Edite cada um (mude a tela ou troque para link
          externo) antes de excluir a tela:
        </p>
        <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto text-sm">
          {itens.map((i, idx) => (
            <li key={`${i.marquee}-${i.titulo}-${idx}`} className="flex gap-2">
              <span aria-hidden className="text-muted-foreground">
                •
              </span>
              <span>
                <strong className="font-medium">{i.titulo}</strong>{" "}
                <span className="text-muted-foreground">em {i.marquee}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Entendi</Button>
        </div>
      </div>
    </div>
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
