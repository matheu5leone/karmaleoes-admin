import { createClient } from "@/lib/supabase/server";
import { NovoUsuario, UsuariosTable, type Usuario } from "./_components";

export default async function UsuariosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_user")
    .select("id, email, telefone, status, two_factor_configured")
    .order("created_at", { ascending: true });

  const usuarios = (data ?? []) as Usuario[];
  // Protegido: SOMENTE o admin raiz (o mais antigo). A autoproteção foi
  // removida a pedido — um admin pode se desativar e ficar trancado do lado de
  // fora; nesse caso outro admin reativa.
  const protectedIds = [usuarios[0]?.id].filter(
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
