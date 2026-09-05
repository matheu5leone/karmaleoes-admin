import { redirect } from "next/navigation";
import { getContaAtual } from "@/lib/conta";
import { AlterarSenhaForm } from "@/components/form/alterar-senha-form";

export default async function MinhaContaPage() {
  const conta = await getContaAtual();
  if (!conta.userId) redirect("/login");
  // Com senha temporária o fluxo é a troca obrigatória, fora do shell.
  if (conta.senhaTemporaria) redirect("/trocar-senha");

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Minha conta</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Altere a senha de acesso ao painel.
      </p>
      <AlterarSenhaForm redirectTo="/minha-conta" />
    </div>
  );
}
