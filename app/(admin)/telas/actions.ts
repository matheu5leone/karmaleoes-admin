"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { telaSchema, type TelaInput } from "@/lib/validation/telas";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function criarTela(input: TelaInput): Promise<ActionResult> {
  const parsed = telaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tela")
    .insert({ nome: parsed.data.nome, rota: parsed.data.rota })
    .select("id")
    .single();
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Rota já cadastrada." : error.message,
    };
  }
  revalidatePath("/telas");
  return { ok: true };
}

export async function editarTela(
  id: string,
  input: TelaInput,
): Promise<ActionResult> {
  const parsed = telaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("tela")
    .update({ nome: parsed.data.nome, rota: parsed.data.rota })
    .eq("id", id);
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Rota já cadastrada." : error.message,
    };
  }
  revalidatePath("/telas");
  return { ok: true };
}

export async function alternarStatusTela(
  id: string,
  habilitar: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tela")
    .update({ status: habilitar ? "habilitada" : "desabilitada" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/telas");
  return { ok: true };
}

export async function excluirTela(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("tela").delete().eq("id", id);
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23503"
          ? "Tela em uso (item de marquee ou banner). Remova os vínculos antes."
          : error.message,
    };
  }
  revalidatePath("/telas");
  return { ok: true };
}

export type ItemPendente = { titulo: string; marquee: string };
export type DesvincularResult =
  | { ok: true; banners: number; marquees: number; pendentes: ItemPendente[] }
  | { ok: false; error: string };

/**
 * Remove as associações da tela sem apagar nenhum cadastro: as linhas de
 * banner_tela e marquee_tela são o próprio vínculo, então some só a ligação —
 * banners e marquees continuam existindo.
 *
 * Itens de marquee com navegação interna ficam de fora por decisão de projeto:
 * o banco exige que item interno tenha tela de destino (CHECK + FK RESTRICT),
 * então "desvincular" ali significaria excluir o item ou convertê-lo em
 * externo. Em vez disso, devolvemos a lista para o usuário resolver.
 */
export async function desvincularTudo(
  telaId: string,
): Promise<DesvincularResult> {
  const supabase = await createClient();

  const [{ error: erroBanner, count: banners }, { error: erroMarquee, count: marquees }] =
    await Promise.all([
      supabase
        .from("banner_tela")
        .delete({ count: "exact" })
        .eq("tela_id", telaId),
      supabase
        .from("marquee_tela")
        .delete({ count: "exact" })
        .eq("tela_id", telaId),
    ]);
  const falha = erroBanner ?? erroMarquee;
  if (falha) return { ok: false, error: falha.message };

  const { data: itens } = await supabase
    .from("marquee_item")
    .select("titulo, marquee(nome)")
    .eq("tela_destino_id", telaId);

  const pendentes: ItemPendente[] = (
    (itens ?? []) as unknown as Array<{
      titulo: string;
      marquee: { nome: string } | null;
    }>
  ).map((i) => ({ titulo: i.titulo, marquee: i.marquee?.nome ?? "—" }));

  revalidatePath("/telas");
  return { ok: true, banners: banners ?? 0, marquees: marquees ?? 0, pendentes };
}
