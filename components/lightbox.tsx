"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Imagem em tela cheia. Escape ou clique no fundo fecham; enquanto aberta,
 * trava a rolagem para o fundo não escorregar atrás do overlay.
 */
export function Lightbox({
  src,
  alt = "",
  legenda,
  onClose,
}: {
  src: string;
  alt?: string;
  legenda?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={legenda ?? "Imagem em tela cheia"}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 rounded-md p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="size-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-md object-contain shadow-lg"
      />
      {legenda && (
        <p className="text-sm text-white/90">{legenda}</p>
      )}
    </div>
  );
}
