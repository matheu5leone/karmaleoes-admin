import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CategoriasEventoManager, type CategoriaEventoRow } from "./_components";

export default async function CategoriasEventoPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("category")
    .select("id, name, lifecycle")
    .order("name", { ascending: true });

  return (
    <div>
      <Link href="/eventos" className="text-sm text-brand hover:underline">
        ← Eventos
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Categorias de evento
      </h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Agrupamentos de eventos (ex.: Show, Festival, Encontro).
      </p>
      <CategoriasEventoManager
        categorias={(data ?? []) as CategoriaEventoRow[]}
      />
    </div>
  );
}
