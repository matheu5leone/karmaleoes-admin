"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shell administrativo responsivo.
 *
 * Desktop: barra lateral **fixa** em altura total, com rolagem própria.
 * Mobile: a mesma barra vira gaveta, aberta pelo hambúrguer da barra superior.
 *
 * `sidebar` chega já renderizada pelo Server Component — assim o layout segue
 * consultando a conta no servidor e só a interação de abrir/fechar é cliente.
 */
export function AdminShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();

  // Navegar fecha a gaveta.
  useEffect(() => setAberto(false), [pathname]);

  // Escape fecha; com a gaveta aberta, trava a rolagem do fundo.
  useEffect(() => {
    if (!aberto) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", h);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto]);

  return (
    <div className="min-h-screen md:pl-60">
      {/* Barra superior — só no mobile */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={aberto}
          aria-controls="menu-lateral"
          className="rounded-sm border border-border p-1.5 text-foreground/80 transition-colors hover:border-brand hover:text-brand"
        >
          <Menu className="size-5" />
        </button>
        <p className="font-display text-lg font-semibold tracking-tight">
          Karmaleões
        </p>
      </header>

      {/* Fundo escurecido da gaveta */}
      {aberto && (
        <div
          onClick={() => setAberto(false)}
          aria-hidden
          className="fixed inset-0 z-40 bg-foreground/50 md:hidden"
        />
      )}

      {/* Barra lateral: fixa no desktop, gaveta no mobile */}
      <aside
        id="menu-lateral"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col overflow-y-auto border-r border-border bg-card transition-transform duration-200",
          "md:translate-x-0",
          aberto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Fechar menu"
          className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground md:hidden"
        >
          <X className="size-5" />
        </button>
        {sidebar}
      </aside>

      <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
