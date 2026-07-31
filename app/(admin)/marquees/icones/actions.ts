"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { iconSchema, type IconInput } from "@/lib/validation/marquees";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function criarIcon(input: IconInput): Promise<ActionResult> {
  const p = iconSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("icons")
    .insert({ name: p.data.name, extension: p.data.extension.toLowerCase() })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "create", entidade: "icons", registroId: data.id });
  revalidatePath("/marquees/icones");
  return { ok: true };
}

export async function editarIcon(
  id: string,
  input: IconInput,
): Promise<ActionResult> {
  const p = iconSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("icons")
    .update({ name: p.data.name, extension: p.data.extension.toLowerCase() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "update", entidade: "icons", registroId: id });
  revalidatePath("/marquees/icones");
  return { ok: true };
}

export async function excluirIcon(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("icons").delete().eq("id", id);
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23503"
          ? "Ícone em uso por itens de marquee — não pode ser excluído."
          : error.message,
    };
  }
  await audit({ acao: "delete", entidade: "icons", registroId: id });
  revalidatePath("/marquees/icones");
  return { ok: true };
}
