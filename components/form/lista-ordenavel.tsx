"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lista reordenável por arraste. Substitui o campo numérico "Ordem" nos
 * formulários — a posição passa a ser definida movendo o item.
 *
 * O arraste nativo não funciona por toque nem por teclado, então cada linha
 * também tem os botões subir/descer: no celular e para quem navega por teclado,
 * são eles que fazem o trabalho.
 */
export function ListaOrdenavel<T extends { id: string }>({
  itens,
  onReordenar,
  children,
  className,
}: {
  itens: T[];
  /** Recebe os ids na nova ordem; só dispara quando a ordem muda de fato. */
  onReordenar: (idsNaOrdem: string[]) => void;
  children: (item: T, indice: number) => ReactNode;
  className?: string;
}) {
  const [ordenados, setOrdenados] = useState(itens);
  const [arrastando, setArrastando] = useState<string | null>(null);

  // Segue os dados do servidor quando eles mudam (criar/excluir item).
  useEffect(() => setOrdenados(itens), [itens]);

  function aplicar(novos: T[]) {
    setOrdenados(novos);
    const ids = novos.map((i) => i.id);
    if (ids.join() !== itens.map((i) => i.id).join()) onReordenar(ids);
  }

  function mover(de: number, para: number) {
    if (para < 0 || para >= ordenados.length || de === para) return;
    const copia = [...ordenados];
    const [item] = copia.splice(de, 1);
    copia.splice(para, 0, item);
    aplicar(copia);
  }

  return (
    <ul className={cn("divide-y divide-border", className)}>
      {ordenados.map((item, i) => (
        <li
          key={item.id}
          draggable
          onDragStart={() => setArrastando(item.id)}
          onDragEnd={() => setArrastando(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const de = ordenados.findIndex((x) => x.id === arrastando);
            if (de >= 0) mover(de, i);
            setArrastando(null);
          }}
          className={cn(
            "flex items-center gap-2 py-3",
            arrastando === item.id && "opacity-50",
          )}
        >
          <div className="flex shrink-0 flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={() => mover(i, i - 1)}
              disabled={i === 0}
              aria-label="Mover para cima"
              className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-brand disabled:opacity-30"
            >
              <ChevronUp className="size-3.5" />
            </button>
            <GripVertical
              className="size-4 cursor-grab text-muted-foreground active:cursor-grabbing"
              aria-hidden
            />
            <button
              type="button"
              onClick={() => mover(i, i + 1)}
              disabled={i === ordenados.length - 1}
              aria-label="Mover para baixo"
              className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-brand disabled:opacity-30"
            >
              <ChevronDown className="size-3.5" />
            </button>
          </div>
          <div className="min-w-0 flex-1">{children(item, i)}</div>
        </li>
      ))}
    </ul>
  );
}
