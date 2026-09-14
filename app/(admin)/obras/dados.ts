import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ColecaoOpt, ColecaoRow, MusicaRow } from "./_components";

/** Músicas e coleções, ordenadas por lançamento (usado pelas duas páginas). */
export async function carregarObras() {
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
  return { musicasRows, colecoesRows, colecaoOpts };
}
