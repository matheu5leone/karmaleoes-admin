"use client";

import Link, { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useSetNavPending } from "@/components/nav-progress";

/**
 * Repórter do estado da navegação. `useLinkStatus` só funciona dentro de um
 * `<Link>`; aqui ele mostra um spinner inline no item clicado e alimenta a
 * barra de progresso global ([nav-progress.tsx]) enquanto a rota carrega.
 */
function PendingIndicator() {
  const { pending } = useLinkStatus();
  const setPending = useSetNavPending();

  useEffect(() => {
    if (!pending) return;
    setPending(true);
    return () => setPending(false);
  }, [pending, setPending]);

  if (!pending) return null;
  return (
    <Loader2 className="ml-auto size-4 shrink-0 animate-spin text-muted-foreground" />
  );
}

/** Link do menu que dá feedback imediato no clique (spinner + barra no topo). */
export function NavLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={className}>
      {children}
      <PendingIndicator />
    </Link>
  );
}
