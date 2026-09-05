import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ContaAtual = {
  userId: string | null;
  /** É o admin mais antigo (raiz): vê o Histórico e não pode ser desativado. */
  isRoot: boolean;
  /** Ainda usa a senha definida no cadastro/seed → troca obrigatória. */
  senhaTemporaria: boolean;
};

/**
 * Dados da conta logada usados pelo shell administrativo. Reúne numa passagem
 * só o que antes era consultado separadamente (raiz + senha temporária), para
 * não somar latência a cada navegação.
 */
export async function getContaAtual(): Promise<ContaAtual> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, isRoot: false, senhaTemporaria: false };

  const [{ data: primeiro }, { data: eu }] = await Promise.all([
    supabase
      .from("admin_user")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .single(),
    supabase
      .from("admin_user")
      .select("senha_temporaria")
      .eq("id", user.id)
      .single(),
  ]);

  return {
    userId: user.id,
    isRoot: !!primeiro && primeiro.id === user.id,
    senhaTemporaria: eu?.senha_temporaria ?? false,
  };
}
