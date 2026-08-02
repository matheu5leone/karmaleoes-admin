"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { contraste, nivelContraste, sugerirCorTexto } from "@/lib/color";

export type PreviewItem = {
  id: string;
  titulo: string;
  icon: { name: string; extension: string } | null;
};

/** Fallbacks quando o campo de cor está vazio/incompleto durante a digitação. */
const FUNDO_PADRAO = "#F3F4F6";
const TEXTO_PADRAO = "#18191F";

/**
 * Pré-visualização do marquee montado: mostra a faixa como ela aparecerá na
 * tela do Hub, reagindo ao vivo às cores e aos itens, com medidor de contraste.
 * O Hub ainda não existe — este preview serve como referência visual.
 */
export function MarqueePreview({
  nome,
  corFundo,
  corTexto,
  itens,
  onCorTexto,
}: {
  nome: string;
  corFundo: string;
  corTexto: string;
  itens: PreviewItem[];
  onCorTexto?: (hex: string) => void;
}) {
  const [tema, setTema] = useState<"claro" | "escuro">("claro");

  // Superfície da tela mock em estilo inline: o componente lida com cores
  // arbitrárias, então não dependemos de classes utilitárias aqui.
  const superficie =
    tema === "claro"
      ? { fundo: "#F9FAFB", borda: "#E5E7EB", texto: "#6B7280", barra: "#E5E7EB" }
      : { fundo: "#111827", borda: "#374151", texto: "#9CA3AF", barra: "#374151" };

  const fundo = corFundo?.trim() || FUNDO_PADRAO;
  const texto = corTexto?.trim() || TEXTO_PADRAO;
  const razao = contraste(fundo, texto);
  const nivel = razao ? nivelContraste(razao) : null;
  const sugestao = sugerirCorTexto(fundo);
  const podeCorrigir =
    !!onCorTexto && nivel === "reprovado" && sugestao.toLowerCase() !== texto.toLowerCase();

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Pré-visualização</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Como a faixa aparece na tela, com as cores e itens atuais.
          </p>
        </div>
        <div
          role="group"
          aria-label="Fundo da tela"
          className="flex shrink-0 rounded-md border border-border p-0.5"
        >
          {(["claro", "escuro"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTema(t)}
              aria-pressed={tema === t}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                tema === t
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Mock da tela do Hub */}
      <div
        className="overflow-hidden rounded-xl border shadow-inner transition-colors"
        style={{ backgroundColor: superficie.fundo, borderColor: superficie.borda }}
      >
        {/* Barra superior fake, dá contexto de "tela" */}
        <div
          className="flex items-center gap-1.5 border-b px-3 py-2"
          style={{ borderColor: superficie.borda }}
        >
          {[0.55, 0.4, 0.28].map((o) => (
            <span
              key={o}
              className="size-2 rounded-full"
              style={{ backgroundColor: superficie.texto, opacity: o }}
            />
          ))}
          <span
            className="ml-2 truncate text-[11px]"
            style={{ color: superficie.texto }}
          >
            {nome?.trim() || "Marquee sem nome"}
          </span>
        </div>

        {/* A faixa do marquee */}
        <div className="p-3">
          <div
            className="rounded-lg px-1 py-3 transition-colors"
            style={{ backgroundColor: fundo }}
          >
            {itens.length === 0 ? (
              <p
                className="px-3 py-1 text-center text-sm opacity-70"
                style={{ color: texto }}
              >
                Adicione itens para vê-los aqui.
              </p>
            ) : (
              <ul
                className="flex gap-5 overflow-x-auto px-3 [scrollbar-width:thin]"
                style={{
                  maskImage:
                    "linear-gradient(to right, transparent, black 14px, black calc(100% - 14px), transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent, black 14px, black calc(100% - 14px), transparent)",
                }}
              >
                {itens.map((it) => (
                  <li
                    key={it.id}
                    className="flex shrink-0 flex-col items-center gap-1.5"
                    style={{ color: texto }}
                  >
                    {it.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/icons/${it.icon.name}.${it.icon.extension}`}
                        alt=""
                        className="size-7 object-contain"
                      />
                    ) : (
                      <span
                        className="size-7 rounded-full border border-current opacity-30"
                        aria-hidden
                      />
                    )}
                    <span className="max-w-[92px] truncate text-xs font-medium">
                      {it.titulo}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Conteúdo fake da página, só para dar contexto à faixa */}
          <div className="space-y-2 px-1 pb-1 pt-4" aria-hidden>
            {["66%", "100%", "83%"].map((w, i) => (
              <div
                key={i}
                className="h-2 rounded-full"
                style={{ width: w, backgroundColor: superficie.barra }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Medidor de contraste */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Contraste texto/fundo:</span>
        {razao === null ? (
          <span className="text-muted-foreground">cor inválida</span>
        ) : (
          <>
            <span className="font-mono font-medium">{razao.toFixed(2)}:1</span>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                nivel === "aa" && "bg-success/10 text-success",
                nivel === "aa-grande" && "bg-warning/10 text-warning",
                nivel === "reprovado" && "bg-destructive/10 text-destructive",
              )}
            >
              {nivel === "aa"
                ? "WCAG AA"
                : nivel === "aa-grande"
                  ? "AA só para texto grande"
                  : "abaixo do mínimo (4.5:1)"}
            </span>
            {podeCorrigir && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onCorTexto?.(sugestao)}
              >
                <Wand2 className="size-3.5" />
                Usar {sugestao}
              </Button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
