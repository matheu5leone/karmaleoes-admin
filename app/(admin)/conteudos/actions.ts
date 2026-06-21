"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
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
    ordem: input.ordem,
    data: input.data || null,
  };
}

export async function criarConteudo(
  input: ConteudoInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const p = conteudoSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conteudo")
    .insert(montarRow(p.data))
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "create", entidade: "conteudo", registroId: data.id });
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
  await audit({ acao: "update", entidade: "conteudo", registroId: id });
  revalidatePath("/conteudos");
  return { ok: true };
}

export async function excluirConteudo(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("conteudo").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "delete", entidade: "conteudo", registroId: id });
  revalidatePath("/conteudos");
  return { ok: true };
}
