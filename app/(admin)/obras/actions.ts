"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import {
  colecaoSchema,
  musicaSchema,
  type ColecaoInput,
  type MusicaInput,
} from "@/lib/validation/obras";

export type ActionResult = { ok: true } | { ok: false; error: string };

// ---- Músicas ----
export async function criarMusica(
  input: MusicaInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const p = musicaSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("musica")
    .insert({
      nome: p.data.nome,
      data_lancamento: p.data.data_lancamento || null,
      duracao: p.data.duracao ?? null,
      isrc: p.data.isrc || null,
      cover_image: p.data.cover_image || null,
      colecao_id: p.data.colecao_id || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "create", entidade: "musica", registroId: data.id });
  revalidatePath("/obras");
  return { ok: true, id: data.id };
}

export async function editarMusica(
  id: string,
  input: MusicaInput,
): Promise<ActionResult> {
  const p = musicaSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("musica")
    .update({
      nome: p.data.nome,
      data_lancamento: p.data.data_lancamento || null,
      duracao: p.data.duracao ?? null,
      isrc: p.data.isrc || null,
      cover_image: p.data.cover_image || null,
      colecao_id: p.data.colecao_id || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "update", entidade: "musica", registroId: id });
  revalidatePath("/obras");
  revalidatePath(`/obras/musica/${id}`);
  return { ok: true };
}

export async function excluirMusica(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("musica").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "delete", entidade: "musica", registroId: id });
  revalidatePath("/obras");
  return { ok: true };
}

// ---- Coleções ----
export async function criarColecao(
  input: ColecaoInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const p = colecaoSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("colecao")
    .insert({
      nome: p.data.nome,
      descricao: p.data.descricao || null,
      tipo: p.data.tipo,
      cover_image: p.data.cover_image || null,
      data_lancamento: p.data.data_lancamento || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "create", entidade: "colecao", registroId: data.id });
  revalidatePath("/obras");
  return { ok: true, id: data.id };
}

export async function editarColecao(
  id: string,
  input: ColecaoInput,
): Promise<ActionResult> {
  const p = colecaoSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("colecao")
    .update({
      nome: p.data.nome,
      descricao: p.data.descricao || null,
      tipo: p.data.tipo,
      cover_image: p.data.cover_image || null,
      data_lancamento: p.data.data_lancamento || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "update", entidade: "colecao", registroId: id });
  revalidatePath("/obras");
  revalidatePath(`/obras/colecao/${id}`);
  return { ok: true };
}

export async function excluirColecao(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("colecao").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "delete", entidade: "colecao", registroId: id });
  revalidatePath("/obras");
  return { ok: true };
}
