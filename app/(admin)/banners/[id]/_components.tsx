"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ShieldBadge } from "@/components/heraldry/shield-badge";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table/data-table";
import {
  associarTela,
  despublicar,
  publicar,
  removerAssociacao,
} from "../actions";

export type DetTela = { id: string; nome: string; status: string };
export type DetAssoc = { id: string; tela_id: string; status: string };
/** Banner de OUTRO cadastro que está publicado na tela agora. */
export type PublicadoNaTela = { bannerId: string; nome: string };

export function BannerAssociacoes({
  bannerId,
  telas,
  assoc,
  publicadoPorTela,
}: {
  bannerId: string;
  telas: DetTela[];
  assoc: DetAssoc[];
  publicadoPorTela: Record<string, PublicadoNaTela>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const byTela = new Map(assoc.map((a) => [a.tela_id, a]));
  // Troca pendente de confirmação: publicar aqui tira outro banner do ar.
  const [troca, setTroca] = useState<
    { assocId: string; tela: string; substituido: string } | null
  >(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    start(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error ?? "Falha.");
      else toast.success(ok);
      router.refresh();
    });
  }

  const colunas: Column<DetTela>[] = [
    {
      key: "nome",
      header: "Tela",
      render: (t) => (
        <>
          {t.nome}
          {t.status !== "habilitada" && (
            <span className="ml-2 text-xs text-muted-foreground">
              (desabilitada)
            </span>
          )}
        </>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      valor: (t) => byTela.get(t.id)?.status ?? "—",
      render: (t) => {
        const a = byTela.get(t.id);
        return (
          <>
            {!a ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <ShieldBadge
                tinctura={a.status === "publicado" ? "vert" : "argent"}
                escudo
              >
                {a.status}
              </ShieldBadge>
            )}
            {/* Quem ocupa a tela hoje — evita a troca às cegas. */}
            {publicadoPorTela[t.id] && (
              <p className="mt-1 text-xs text-muted-foreground">
                exibindo: {publicadoPorTela[t.id].nome}
              </p>
            )}
          </>
        );
      },
    },
    {
      key: "acoes",
      estatica: true,
      header: "Ações",
      render: (t) => {
        const a = byTela.get(t.id);
        const habilitada = t.status === "habilitada";
        return (
          <div className="flex gap-1">
            {!a && habilitada && (
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() =>
                  run(() => associarTela(bannerId, t.id), "Associado (rascunho).")
                }
              >
                Associar
              </Button>
            )}
            {a && a.status === "draft" && habilitada && (
              <Button
                size="sm"
                disabled={pending}
                onClick={() => {
                  const atual = publicadoPorTela[t.id];
                  // Sem banner publicado na tela, publica direto: confirmar
                  // aqui seria só atrito.
                  if (!atual) {
                    return run(() => publicar(bannerId, a.id), "Publicado.");
                  }
                  setTroca({
                    assocId: a.id,
                    tela: t.nome,
                    substituido: atual.nome,
                  });
                }}
              >
                Publicar
              </Button>
            )}
            {a && a.status === "publicado" && (
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() =>
                  run(() => despublicar(bannerId, a.id), "Despublicado.")
                }
              >
                Despublicar
              </Button>
            )}
            {a && (
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() =>
                  run(
                    () => removerAssociacao(bannerId, a.id),
                    "Associação removida.",
                  )
                }
              >
                Remover
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <section className="mt-8 rounded-lg border border-border bg-card p-5">
      <h2 className="mb-1 text-lg font-semibold tracking-tight">
        Publicação por tela
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Cada tela exibe no máximo um banner publicado. Publicar aqui rebaixa o
        anterior da mesma tela.
      </p>

      {telas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Cadastre telas primeiro.</p>
      ) : (
        <DataTable
          id="banner-telas"
          columns={colunas}
          rows={telas}
          getFilterText={(t) => t.nome}
          filterPlaceholder="Filtrar telas…"
          empty="Nenhuma tela."
        />
      )}

      <ConfirmDialog
        open={!!troca}
        title="Trocar o banner publicado?"
        description={
          troca
            ? `A tela "${troca.tela}" já exibe o banner "${troca.substituido}". Publicar este no lugar tira o outro do ar imediatamente — ele volta a rascunho, sem ser excluído.`
            : ""
        }
        confirmLabel="Trocar banner"
        pending={pending}
        onCancel={() => setTroca(null)}
        onConfirm={() => {
          if (!troca) return;
          const { assocId, substituido } = troca;
          setTroca(null);
          run(
            () => publicar(bannerId, assocId),
            `Publicado no lugar de "${substituido}".`,
          );
        }}
      />
    </section>
  );
}
