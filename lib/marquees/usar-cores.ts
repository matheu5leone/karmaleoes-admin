"use client";

import { useEffect, useState } from "react";
import {
  getCoresPredefinidas,
  type CorPredefinida,
} from "@/app/(admin)/marquees/cores";

const CHAVE = "karma-cores-predefinidas";

/**
 * Paleta sugerida, lida uma vez por aba.
 *
 * Fica em `sessionStorage` porque é tabela de apoio que quase nunca muda, e o
 * seletor abre a cada item editado — sem o cache seria uma ida ao banco por
 * abertura de modal. Dura a sessão: recarregar a aba traz a lista de novo.
 */
export function useCoresPredefinidas(): CorPredefinida[] {
  const [cores, setCores] = useState<CorPredefinida[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const salvo = sessionStorage.getItem(CHAVE);
      return salvo ? (JSON.parse(salvo) as CorPredefinida[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (cores.length > 0) return;
    let vivo = true;
    void getCoresPredefinidas().then((lista) => {
      if (!vivo) return;
      setCores(lista);
      try {
        sessionStorage.setItem(CHAVE, JSON.stringify(lista));
      } catch {
        /* sem storage: busca de novo na próxima abertura */
      }
    });
    return () => {
      vivo = false;
    };
    // Só na montagem: a paleta não muda durante a sessão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return cores;
}
