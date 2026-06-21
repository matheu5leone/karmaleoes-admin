"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { categoriaSchema, type CategoriaInput } from "@/lib/validation/conteudos";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function criarCategoria(
  input: CategoriaInput,
): Promise<ActionResult> {
  const p = categoriaSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categoria_conteudo")
    .insert({ nome: p.data.nome })
    .select("id")
    .single();
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Categoria já existe." : error.message,
    };
  }
  await audit({ acao: "create", entidade: "categoria_conteudo", registroId: data.id });
  revalidatePath("/conteudos/categorias");
  revalidatePath("/conteudos");
  return { ok: true };
}

export async function editarCategoria(
  id: string,
  input: CategoriaInput,
): Promise<ActionResult> {
  const p = categoriaSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("categoria_conteudo")
    .update({ nome: p.data.nome })
    .eq("id", id);
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Categoria já existe." : error.message,
    };
  }
  await audit({ acao: "update", entidade: "categoria_conteudo", registroId: id });
  revalidatePath("/conteudos/categorias");
  return { ok: true };
}

export async function excluirCategoria(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categoria_conteudo")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "delete", entidade: "categoria_conteudo", registroId: id });
  revalidatePath("/conteudos/categorias");
  revalidatePath("/conteudos");
  return { ok: true };
}
