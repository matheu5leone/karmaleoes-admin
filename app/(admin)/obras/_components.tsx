"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/form/field";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/components/ui/toast";
import {
  criarColecao,
  criarMusica,
  editarColecao,
  editarMusica,
  excluirColecao,
  excluirMusica,
} from "./actions";

export type ColecaoOpt = { id: string; nome: string };
export type MusicaRow = {
  id: string;
  nome: string;
  data_lancamento: string | null;
  duracao: string | null;
  isrc: string | null;
  cover_image: string | null;
  colecao_id: string | null;
  colecaoNome: string | null;
};
export type ColecaoRow = {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: string;
  cover_image: string | null;
  data_lancamento: string | null;
};

export function ObrasManager({
  musicas,
  colecoes,
  colecaoOpts,
}: {
  musicas: MusicaRow[];
  colecoes: ColecaoRow[];
  colecaoOpts: ColecaoOpt[];
}) {
  return (
    <div className="space-y-10">
      <MusicasSection musicas={musicas} colecaoOpts={colecaoOpts} />
      <ColecoesSection colecoes={colecoes} />
    </div>
  );
}

function MusicasSection({
  musicas,
  colecaoOpts,
}: {
  musicas: MusicaRow[];
  colecaoOpts: ColecaoOpt[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<{ open: boolean; m: MusicaRow | null }>({
    open: false,
    m: null,
  });
  const [del, setDel] = useState<MusicaRow | null>(null);
  const [pending, start] = useTransition();

  const columns: Column<MusicaRow>[] = [
    { key: "nome", header: "Música" },
    { key: "data_lancamento", header: "Lançamento", render: (m) => m.data_lancamento ?? "—" },
    { key: "colecaoNome", header: "Coleção", render: (m) => m.colecaoNome ?? "—" },
    {
      key: "acoes",
      header: "Ações",
      render: (m) => (
        <div className="flex gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/obras/musica/${m.id}`}>Gerenciar</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setForm({ open: true, m })}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDel(m)}>
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Músicas</h2>
        <Button onClick={() => setForm({ open: true, m: null })}>Nova música</Button>
      </div>
      <DataTable
        columns={columns}
        rows={musicas}
        getFilterText={(m) => `${m.nome} ${m.colecaoNome ?? ""}`}
        filterPlaceholder="Filtrar músicas…"
        empty="Nenhuma música."
      />
      {form.open && (
        <MusicaFormModal
          m={form.m}
          colecaoOpts={colecaoOpts}
          onClose={() => setForm({ open: false, m: null })}
          onSaved={() => {
            setForm({ open: false, m: null });
            router.refresh();
          }}
        />
      )}
      <ConfirmDialog
        open={!!del}
        title="Excluir música"
        description={del ? `Remover "${del.nome}"?` : ""}
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            const r = await excluirMusica(del.id);
            setDel(null);
            if (!r.ok) toast.error(r.error);
            else toast.success("Música excluída.");
            router.refresh();
          })
        }
      />
    </section>
  );
}

function ColecoesSection({ colecoes }: { colecoes: ColecaoRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<{ open: boolean; c: ColecaoRow | null }>({
    open: false,
    c: null,
  });
  const [del, setDel] = useState<ColecaoRow | null>(null);
  const [pending, start] = useTransition();

  const columns: Column<ColecaoRow>[] = [
    { key: "nome", header: "Coleção" },
    { key: "tipo", header: "Tipo" },
    { key: "data_lancamento", header: "Lançamento", render: (c) => c.data_lancamento ?? "—" },
    {
      key: "acoes",
      header: "Ações",
      render: (c) => (
        <div className="flex gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/obras/colecao/${c.id}`}>Gerenciar</Link>
          </Button>
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
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Coleções</h2>
        <Button onClick={() => setForm({ open: true, c: null })}>Nova coleção</Button>
      </div>
      <DataTable
        columns={columns}
        rows={colecoes}
        getFilterText={(c) => `${c.nome} ${c.tipo}`}
        filterPlaceholder="Filtrar coleções…"
        empty="Nenhuma coleção."
      />
      {form.open && (
        <ColecaoFormModal
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
        title="Excluir coleção"
        description={del ? `Remover "${del.nome}"? Músicas ficam sem coleção.` : ""}
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            const r = await excluirColecao(del.id);
            setDel(null);
            if (!r.ok) toast.error(r.error);
            else toast.success("Coleção excluída.");
            router.refresh();
          })
        }
      />
    </section>
  );
}

function MusicaFormModal({
  m,
  colecaoOpts,
  onClose,
  onSaved,
}: {
  m: MusicaRow | null;
  colecaoOpts: ColecaoOpt[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [v, setV] = useState({
    nome: m?.nome ?? "",
    data_lancamento: m?.data_lancamento ?? "",
    duracao: m?.duracao ?? "",
    isrc: m?.isrc ?? "",
    colecao_id: m?.colecao_id ?? "",
  });
  const [cover, setCover] = useState<string | null>(m?.cover_image ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v, val: string) => setV((p) => ({ ...p, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const input = { ...v, cover_image: cover, colecao_id: v.colecao_id || null };
      const r = m ? await editarMusica(m.id, input) : await criarMusica(input);
      if (!r.ok) return setError(r.error);
      toast.success(m ? "Música atualizada." : "Música criada.");
      onSaved();
    });
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          {m ? "Editar música" : "Nova música"}
        </h2>
        <Field label="Nome" htmlFor="mu-nome">
          <Input id="mu-nome" value={v.nome} onChange={(e) => set("nome", e.target.value)} required />
        </Field>
        <Field label="Capa">
          <ImageUpload bucket="obras" value={cover} onChange={setCover} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Lançamento" htmlFor="mu-data">
            <Input id="mu-data" type="date" value={v.data_lancamento} onChange={(e) => set("data_lancamento", e.target.value)} />
          </Field>
          <Field label="Duração" htmlFor="mu-dur">
            <Input id="mu-dur" value={v.duracao} onChange={(e) => set("duracao", e.target.value)} placeholder="3:45" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ISRC" htmlFor="mu-isrc">
            <Input id="mu-isrc" value={v.isrc} onChange={(e) => set("isrc", e.target.value)} />
          </Field>
          <Field label="Coleção" htmlFor="mu-col">
            <Select id="mu-col" value={v.colecao_id} onChange={(e) => set("colecao_id", e.target.value)}>
              <option value="">Sem coleção</option>
              {colecaoOpts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <FormFooter pending={pending} onClose={onClose} />
      </form>
    </Modal>
  );
}

function ColecaoFormModal({
  c,
  onClose,
  onSaved,
}: {
  c: ColecaoRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [v, setV] = useState({
    nome: c?.nome ?? "",
    descricao: c?.descricao ?? "",
    tipo: c?.tipo ?? "album",
    data_lancamento: c?.data_lancamento ?? "",
  });
  const [cover, setCover] = useState<string | null>(c?.cover_image ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v, val: string) => setV((p) => ({ ...p, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const input = {
        ...v,
        tipo: v.tipo as "album" | "EP",
        cover_image: cover,
      };
      const r = c ? await editarColecao(c.id, input) : await criarColecao(input);
      if (!r.ok) return setError(r.error);
      toast.success(c ? "Coleção atualizada." : "Coleção criada.");
      onSaved();
    });
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          {c ? "Editar coleção" : "Nova coleção"}
        </h2>
        <Field label="Nome" htmlFor="cl-nome">
          <Input id="cl-nome" value={v.nome} onChange={(e) => set("nome", e.target.value)} required />
        </Field>
        <Field label="Capa">
          <ImageUpload bucket="obras" value={cover} onChange={setCover} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo" htmlFor="cl-tipo">
            <Select id="cl-tipo" value={v.tipo} onChange={(e) => set("tipo", e.target.value)}>
              <option value="album">album</option>
              <option value="EP">EP</option>
            </Select>
          </Field>
          <Field label="Lançamento" htmlFor="cl-data">
            <Input id="cl-data" type="date" value={v.data_lancamento} onChange={(e) => set("data_lancamento", e.target.value)} />
          </Field>
        </div>
        <Field label="Descrição" htmlFor="cl-desc" error={error}>
          <Input id="cl-desc" value={v.descricao} onChange={(e) => set("descricao", e.target.value)} />
        </Field>
        <FormFooter pending={pending} onClose={onClose} />
      </form>
    </Modal>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
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
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        {children}
      </div>
    </div>
  );
}

function FormFooter({
  pending,
  onClose,
}: {
  pending: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
        Cancelar
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar"}
      </Button>
    </div>
  );
}
