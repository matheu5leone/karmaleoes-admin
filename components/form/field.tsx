import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

/**
 * Wrapper de campo: label + controle + mensagem de erro (DESIGN.md §7.2).
 *
 * Com `error` preenchido, o controle filho recebe `aria-invalid` e aponta para
 * a mensagem — assim o contorno vermelho e a leitura por leitor de tela saem
 * de graça, sem cada formulário repetir isso campo a campo.
 */
export function Field({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  const idErro = htmlFor ? `${htmlFor}-erro` : undefined;
  const controle =
    error && React.isValidElement(children)
      ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          "aria-invalid": true,
          "aria-describedby": idErro,
        })
      : children;

  return (
    <div className={className ?? "space-y-1.5"}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {controle}
      {error && (
        <p
          id={idErro}
          role="alert"
          className="flex items-start gap-1.5 text-sm text-destructive"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
