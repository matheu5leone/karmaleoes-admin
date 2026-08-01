/**
 * Hook executado uma vez no start do servidor (Next.js).
 * Sincroniza os arquivos de /public/icons com a tabela `icons`, para que novos
 * ícones colocados na pasta virem opção no frontend automaticamente ao (re)iniciar
 * a aplicação. Ver lib/icons-fs.ts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { syncIconsFromFolder } = await import("@/lib/icons-fs");
  await syncIconsFromFolder();
}
