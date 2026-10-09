import { ShieldAlert } from "lucide-react";
import { contarErros, ERRO_GERAL, type ErrosCampo } from "@/lib/validation/erros";
import { cn } from "@/lib/utils";

/**
 * Selo de reprovação do formulário: diz quantos campos precisam de atenção e
 * lista os motivos. Os campos em si já ficam com o contorno em gules; isto é
 * para quem não quer caçar o erro num formulário longo ou rolado.
 */
export function ResumoErros({
  erros,
  rotulos,
  className,
}: {
  erros: ErrosCampo;
  /** Nome amigável por campo; sem ele, mostra só a mensagem. */
  rotulos?: Record<string, string>;
  className?: string;
}) {
  const itens = Object.entries(erros).filter(([, m]) => m);
  const total = contarErros(erros);
  if (!total) return null;

  return (
    <div
      role="alert"
      className={cn(
        "rounded-sm border border-destructive/40 border-l-[3px] border-l-destructive bg-destructive/10 px-3 py-2.5",
        className,
      )}
    >
      <p className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
        <ShieldAlert aria-hidden className="size-4 shrink-0" />
        {total === 1
          ? "Um campo precisa de atenção"
          : `${total} campos precisam de atenção`}
      </p>
      <ul className="mt-1.5 space-y-1 text-sm text-destructive/90">
        {itens.map(([campo, mensagem]) => (
          <li key={campo} className="flex gap-1.5">
            <span aria-hidden className="select-none">
              •
            </span>
            <span>
              {campo !== ERRO_GERAL && rotulos?.[campo] && (
                <strong className="font-medium">{rotulos[campo]}: </strong>
              )}
              {mensagem}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
