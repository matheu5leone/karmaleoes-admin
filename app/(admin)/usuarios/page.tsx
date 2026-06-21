import { createClient } from "@/lib/supabase/server";
import { NovoUsuario, UsuariosTable, type Usuario } from "./_components";

export default async function UsuariosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_user")
    .select("id, email, telefone, status, two_factor_configured")
    .order("created_at", { ascending: true });

  const usuarios = (data ?? []) as Usuario[];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Gestão de usuários administrativos. O e-mail é imutável após o cadastro.
      </p>
      <NovoUsuario />
      <UsuariosTable usuarios={usuarios} />
    </div>
  );
}
