import { redirect } from "next/navigation";
import { getContaAtual } from "@/lib/conta";
import { AlterarSenhaForm } from "@/components/form/alterar-senha-form";

/**
 * Troca obrigatória no 1º acesso. Fica fora do grupo (admin) de propósito: o
 * layout administrativo redireciona para cá enquanto a senha for temporária, e
 * um redirecionamento para dentro do próprio layout daria laço.
 */
export default async function TrocarSenhaPage() {
  const conta = await getContaAtual();
  if (!conta.userId) redirect("/login");
  if (!conta.senhaTemporaria) redirect("/usuarios");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
          Primeiro acesso
        </p>
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">
          Defina sua senha
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Sua conta ainda usa a senha temporária do cadastro. Escolha uma nova
          senha para continuar.
        </p>
        <AlterarSenhaForm redirectTo="/usuarios" labelBotao="Definir senha" />
      </div>
    </main>
  );
}
