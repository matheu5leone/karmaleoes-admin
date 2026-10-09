"use client";

import { useState } from "react";
import type { z, ZodTypeAny } from "zod";
import { ERRO_GERAL, errosPorCampo, type ErrosCampo } from "@/lib/validation/erros";

/**
 * Erros de formulário em um lugar só.
 *
 * `validar` roda o mesmo schema que a server action usa — o retorno é a
 * resposta já validada, ou `null` quando há problema, e aí todos os campos
 * errados acendem de uma vez (não só o primeiro). A action continua validando
 * no servidor; o que chega de lá cai em `doServidor`.
 */
export function useFormErros() {
  const [erros, setErros] = useState<ErrosCampo>({});

  // `z.output` deixa explícito que volta o dado já transformado pelo schema —
  // com `ZodType<T>` o TS às vezes resolvia para o tipo de entrada.
  function validar<S extends ZodTypeAny>(
    schema: S,
    valores: unknown,
  ): z.output<S> | null {
    const r = schema.safeParse(valores);
    if (!r.success) {
      setErros(errosPorCampo(r.error));
      return null;
    }
    setErros({});
    return r.data;
  }

  /** Mensagem vinda da action: entra como erro geral, no topo do formulário. */
  function doServidor(mensagem: string, campo = ERRO_GERAL) {
    setErros({ [campo]: mensagem });
  }

  function limpar() {
    setErros({});
  }

  return { erros, validar, doServidor, limpar };
}
