import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CategoriasManager, type CategoriaRow } from "./_components";

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categoria_conteudo")
    .select("id, nome")
    .order("nome", { ascending: true });

  return (
    <div>
      <Link href="/conteudos" className="text-sm text-brand hover:underline">
        ← Conteúdos
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Categorias de conteúdo
      </h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Agrupamentos temáticos (ex.: Bastidores, Lançamentos, Exclusivos).
      </p>
      <CategoriasManager categorias={(data ?? []) as CategoriaRow[]} />
    </div>
  );
}
