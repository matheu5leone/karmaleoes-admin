"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  associarTela,
  despublicar,
  publicar,
  removerAssociacao,
} from "../actions";

export type DetTela = { id: string; nome: string; status: string };
export type DetAssoc = { id: string; tela_id: string; status: string };

export function BannerAssociacoes({
  bannerId,
  telas,
  assoc,
}: {
  bannerId: string;
  telas: DetTela[];
  assoc: DetAssoc[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const byTela = new Map(assoc.map((a) => [a.tela_id, a]));

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    start(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error ?? "Falha.");
      else toast.success(ok);
      router.refresh();
    });
  }

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
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-[0.02em] text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-semibold">Tela</th>
                <th className="px-4 py-2 font-semibold">Estado</th>
                <th className="px-4 py-2 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {telas.map((t) => {
                const a = byTela.get(t.id);
                const habilitada = t.status === "habilitada";
                return (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-4 py-2">
                      {t.nome}
                      {!habilitada && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (desabilitada)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {!a ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.status === "publicado"
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {a.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        {!a && habilitada && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              run(
                                () => associarTela(bannerId, t.id),
                                "Associado (rascunho).",
                              )
                            }
                          >
                            Associar
                          </Button>
                        )}
                        {a && a.status === "draft" && habilitada && (
                          <Button
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              run(() => publicar(bannerId, a.id), "Publicado.")
                            }
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
                              run(
                                () => despublicar(bannerId, a.id),
                                "Despublicado.",
                              )
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
