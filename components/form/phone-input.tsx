"use client";

import { Input } from "@/components/ui/input";
import { apenasDigitos, formatarTelefone } from "@/lib/validation/usuarios";

/**
 * Campo de telefone com máscara "11 9 4520-4308" (celular) ou "11 4520-4308"
 * (fixo). O valor trafega e é salvo como **apenas dígitos** — a máscara é de
 * exibição. Como nada além de dígito é aceito, emoji não entra por construção.
 */
export function PhoneInput({
  value,
  onChange,
  ...props
}: {
  /** Só dígitos. */
  value: string;
  /** Recebe só dígitos. */
  onChange: (digitos: string) => void;
} & Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  "value" | "onChange" | "type"
>) {
  return (
    <Input
      {...props}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder={props.placeholder ?? "11 9 4520-4308"}
      value={formatarTelefone(value)}
      onChange={(e) => onChange(apenasDigitos(e.target.value))}
      onPaste={(e) => {
        e.preventDefault();
        onChange(apenasDigitos(e.clipboardData.getData("text")));
      }}
    />
  );
}
