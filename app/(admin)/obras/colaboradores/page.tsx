import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ColaboradoresManager, type ColaboradorRow } from "./_components";

export default async function ColaboradoresPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("colaborador")
    .select("id, nome, instagram, linkedin, descricao")
    .order("nome", { ascending: true });

  return (
    <div>
      <Link href="/obras" className="text-sm text-brand hover:underline">
        ← Obras
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Colaboradores
      </h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Participantes das obras (feat, produtor, compositor…).
      </p>
      <ColaboradoresManager
        colaboradores={(data ?? []) as ColaboradorRow[]}
      />
    </div>
  );
}
