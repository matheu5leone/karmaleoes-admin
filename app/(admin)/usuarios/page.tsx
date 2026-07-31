import { createClient } from "@/lib/supabase/server";
import { NovoUsuario, UsuariosTable, type Usuario } from "./_components";

export default async function UsuariosPage() {
  const supabase = await createClient();
  const [{ data }, { data: auth }] = await Promise.all([
    supabase
      .from("admin_user")
      .select("id, email, telefone, status, two_factor_configured")
      .order("created_at", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const usuarios = (data ?? []) as Usuario[];
  // Protegidos: o 1º admin (mais antigo) e o próprio usuário logado não podem
  // ser desativados (evita se trancar pra fora / derrubar o admin raiz).
  const protectedIds = [usuarios[0]?.id, auth.user?.id].filter(
    (v): v is string => Boolean(v),
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Gestão de usuários administrativos. O e-mail é imutável após o cadastro.
      </p>
      <NovoUsuario />
      <UsuariosTable usuarios={usuarios} protectedIds={protectedIds} />
    </div>
  );
}
