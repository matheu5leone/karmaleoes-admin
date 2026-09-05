"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { conteudoSchema, type ConteudoInput } from "@/lib/validation/conteudos";

export type ActionResult = { ok: true } | { ok: false; error: string };

function montarRow(input: ConteudoInput) {
  return {
    titulo: input.titulo,
    descricao: input.descricao || null,
    thumbnail: input.thumbnail || null,
    categoria_id: input.categoria_id || null,
    tipo: input.tipo,
    plataforma: input.plataforma || null,
    link: input.link,
    status: input.status,
    destaque: input.destaque,
    data: input.data || null,
  };
}

export async function criarConteudo(
  input: ConteudoInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const p = conteudoSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  // A posição não vem mais do formulário: conteúdo novo entra no fim.
  const { data: ultimo } = await supabase
    .from("conteudo")
    .select("ordem")
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from("conteudo")
    .insert({ ...montarRow(p.data), ordem: (ultimo?.ordem ?? -1) + 1 })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/conteudos");
  return { ok: true, id: data.id };
}

export async function editarConteudo(
  id: string,
  input: ConteudoInput,
): Promise<ActionResult> {
  const p = conteudoSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("conteudo")
    .update(montarRow(p.data))
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/conteudos");
  return { ok: true };
}

export async function excluirConteudo(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("conteudo").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/conteudos");
  return { ok: true };
}

/** Troca a posição de um conteúdo com o vizinho (a ordem saiu do formulário). */
export async function moverConteudo(
  id: string,
  direcao: "cima" | "baixo",
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("conteudo")
    .select("id, ordem")
    .eq("id", id)
    .single();
  if (!atual) return { ok: false, error: "Conteúdo não encontrado." };

  const { data: vizinho } = await supabase
    .from("conteudo")
    .select("id, ordem")
    .order("ordem", { ascending: direcao === "baixo" })
    [direcao === "baixo" ? "gt" : "lt"]("ordem", atual.ordem)
    .limit(1)
    .maybeSingle();
  if (!vizinho) return { ok: true }; // já está na ponta

  const [a, b] = await Promise.all([
    supabase.from("conteudo").update({ ordem: vizinho.ordem }).eq("id", atual.id),
    supabase.from("conteudo").update({ ordem: atual.ordem }).eq("id", vizinho.id),
  ]);
  const falha = a.error ?? b.error;
  if (falha) return { ok: false, error: falha.message };
  revalidatePath("/conteudos");
  return { ok: true };
}
