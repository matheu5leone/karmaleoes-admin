/**
 * Utilitários de cor para a pré-visualização do marquee.
 * Contraste segue a fórmula de luminância relativa do WCAG 2.1.
 */

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** "#abc" | "#aabbcc" → [r,g,b] (0-255). Devolve null se inválido. */
export function parseHex(hex: string): [number, number, number] | null {
  const m = hex.trim().match(HEX);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Luminância relativa (WCAG). */
function luminancia([r, g, b]: [number, number, number]): number {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** Razão de contraste entre duas cores (1 a 21). null se alguma for inválida. */
export function contraste(a: string, b: string): number | null {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return null;
  const [maior, menor] = [luminancia(ca), luminancia(cb)].sort((x, y) => y - x);
  return (maior + 0.05) / (menor + 0.05);
}

export type NivelContraste = "aa" | "aa-grande" | "reprovado";

/** Classifica o contraste: AA (4.5:1), AA para texto grande (3:1) ou reprovado. */
export function nivelContraste(razao: number): NivelContraste {
  if (razao >= 4.5) return "aa";
  if (razao >= 3) return "aa-grande";
  return "reprovado";
}

/** Sugere a cor de texto (clara ou escura) com melhor contraste sobre `fundo`. */
export function sugerirCorTexto(fundo: string): string {
  const claro = contraste(fundo, "#FFFFFF") ?? 0;
  const escuro = contraste(fundo, "#111111") ?? 0;
  return claro >= escuro ? "#FFFFFF" : "#111111";
}
