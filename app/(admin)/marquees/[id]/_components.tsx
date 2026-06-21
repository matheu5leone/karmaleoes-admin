"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/form/field";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { ImageUpload } from "@/components/image-upload";
import {
  associarTelas,
  editarMarquee,
  excluirItem,
  salvarItem,
} from "../actions";

export type EditorTela = { id: string; nome: string; status: string };
export type EditorItem = {
  id: string;
  titulo: string;
  imagem: string | null;
  tipo_nav: string;
  tela_destino_id: string | null;
  url_externa: string | null;
  ordem: number;
};

export function MarqueeEditor({
  marqueeId,
  nomeInicial,
  corFundoInicial,
  corTextoInicial,
  telas,
  telaIdsAssociadas,
  itens,
}: {
  marqueeId: string;
  nomeInicial: string;
  corFundoInicial: string;
  corTextoInicial: string;
  telas: EditorTela[];
  telaIdsAssociadas: string[];
  itens: EditorItem[];
}) {
  const router = useRouter();
  return (
    <div className="mt-6 space-y-10">
      <DadosSection
        marqueeId={marqueeId}
        nomeInicial={nomeInicial}
        corFundoInicial={corFundoInicial}
        corTextoInicial={corTextoInicial}
        onSaved={() => router.refresh()}
      />
      <TelasSection
        marqueeId={marqueeId}
        telas={telas}
        associadas={telaIdsAssociadas}
        onSaved={() => router.refresh()}
      />
      <ItensSection marqueeId={marqueeId} telas={telas} itens={itens} />
    </div>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold tracking-tight">{titulo}</h2>
      {children}
    </section>
  );
}

function DadosSection({
  marqueeId,
  nomeInicial,
  corFundoInicial,
  corTextoInicial,
  onSaved,
}: {
  marqueeId: string;
  nomeInicial: string;
  corFundoInicial: string;
  corTextoInicial: string;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const [cf, setCf] = useState(corFundoInicial);
  const [ct, setCt] = useState(corTextoInicial);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    start(async () => {
      const r = await editarMarquee(marqueeId, {
        nome,
        cor_fundo: cf,
        cor_texto: ct,
      });
      if (!r.ok) return setError(r.error);
      setOk(true);
      onSaved();
    });
  }

  return (
    <Secao titulo="Dados">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <Field label="Nome" htmlFor="e-nome">
          <Input id="e-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </Field>
        <Field label="Cor de fundo" htmlFor="e-cf">
          <Input id="e-cf" value={cf} onChange={(e) => setCf(e.target.value)} placeholder="#F3F4F6" />
        </Field>
        <Field label="Cor do texto" htmlFor="e-ct">
          <Input id="e-ct" value={ct} onChange={(e) => setCt(e.target.value)} placeholder="#18191F" />
        </Field>
        <div className="sm:col-span-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar dados"}
          </Button>
          {error && <span className="ml-3 text-sm text-destructive">{error}</span>}
          {ok && <span className="ml-3 text-sm text-success">Salvo.</span>}
        </div>
      </form>
    </Secao>
  );
}

function TelasSection({
  marqueeId,
  telas,
  associadas,
  onSaved,
}: {
  marqueeId: string;
  telas: EditorTela[];
  associadas: string[];
  onSaved: () => void;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set(associadas));
  const [pending, start] = useTransition();
  const [ok, setOk] = useState(false);

  function toggle(id: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Secao titulo="Telas associadas">
      {telas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Cadastre telas primeiro.</p>
      ) : (
        <div className="space-y-2">
          {telas.map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sel.has(t.id)}
                onChange={() => toggle(t.id)}
                className="size-4 accent-brand"
              />
              {t.nome}
              <span className="font-mono text-xs text-muted-foreground">
                {t.status === "habilitada" ? "" : "(desabilitada)"}
              </span>
            </label>
          ))}
          <Button
            className="mt-2"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setOk(false);
                await associarTelas(marqueeId, [...sel]);
                setOk(true);
                onSaved();
              })
            }
          >
            {pending ? "Salvando…" : "Salvar telas"}
          </Button>
          {ok && <span className="ml-3 text-sm text-success">Associações salvas.</span>}
        </div>
      )}
    </Secao>
  );
}

function ItensSection({
  marqueeId,
  telas,
  itens,
}: {
  marqueeId: string;
  telas: EditorTela[];
  itens: EditorItem[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<{ open: boolean; item: EditorItem | null }>({
    open: false,
    item: null,
  });
  const [del, setDel] = useState<EditorItem | null>(null);
  const [pending, start] = useTransition();

  return (
    <Secao titulo="Itens">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setModal({ open: true, item: null })}>
          Adicionar item
        </Button>
      </div>

      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item ainda.</p>
      ) : (
        <ul className="divide-y divide-border">
          {itens.map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-3">
              {it.imagem ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.imagem}
                  alt=""
                  className="size-10 rounded-md border border-border object-cover"
                />
              ) : (
                <div className="size-10 rounded-md border border-dashed border-border" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{it.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {it.tipo_nav === "interno"
                    ? `interno → ${telas.find((t) => t.id === it.tela_destino_id)?.nome ?? "—"}`
                    : `externo → ${it.url_externa}`}
                  {" · ordem "}
                  {it.ordem}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModal({ open: true, item: it })}
              >
                Editar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDel(it)}>
                Remover
              </Button>
            </li>
          ))}
        </ul>
      )}

      {modal.open && (
        <ItemModal
          marqueeId={marqueeId}
          telas={telas}
          item={modal.item}
          onClose={() => setModal({ open: false, item: null })}
          onSaved={() => {
            setModal({ open: false, item: null });
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!del}
        title="Remover item"
        description={del ? `Remover "${del.titulo}"?` : ""}
        confirmLabel="Remover"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            await excluirItem(marqueeId, del.id);
            setDel(null);
            router.refresh();
          })
        }
      />
    </Secao>
  );
}

function ItemModal({
  marqueeId,
  telas,
  item,
  onClose,
  onSaved,
}: {
  marqueeId: string;
  telas: EditorTela[];
  item: EditorItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [titulo, setTitulo] = useState(item?.titulo ?? "");
  const [imagem, setImagem] = useState<string | null>(item?.imagem ?? null);
  const [tipoNav, setTipoNav] = useState(item?.tipo_nav ?? "interno");
  const [telaId, setTelaId] = useState(item?.tela_destino_id ?? "");
  const [url, setUrl] = useState(item?.url_externa ?? "");
  const [ordem, setOrdem] = useState(String(item?.ordem ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const habilitadas = telas.filter((t) => t.status === "habilitada");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await salvarItem(marqueeId, item?.id ?? null, {
        titulo,
        imagem,
        tipo_nav: tipoNav as "interno" | "externo",
        tela_destino_id: tipoNav === "interno" ? telaId || null : null,
        url_externa: tipoNav === "externo" ? url || null : null,
        ordem: Number(ordem) || 0,
      });
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
          {item ? "Editar item" : "Novo item"}
        </h2>
        <Field label="Título" htmlFor="i-titulo">
          <Input id="i-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </Field>
        <Field label="Imagem">
          <ImageUpload bucket="marquees" value={imagem} onChange={setImagem} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Navegação" htmlFor="i-tipo">
            <Select id="i-tipo" value={tipoNav} onChange={(e) => setTipoNav(e.target.value)}>
              <option value="interno">Interno (tela)</option>
              <option value="externo">Externo (URL)</option>
            </Select>
          </Field>
          <Field label="Ordem" htmlFor="i-ordem">
            <Input
              id="i-ordem"
              type="number"
              min={0}
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
            />
          </Field>
        </div>
        {tipoNav === "interno" ? (
          <Field label="Tela de destino (habilitada)" htmlFor="i-tela" error={error}>
            <Select id="i-tela" value={telaId} onChange={(e) => setTelaId(e.target.value)}>
              <option value="">Selecione…</option>
              {habilitadas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="URL externa" htmlFor="i-url" error={error}>
            <Input
              id="i-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar item"}
          </Button>
        </div>
      </form>
    </div>
  );
}
