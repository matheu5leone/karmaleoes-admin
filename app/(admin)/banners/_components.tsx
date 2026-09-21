"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageOff, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/field";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { ImageUpload } from "@/components/image-upload";
import { Lightbox } from "@/components/lightbox";
import { useToast } from "@/components/ui/toast";
import { criarBanner, editarBanner, excluirBanner } from "./actions";

export type BannerRow = {
  id: string;
  nome: string;
  imagem: string;
  associacoes: number;
  publicadas: number;
};

/** "2 telas · 1 publicada" — a segunda parte só aparece quando há publicação. */
function resumo(b: BannerRow): string {
  const telas = `${b.associacoes} ${b.associacoes === 1 ? "tela" : "telas"}`;
  if (!b.associacoes) return "Sem telas";
  if (!b.publicadas) return `${telas} · nenhuma publicada`;
  return `${telas} · ${b.publicadas} publicada${b.publicadas === 1 ? "" : "s"}`;
}

export function BannersManager({ banners }: { banners: BannerRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [filtro, setFiltro] = useState("");
  const [form, setForm] = useState<{ open: boolean; banner: BannerRow | null }>({
    open: false,
    banner: null,
  });
  const [del, setDel] = useState<BannerRow | null>(null);
  const [ampliado, setAmpliado] = useState<BannerRow | null>(null);
  const [pending, start] = useTransition();

  const visiveis = useMemo(() => {
    const termo = filtro.trim().toLowerCase();
    if (!termo) return banners;
    return banners.filter((b) => b.nome.toLowerCase().includes(termo));
  }, [banners, filtro]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar banners…"
          aria-label="Filtrar banners"
          className="sm:max-w-xs"
        />
        <Button onClick={() => setForm({ open: true, banner: null })}>
          Novo banner
        </Button>
      </div>

      {visiveis.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {banners.length === 0
            ? "Nenhum banner cadastrado."
            : "Nenhum banner com esse nome."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visiveis.map((b) => (
            <BannerCard
              key={b.id}
              banner={b}
              onAbrir={() => setForm({ open: true, banner: b })}
              onAmpliar={() => setAmpliado(b)}
            />
          ))}
        </ul>
      )}

      {form.open && (
        <BannerFormModal
          banner={form.banner}
          onClose={() => setForm({ open: false, banner: null })}
          onExcluir={(b) => {
            setForm({ open: false, banner: null });
            setDel(b);
          }}
          onSaved={(id) => {
            setForm({ open: false, banner: null });
            if (id) router.push(`/banners/${id}`);
            else router.refresh();
          }}
        />
      )}

      {ampliado && (
        <Lightbox
          src={ampliado.imagem}
          legenda={ampliado.nome}
          onClose={() => setAmpliado(null)}
        />
      )}

      <ConfirmDialog
        open={!!del}
        title="Excluir banner"
        description={del ? `Remover "${del.nome}" e suas associações?` : ""}
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            if (!del) return;
            const r = await excluirBanner(del.id);
            setDel(null);
            if (!r.ok) toast.error(r.error);
            else toast.success("Banner excluído.");
            router.refresh();
          })
        }
      />
    </>
  );
}

/**
 * Card no formato de vídeo do YouTube: miniatura 16:9 em cima, nome e resumo
 * embaixo. A miniatura abre o modal de gerenciar/editar; a lupa no canto abre
 * só a imagem, em tela cheia.
 */
function BannerCard({
  banner,
  onAbrir,
  onAmpliar,
}: {
  banner: BannerRow;
  onAbrir: () => void;
  onAmpliar: () => void;
}) {
  return (
    <li className="group">
      <div className="relative">
        <button
          type="button"
          onClick={onAbrir}
          aria-label={`Abrir ${banner.nome}`}
          className="block w-full overflow-hidden rounded-lg border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {banner.imagem ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner.imagem}
              alt=""
              className="aspect-video w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          ) : (
            <span className="flex aspect-video w-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-6" aria-hidden />
            </span>
          )}
        </button>

        {banner.imagem && (
          <button
            type="button"
            onClick={onAmpliar}
            aria-label={`Ver "${banner.nome}" em tela cheia`}
            title="Ver em tela cheia"
            className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Maximize2 className="size-4" />
          </button>
        )}

        {banner.publicadas > 0 && (
          <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            no ar
          </span>
        )}
      </div>

      <div className="mt-2">
        <button
          type="button"
          onClick={onAbrir}
          className="line-clamp-2 text-left text-sm font-medium leading-snug hover:text-brand"
        >
          {banner.nome}
        </button>
        <p className="mt-0.5 text-xs text-muted-foreground">{resumo(banner)}</p>
      </div>
    </li>
  );
}

function BannerFormModal({
  banner,
  onClose,
  onSaved,
  onExcluir,
}: {
  banner: BannerRow | null;
  onClose: () => void;
  onSaved: (id: string | null) => void;
  onExcluir: (b: BannerRow) => void;
}) {
  const toast = useToast();
  const [nome, setNome] = useState(banner?.nome ?? "");
  const [imagem, setImagem] = useState<string | null>(banner?.imagem ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const input = { nome, imagem: imagem ?? "" };
      const r = banner
        ? await editarBanner(banner.id, input)
        : await criarBanner(input);
      if (!r.ok) return setError(r.error);
      toast.success(banner ? "Banner atualizado." : "Banner criado.");
      onSaved(banner ? null : (r as { ok: true; id: string }).id);
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
        className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {banner ? banner.nome : "Novo banner"}
          </h2>
          {banner && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {resumo(banner)}
            </p>
          )}
        </div>

        <Field label="Nome (interno)" htmlFor="b-nome">
          <Input
            id="b-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </Field>
        <Field label="Imagem" error={error}>
          <ImageUpload bucket="banners" value={imagem} onChange={setImagem} />
        </Field>

        {/* Publicar por tela vive na página de detalhe, que precisa da lista
            de telas e de quem está no ar em cada uma. */}
        {banner && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/banners/${banner.id}`}>Gerenciar publicação →</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onExcluir(banner)}
            >
              Excluir
            </Button>
          </div>
        )}

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
