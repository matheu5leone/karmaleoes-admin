"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Feedback global de navegação. As rotas do (admin) só começam a renderizar
 * (e mostrar o `loading.tsx`) depois que o middleware libera — durante essa
 * espera a tela ficava congelada sem sinal nenhum. Este provedor exibe uma
 * barra fina no topo assim que um `<NavLink>` entra em estado pendente.
 */
const NavPendingContext = createContext<(pending: boolean) => void>(() => {});

/** Sinaliza início/fim de uma navegação pendente. Balanceado (true → false). */
export function useSetNavPending() {
  return useContext(NavPendingContext);
}

export function NavProgress({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const set = useCallback((pending: boolean) => {
    setCount((n) => Math.max(0, n + (pending ? 1 : -1)));
  }, []);

  const value = useMemo(() => set, [set]);

  return (
    <NavPendingContext.Provider value={value}>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 transition-opacity duration-200",
          count > 0 ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="h-full w-2/5 animate-nav-progress rounded-r-full bg-brand" />
      </div>
      {children}
    </NavPendingContext.Provider>
  );
}
