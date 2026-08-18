import { cn } from "@/lib/utils";

/**
 * Selo/sigilo da casa: roundel com leão rampante estilizado e o monograma K.
 * Desenhado em SVG de propósito — evita carregar uma fonte blackletter só para
 * um glifo, e fica nítido em qualquer tamanho.
 */
export function Seal({
  className,
  size = 44,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label="Selo dos Karmaleões"
      className={cn("shrink-0", className)}
    >
      {/* anel externo do sinete */}
      <circle
        cx="50"
        cy="50"
        r="47"
        fill="hsl(var(--brand-subtle))"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="50"
        cy="50"
        r="41"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        opacity="0.55"
      />
      {/* escudo central */}
      <path
        d="M50 18 L74 26 V52 C74 66 62 76 50 82 C38 76 26 66 26 52 V26 Z"
        fill="hsl(var(--card))"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {/* leão rampante muito estilizado (silhueta) */}
      <path
        d="M43 62 C41 56 43 50 47 47 C45 44 45 40 48 38 C49 41 51 42 53 41
           C52 38 54 35 57 35 C56 38 58 40 60 41 C63 43 64 47 62 50
           C64 53 64 57 62 60 C60 63 56 65 52 65 Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* monograma */}
      <text
        x="50"
        y="76"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill="currentColor"
        fontFamily="var(--font-display), Georgia, serif"
      >
        K
      </text>
    </svg>
  );
}
