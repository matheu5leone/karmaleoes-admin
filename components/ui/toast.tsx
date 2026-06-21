"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; type: ToastType; message: string };

const ToastCtx = createContext<
  ((t: { type: ToastType; message: string }) => void) | null
>(null);

/** Feedback de ações (DESIGN.md §7.8). Use dentro do ToastProvider. */
export function useToast() {
  const push = useContext(ToastCtx);
  if (!push) throw new Error("useToast precisa do ToastProvider");
  return {
    success: (message: string) => push({ type: "success", message }),
    error: (message: string) => push({ type: "error", message }),
    info: (message: string) => push({ type: "info", message }),
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: { type: ToastType; message: string }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((x) => x.id !== id)),
      4000,
    );
  }, []);

  const remove = (id: number) =>
    setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const cfg = {
    success: { Icon: CheckCircle2, cls: "text-success" },
    error: { Icon: AlertCircle, cls: "text-destructive" },
    info: { Icon: Info, cls: "text-info" },
  }[toast.type];
  const { Icon, cls } = cfg;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-3 shadow-md">
      <Icon className={`mt-0.5 size-4 shrink-0 ${cls}`} />
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
