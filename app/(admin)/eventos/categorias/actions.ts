"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  categoriaEventoSchema,
  type CategoriaEventoInput,
} from "@/lib/validation/eventos";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function criarCategoriaEvento(
  input: CategoriaEventoInput,
): Promise<ActionResult> {
  const p = categoriaEventoSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("category")
    .insert({ name: p.data.name, lifecycle: p.data.lifecycle || null })
    .select("id")
    .single();
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Categoria já existe." : error.message,
    };
  }
  revalidatePath("/eventos/categorias");
  revalidatePath("/eventos");
  return { ok: true };
}

export async function editarCategoriaEvento(
  id: string,
  input: CategoriaEventoInput,
): Promise<ActionResult> {
  const p = categoriaEventoSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("category")
    .update({ name: p.data.name, lifecycle: p.data.lifecycle || null })
    .eq("id", id);
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Categoria já existe." : error.message,
    };
  }
  revalidatePath("/eventos/categorias");
  return { ok: true };
}

export async function excluirCategoriaEvento(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("category").delete().eq("id", id);
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23503"
          ? "Categoria em uso por eventos — não pode ser excluída."
          : error.message,
    };
  }
  revalidatePath("/eventos/categorias");
  revalidatePath("/eventos");
  return { ok: true };
}
