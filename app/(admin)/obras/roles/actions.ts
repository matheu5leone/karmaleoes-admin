"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { roleSchema, type RoleInput } from "@/lib/validation/obras";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function criarRole(input: RoleInput): Promise<ActionResult> {
  const p = roleSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("role")
    .insert({ nome: p.data.nome })
    .select("id")
    .single();
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Papel já existe." : error.message,
    };
  }
  await audit({ acao: "create", entidade: "role", registroId: data.id });
  revalidatePath("/obras/roles");
  return { ok: true };
}

export async function editarRole(
  id: string,
  input: RoleInput,
): Promise<ActionResult> {
  const p = roleSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("role")
    .update({ nome: p.data.nome })
    .eq("id", id);
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Papel já existe." : error.message,
    };
  }
  await audit({ acao: "update", entidade: "role", registroId: id });
  revalidatePath("/obras/roles");
  return { ok: true };
}

export async function excluirRole(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("role").delete().eq("id", id);
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23503"
          ? "Papel em uso por vínculos — não pode ser excluído."
          : error.message,
    };
  }
  await audit({ acao: "delete", entidade: "role", registroId: id });
  revalidatePath("/obras/roles");
  return { ok: true };
}
