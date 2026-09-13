import "server-only";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "ADMIN" | "SUPER";

export type ContaAtual = {
  userId: string | null;
  /**
   * Papel SUPER (admin_user.user_role): vê o Histórico e não pode ser
   * desativado. Definido manualmente no dashboard do Supabase (migration 0019).
   */
  isSuper: boolean;
  /** Ainda usa a senha definida no cadastro/seed → troca obrigatória. */
  senhaTemporaria: boolean;
};

/**
 * Dados da conta logada usados pelo shell administrativo, numa consulta só.
 * (Com a regra antiga, "mais antigo", eram duas; o papel explícito dispensa
 * olhar as outras contas.)
 */
export async function getContaAtual(): Promise<ContaAtual> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, isSuper: false, senhaTemporaria: false };

  const { data: eu } = await supabase
    .from("admin_user")
    .select("senha_temporaria, user_role")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    isSuper: eu?.user_role === "SUPER",
    senhaTemporaria: eu?.senha_temporaria ?? false,
  };
}
