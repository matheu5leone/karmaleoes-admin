"use client";

import { Button } from "@/components/ui/button";

/** Diálogo de confirmação para ações destrutivas (DESIGN.md §7.7). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-lg border border-border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* `break-words` porque o nome do registro entra aqui: um título longo
            sem espaços empurrava a largura do diálogo em vez de quebrar. E a
            descrição rola quando cresce demais, em vez de estourar a altura. */}
        <h2 className="break-words text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-2 overflow-y-auto break-words text-sm text-muted-foreground">
            {description}
          </p>
        )}
        <div className="mt-6 flex shrink-0 justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Removendo…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
