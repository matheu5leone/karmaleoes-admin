import { cn } from "@/lib/utils";

/**
 * Tincturas heráldicas. A hachura de Petra Sancta (1638) representava cada
 * tinctura por um padrão de linhas em gravura monocromática — aqui ela codifica
 * o status por PADRÃO além da cor, então o badge não depende de cor sozinha
 * (WCAG 1.4.1). Classes `.hatch-*` vivem em app/globals.css.
 */
export type Tinctura =
  | "or"
  | "argent"
  | "gules"
  | "azure"
  | "vert"
  | "tenne"
  | "purpure"
  | "sable";

const TINCTURA: Record<Tinctura, { texto: string; hatch: string }> = {
  or: { texto: "text-or", hatch: "hatch-or" },
  argent: { texto: "text-muted-foreground", hatch: "hatch-argent" },
  gules: { texto: "text-destructive", hatch: "hatch-gules" },
  azure: { texto: "text-info", hatch: "hatch-azure" },
  vert: { texto: "text-success", hatch: "hatch-vert" },
  tenne: { texto: "text-warning", hatch: "hatch-tenne" },
  purpure: { texto: "text-purpure", hatch: "hatch-purpure" },
  sable: { texto: "text-foreground", hatch: "hatch-sable" },
};

/** Contorno de escudo (escudo francês antigo), usado como máscara do badge. */
const ESCUDO =
  "polygon(0% 0%, 100% 0%, 100% 62%, 50% 100%, 0% 62%)";

/**
 * Badge em forma de brasão. `escudo` desenha o contorno de escudo (para status
 * principais); sem ele fica retangular com filete, para rótulos secundários.
 */
export function ShieldBadge({
  tinctura = "argent",
  escudo = false,
  className,
  children,
}: {
  tinctura?: Tinctura;
  escudo?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const t = TINCTURA[tinctura];
  return (
    <span
      className={cn(
        "hatch tincture-chip inline-flex items-center gap-1 font-medium leading-none",
        t.texto,
        t.hatch,
        escudo
          ? "px-2 pb-2.5 pt-1 text-[11px]"
          : "rounded-sm px-2 py-0.5 text-xs",
        className,
      )}
      style={escudo ? { clipPath: ESCUDO } : undefined}
    >
      {children}
    </span>
  );
}
