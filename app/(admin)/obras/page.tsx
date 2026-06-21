import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ObrasManager,
  type ColecaoOpt,
  type ColecaoRow,
  type MusicaRow,
} from "./_components";

export default async function ObrasPage() {
  const supabase = await createClient();
  const [{ data: musicas }, { data: colecoes }] = await Promise.all([
    supabase
      .from("musica")
      .select(
        "id, nome, data_lancamento, duracao, isrc, cover_image, colecao_id, colecao(nome)",
      )
      .order("data_lancamento", { ascending: false, nullsFirst: false })
      .order("nome", { ascending: true }),
    supabase
      .from("colecao")
      .select("id, nome, descricao, tipo, cover_image, data_lancamento")
      .order("data_lancamento", { ascending: false, nullsFirst: false })
      .order("nome", { ascending: true }),
  ]);

  const mrows = (musicas ?? []) as Array<
    Omit<MusicaRow, "colecaoNome"> & { colecao: { nome: string } | null }
  >;
  const musicasRows: MusicaRow[] = mrows.map((m) => ({
    ...m,
    colecaoNome: m.colecao?.nome ?? null,
  }));
  const colecoesRows = (colecoes ?? []) as ColecaoRow[];
  const colecaoOpts: ColecaoOpt[] = colecoesRows.map((c) => ({
    id: c.id,
    nome: c.nome,
  }));

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Obras</h1>
          <p className="mb-6 mt-1 text-muted-foreground">
            Músicas e coleções, ordenadas por lançamento.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/obras/colaboradores" className="text-sm text-brand hover:underline">
            Colaboradores
          </Link>
          <Link href="/obras/roles" className="text-sm text-brand hover:underline">
            Papéis
          </Link>
        </div>
      </div>
      <ObrasManager
        musicas={musicasRows}
        colecoes={colecoesRows}
        colecaoOpts={colecaoOpts}
      />
    </div>
  );
}
