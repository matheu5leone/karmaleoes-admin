import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getContaAtual } from "@/lib/conta";
import { NovoUsuario, UsuariosTable, type Usuario } from "./_components";

export default async function UsuariosPage() {
  // Gestão de usuários é exclusiva do papel SUPER (a RLS da 0020 também barra).
  if (!(await getContaAtual()).isSuper) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_user")
    .select("id, email, telefone, status, two_factor_configured, user_role")
    .order("created_at", { ascending: true });

  const usuarios = (data ?? []) as Usuario[];
  // Protegidos: contas com papel SUPER (definido no dashboard do Supabase).
  const protectedIds = usuarios
    .filter((u) => u.user_role === "SUPER")
    .map((u) => u.id);

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
