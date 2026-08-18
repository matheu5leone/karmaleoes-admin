"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const TAMANHO = 6;

/**
 * Entrada de código TOTP em quadradinhos individuais.
 *
 * - aceita colar o código inteiro em qualquer um dos campos;
 * - avança/retrocede o foco sozinho;
 * - dispara `onComplete` assim que os 6 dígitos são preenchidos (sem Enter).
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  invalid = false,
  autoFocus = false,
  id = "otp",
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  id?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // Evita disparar a verificação duas vezes para o mesmo código.
  const enviado = useRef<string | null>(null);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  // Ao limpar (ex.: código recusado), volta o foco para o primeiro campo.
  useEffect(() => {
    if (value === "") {
      enviado.current = null;
      if (!disabled) refs.current[0]?.focus();
    }
  }, [value, disabled]);

  function aplicar(novo: string, focoEm?: number) {
    const limpo = novo.replace(/\D/g, "").slice(0, TAMANHO);
    onChange(limpo);
    if (focoEm !== undefined) {
      const i = Math.max(0, Math.min(TAMANHO - 1, focoEm));
      refs.current[i]?.focus();
      refs.current[i]?.select();
    }
    if (limpo.length === TAMANHO && enviado.current !== limpo) {
      enviado.current = limpo;
      onComplete(limpo);
    }
  }

  function digitar(i: number, bruto: string) {
    const digitos = bruto.replace(/\D/g, "");
    if (!digitos) return;
    // Digitar com vários dígitos (ex.: autofill) preenche a partir daqui.
    const antes = value.slice(0, i);
    const depois = value.slice(i + digitos.length);
    aplicar(antes + digitos + depois, i + digitos.length);
  }

  function tecla(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i]) {
        aplicar(value.slice(0, i) + value.slice(i + 1), i);
      } else if (i > 0) {
        aplicar(value.slice(0, i - 1) + value.slice(i), i - 1);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < TAMANHO - 1) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  }

  return (
    <div
      className="flex justify-between gap-2"
      onPaste={(e) => {
        e.preventDefault();
        const texto = e.clipboardData.getData("text");
        aplicar(texto, TAMANHO - 1);
      }}
    >
      {Array.from({ length: TAMANHO }, (_, i) => (
        <input
          key={i}
          id={i === 0 ? id : undefined}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Dígito ${i + 1} de ${TAMANHO}`}
          aria-invalid={invalid}
          value={value[i] ?? ""}
          disabled={disabled}
          onChange={(e) => digitar(i, e.target.value)}
          onKeyDown={(e) => tecla(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-14 w-full min-w-0 rounded-md border bg-card text-center font-mono text-xl text-foreground transition-colors",
            "focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-60",
            invalid ? "border-destructive" : "border-input hover:border-muted-foreground",
          )}
        />
      ))}
    </div>
  );
}
