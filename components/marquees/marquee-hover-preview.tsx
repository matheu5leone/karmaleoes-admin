"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MarqueeFaixa, type PreviewItem } from "./marquee-preview";
import { contraste, nivelContraste } from "@/lib/color";
import { cn } from "@/lib/utils";

export type MarqueeResumo = {
  id: string;
  nome: string;
  corFundo: string;
  corTexto: string;
  itens: PreviewItem[];
};

const LARGURA = 320;
const ALTURA_ESTIMADA = 168;

/**
 * Nome do marquee que revela a faixa montada ao passar o mouse (ou focar).
 * O card usa `position: fixed` porque a DataTable tem `overflow-hidden` —
 * um popover absoluto seria recortado pela borda da tabela.
 */
export function MarqueeHoverPreview({ marquee }: { marquee: MarqueeResumo }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const abrir = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Encosta na borda? Alinha à direita / abre para cima.
    const x = Math.max(8, Math.min(r.left, window.innerWidth - LARGURA - 8));
    const y =
      r.bottom + ALTURA_ESTIMADA + 8 > window.innerHeight
        ? Math.max(8, r.top - ALTURA_ESTIMADA - 8)
        : r.bottom + 8;
    setPos({ x, y });
  }, []);

  const fechar = useCallback(() => setPos(null), []);

  // Card é `fixed`: fecha ao rolar/redimensionar para não ficar "solto".
  useEffect(() => {
    if (!pos) return;
    window.addEventListener("scroll", fechar, true);
    window.addEventListener("resize", fechar);
    return () => {
      window.removeEventListener("scroll", fechar, true);
      window.removeEventListener("resize", fechar);
    };
  }, [pos, fechar]);

  const razao = contraste(marquee.corFundo, marquee.corTexto);
  const nivel = razao ? nivelContraste(razao) : null;

  return (
    <>
      <button
        ref={ref}
        type="button"
        onMouseEnter={abrir}
        onMouseLeave={fechar}
        onFocus={abrir}
        onBlur={fechar}
        onKeyDown={(e) => e.key === "Escape" && fechar()}
        aria-expanded={!!pos}
        className="cursor-help rounded underline decoration-dotted underline-offset-4 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {marquee.nome}
      </button>

      {pos && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 rounded-lg border border-border bg-card p-3 shadow-lg"
          style={{ left: pos.x, top: pos.y, width: LARGURA }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="truncate text-xs font-semibold">{marquee.nome}</p>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {marquee.itens.length}{" "}
              {marquee.itens.length === 1 ? "item" : "itens"}
            </span>
          </div>

          <MarqueeFaixa
            corFundo={marquee.corFundo}
            corTexto={marquee.corTexto}
            itens={marquee.itens}
            compacto
            vazioLabel="Marquee sem itens."
          />

          {razao !== null && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px]">
              <span className="text-muted-foreground">Contraste</span>
              <span className="font-mono">{razao.toFixed(2)}:1</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-medium",
                  nivel === "aa" && "bg-success/10 text-success",
                  nivel === "aa-grande" && "bg-warning/10 text-warning",
                  nivel === "reprovado" && "bg-destructive/10 text-destructive",
                )}
              >
                {nivel === "aa"
                  ? "AA"
                  : nivel === "aa-grande"
                    ? "AA grande"
                    : "baixo"}
              </span>
            </p>
          )}
        </div>
      )}
    </>
  );
}
