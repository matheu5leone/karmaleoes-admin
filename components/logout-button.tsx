"use client";

import { useFormStatus } from "react-dom";
import { Loader2, LogOut } from "lucide-react";

/**
 * Botão de sair com estado de espera. O logoff encerra a sessão no Redis e no
 * Supabase antes de redirecionar — sem feedback, o clique parecia não responder.
 */
export function LogoutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="size-[18px] animate-spin text-muted-foreground" />
      ) : (
        <LogOut className="size-[18px] text-muted-foreground" />
      )}
      {pending ? "Saindo…" : "Sair"}
    </button>
  );
}
