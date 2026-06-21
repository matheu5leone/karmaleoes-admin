import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RolesManager, type RoleRow } from "./_components";

export default async function RolesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("role")
    .select("id, nome")
    .order("nome", { ascending: true });

  return (
    <div>
      <Link href="/obras" className="text-sm text-brand hover:underline">
        ← Obras
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Papéis (roles)
      </h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Tipos de participação (feat, produtor, compositor, mixing engineer…).
      </p>
      <RolesManager roles={(data ?? []) as RoleRow[]} />
    </div>
  );
}
