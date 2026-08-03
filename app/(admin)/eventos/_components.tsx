"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/form/field";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { EventosKanban } from "@/components/eventos/eventos-kanban";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  editarEvento,
  encerrarEvento,
  excluirEvento,
  criarEvento,
  setEnable,
} from "./actions";

export type StatusOpt = { id: string; nome: string; lifecycle: string };
export type CategoriaOpt = { id: string; name: string };
export type EventoRow = {
  id: string;
  nome: string;
  data: string;
  horario: string | null;
  local: string | null;
  organizador: string | null;
  category_id: string | null;
  category_name: string | null;
  descricao: string | null;
  link_externo: string | null;
  lifecycle: string;
  status_id: string;
  status_efetivo: string;
  enable: boolean;
  enable_efetivo: boolean;
  prioridade: number;
  nova_data: string | null;
};

function StatusBadge({ s }: { s: string }) {
  const cls =
    s === "Expirado"
      ? "bg-muted text-muted-foreground line-through"
      : s === "Cancelado"
        ? "bg-destructive/10 text-destructive"
        : s === "Sucesso" || s === "Ingressos a venda"
          ? "bg-success/10 text-success"
          : "bg-muted text-foreground";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {s}
    </span>
  );
}

export function EventosManager({
  eventos,
  statuses,
  categorias,
}: {
  eventos: EventoRow[];
  statuses: StatusOpt[];
  categorias: CategoriaOpt[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<{ open: boolean; evento: EventoRow | null }>({
    open: false,
    evento: null,
  });
  const [encerrar, setEncerrar] = useState<EventoRow | null>(null);
  const [del, setDel] = useState<EventoRow | null>(null);
  const [vista, setVista] = useState<"tabela" | "kanban">("tabela");
  const [pending, start] = useTransition();

  const abertos = statuses.filter((s) => s.lifecycle === "Em aberto");
  const encerrados = statuses.filter((s) => s.lifecycle === "Encerrado");

  const columns: Column<EventoRow>[] = [
    { key: "nome", header: "Nome" },
    { key: "data", header: "Data" },
    {
      key: "lifecycle",
      header: "Lifecycle",
      render: (e) => (
        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {e.lifecycle}
        </span>
      ),
    },
    {
      key: "status_efetivo",
      header: "Status",
      render: (e) => <StatusBadge s={e.status_efetivo} />,
    },
    {
      key: "enable_efetivo",
      header: "Hub",
      render: (e) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span
            className={`inline-block size-2 rounded-full ${
              e.enable_efetivo ? "bg-success" : "bg-muted-foreground/40"
            }`}
          />
          {e.enable_efetivo ? "visível" : "oculto"}
        </span>
      ),
    },
    { key: "prioridade", header: "Prio.", render: (e) => String(e.prioridade) },
    {
      key: "acoes",
      header: "Ações",
      render: (e) => (
        <div className="flex flex-wrap gap-1">
          <Button variant="ghost" size="sm" onClick={() => setForm({ open: true, evento: e })}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await setEnable(e.id, !e.enable);
                if (!r.ok) toast.error(r.error);
                router.refresh();
              })
            }
          >
            {e.enable ? "Ocultar" : "Mostrar"}
          </Button>
          {e.lifecycle === "Em aberto" && (
            <Button variant="ghost" size="sm" onClick={() => setEncerrar(e)}>
              Encerrar
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setDel(e)}>
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Modo de visualização"
          className="flex rounded-md border border-border p-0.5"
        >
          {(["tabela", "kanban"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVista(v)}
              aria-pressed={vista === v}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium capitalize transition-colors",
                vista === v
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <Button onClick={() => setForm({ open: true, evento: null })}>
          Novo evento
        </Button>
      </div>

      {vista === "tabela" ? (
        <DataTable
          columns={columns}
          rows={eventos}
          getFilterText={(e) => `${e.nome} ${e.status_efetivo}`}
          filterPlaceholder="Filtrar eventos…"
          empty="Nenhum evento cadastrado."
        />
      ) : (
        <EventosKanban
          eventos={eventos}
          onEditar={(e) => setForm({ open: true, evento: e })}
          onEncerrar={(e) => setEncerrar(e)}
          onBloqueado={() =>
            toast.error("Não é possível reabrir um evento encerrado.")
          }
        />
      )}

      {form.open && (
        <EventoFormModal
          evento={form.evento}
          statuses={form.evento ? statuses.filter((s) => s.lifecycle === form.evento!.lifecycle) : abertos}
          categorias={categorias}
          onClose={() => setForm({ open: false, evento: null })}
          onSaved={() => {
            setForm({ open: false, evento: null });
            router.refresh();
          }}
        />
      )}

      {encerrar && (
        <EncerrarModal
          evento={encerrar}
          statuses={encerrados}
          onClose={() => setEncerrar(null)}
          onSaved={() => {
            setEncerrar(null);
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!del}
        title="Excluir evento"
        description={del ? `Remover "${del.nome}"?` : ""}
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            const r = await excluirEvento(del.id);
            setDel(null);
            if (!r.ok) toast.error(r.error);
            else toast.success("Evento excluído.");
            router.refresh();
          })
        }
      />
    </>
  );
}

function EventoFormModal({
  evento,
  statuses,
  categorias,
  onClose,
  onSaved,
}: {
  evento: EventoRow | null;
  statuses: StatusOpt[];
  categorias: CategoriaOpt[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [v, setV] = useState({
    nome: evento?.nome ?? "",
    descricao: evento?.descricao ?? "",
    category_id: evento?.category_id ?? "",
    data: evento?.data ?? "",
    horario: evento?.horario?.slice(0, 5) ?? "",
    local: evento?.local ?? "",
    organizador: evento?.organizador ?? "",
    link_externo: evento?.link_externo ?? "",
    status_id: evento?.status_id ?? statuses[0]?.id ?? "",
    prioridade: String(evento?.prioridade ?? 0),
    nova_data: evento?.nova_data ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v, val: string) => setV((p) => ({ ...p, [k]: val }));
  const statusNome = statuses.find((s) => s.id === v.status_id)?.nome;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const input = { ...v, prioridade: Number(v.prioridade) || 0 };
      const r = evento
        ? await editarEvento(evento.id, input)
        : await criarEvento(input);
      if (!r.ok) return setError(r.error);
      toast.success(evento ? "Evento atualizado." : "Evento criado.");
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
          {evento ? "Editar evento" : "Novo evento"}
        </h2>
        <Field label="Nome" htmlFor="ev-nome">
          <Input id="ev-nome" value={v.nome} onChange={(e) => set("nome", e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data" htmlFor="ev-data">
            <Input id="ev-data" type="date" value={v.data} onChange={(e) => set("data", e.target.value)} required />
          </Field>
          <Field label="Horário" htmlFor="ev-hora">
            <Input id="ev-hora" type="time" value={v.horario} onChange={(e) => set("horario", e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status" htmlFor="ev-status">
            <Select id="ev-status" value={v.status_id} onChange={(e) => set("status_id", e.target.value)} required>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prioridade" htmlFor="ev-prio">
            <Input id="ev-prio" type="number" min={0} value={v.prioridade} onChange={(e) => set("prioridade", e.target.value)} />
          </Field>
        </div>
        {statusNome === "Adiado" && (
          <Field label="Nova data (obrigatória p/ Adiado)" htmlFor="ev-nova">
            <Input id="ev-nova" type="date" value={v.nova_data} onChange={(e) => set("nova_data", e.target.value)} />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria" htmlFor="ev-cat">
            <Select id="ev-cat" value={v.category_id} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Local" htmlFor="ev-local">
            <Input id="ev-local" value={v.local} onChange={(e) => set("local", e.target.value)} />
          </Field>
        </div>
        <Field label="Organizador" htmlFor="ev-org">
          <Input id="ev-org" value={v.organizador} onChange={(e) => set("organizador", e.target.value)} />
        </Field>
        <Field label="Link de compra (externo)" htmlFor="ev-link">
          <Input id="ev-link" value={v.link_externo} onChange={(e) => set("link_externo", e.target.value)} placeholder="https://…" />
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

function EncerrarModal({
  evento,
  statuses,
  onClose,
  onSaved,
}: {
  evento: EventoRow;
  statuses: StatusOpt[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [statusId, setStatusId] = useState(statuses[0]?.id ?? "");
  const [obs, setObs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await encerrarEvento(evento.id, {
        status_id: statusId,
        obs_encerramento: obs,
      });
      if (!r.ok) return setError(r.error);
      toast.success("Evento encerrado.");
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
        <h2 className="text-lg font-semibold tracking-tight">Encerrar evento</h2>
        <p className="text-sm text-muted-foreground">
          &quot;{evento.nome}&quot; — Sucesso só na data de referência ou depois.
        </p>
        <Field label="Status de encerramento" htmlFor="enc-status">
          <Select id="enc-status" value={statusId} onChange={(e) => setStatusId(e.target.value)} required>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Observação (obrigatória)" htmlFor="enc-obs" error={error}>
          <textarea
            id="enc-obs"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            required
            rows={3}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Encerrando…" : "Encerrar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
