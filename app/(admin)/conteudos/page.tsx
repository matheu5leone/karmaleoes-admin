import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ConteudosManager, type CategoriaOpt, type ConteudoRow } from "./_components";

export default async function ConteudosPage() {
  const supabase = await createClient();
  const [{ data: conteudos }, { data: categorias }] = await Promise.all([
    supabase
      .from("conteudo")
      .select(
        "id, titulo, descricao, thumbnail, categoria_id, tipo, plataforma, link, status, destaque, ordem, data, categoria_conteudo(nome)",
      )
      .order("ordem", { ascending: true })
      .order("titulo", { ascending: true }),
    supabase
      .from("categoria_conteudo")
      .select("id, nome")
      .order("nome", { ascending: true }),
  ]);

  const rows = (conteudos ?? []) as Array<
    Omit<ConteudoRow, "categoriaNome"> & {
      categoria_conteudo: { nome: string } | null;
    }
  >;
  const lista: ConteudoRow[] = rows.map((c) => ({
    ...c,
    categoriaNome: c.categoria_conteudo?.nome ?? null,
  }));

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Conteúdos</h1>
          <p className="mb-6 mt-1 text-muted-foreground">
            Curadoria de conteúdos externos. Só <code>publicado</code> aparece no
            Hub.
          </p>
        </div>
        <Link
          href="/conteudos/categorias"
          className="text-sm text-brand hover:underline"
        >
          Gerenciar categorias
        </Link>
      </div>
      <ConteudosManager
        conteudos={lista}
        categorias={(categorias ?? []) as CategoriaOpt[]}
      />
    </div>
  );
}
