/**
 * Hook executado uma vez no start do servidor (Next.js).
 * Sincroniza os arquivos de /public/icons com a tabela `icons`, para que novos
 * ícones colocados na pasta virem opção no frontend automaticamente ao (re)iniciar
 * a aplicação. Ver lib/icons-fs.ts.
 *
 * O corpo fica DENTRO do if: o instrumentation também é compilado para o runtime
 * edge (por causa do middleware), e só nessa forma o webpack elimina o import de
 * `node:fs`/`node:path` do bundle edge — com `if (...) return` cedo, ele mantém
 * o import e o build quebra com UnhandledSchemeError.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { syncIconsFromFolder } = await import("@/lib/icons-fs");
    await syncIconsFromFolder();
  }
}
