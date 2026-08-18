import { cn } from "@/lib/utils";

/**
 * Filete duplo com losango central — a divisória de seção dos manuscritos.
 * Substitui o `<hr>`/borda simples entre blocos.
 */
export function Rule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("flex items-center gap-2 text-border", className)}
    >
      <span className="h-px flex-1 bg-current" />
      <span className="size-1.5 rotate-45 border border-current" />
      <span className="h-px flex-1 bg-current" />
    </div>
  );
}

/**
 * Florão de canto para cards e diálogos: quatro cantoneiras finas que sugerem
 * uma folha emoldurada, sem pesar como uma borda decorada inteira.
 */
export function Flourishes({ className }: { className?: string }) {
  const canto = "absolute size-3 border-brand/45";
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <span className={cn(canto, "left-1 top-1 border-l border-t")} />
      <span className={cn(canto, "right-1 top-1 border-r border-t")} />
      <span className={cn(canto, "bottom-1 left-1 border-b border-l")} />
      <span className={cn(canto, "bottom-1 right-1 border-b border-r")} />
    </div>
  );
}

/**
 * Cabeçalho de página: título com capitular rubricada e filete embaixo.
 * `intro` recebe a capitular (classe .dropcap em globals.css).
 */
export function PageHeading({
  titulo,
  intro,
  acoes,
}: {
  titulo: string;
  intro?: React.ReactNode;
  acoes?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {titulo}
        </h1>
        {acoes}
      </div>
      <Rule className="my-3" />
      {intro && (
        <p className="dropcap max-w-prose text-muted-foreground">{intro}</p>
      )}
    </header>
  );
}
