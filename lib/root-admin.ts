import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * True se o usuário logado é o administrador **raiz** — o mais antigo em
 * `admin_user` (o criado pelo seed). Espelha a função `is_root_admin()` do banco,
 * que é quem de fato restringe a leitura de `audit_log` (migration 0015).
 */
export async function isRootAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: primeiro },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("admin_user")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .single(),
  ]);
  return !!user && !!primeiro && primeiro.id === user.id;
}
