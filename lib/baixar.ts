"use client";

/** Entrega um texto ao navegador como arquivo, sem passar pelo servidor. */
export function baixarTexto(nome: string, conteudo: string, tipo = "text/csv") {
  const url = URL.createObjectURL(new Blob([conteudo], { type: `${tipo};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoga depois do clique: antes disso o download ainda não começou.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
