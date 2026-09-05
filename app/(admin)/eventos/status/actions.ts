"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  statusEventoSchema,
  type StatusEventoInput,
} from "@/lib/validation/eventos";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function criarStatus(
  input: StatusEventoInput,
): Promise<ActionResult> {
  const p = statusEventoSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data: lc } = await supabase
    .from("status_lifecycles")
    .select("id")
    .eq("lifecycle", p.data.lifecycle)
    .single();
  if (!lc) return { ok: false, error: "Lifecycle inválido." };
  const { data, error } = await supabase
    .from("status_evento")
    .insert({ nome: p.data.nome, lifecycle_id: lc.id })
    .select("id")
    .single();
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Já existe um status com esse nome." : error.message,
    };
  }
  revalidatePath("/eventos/status");
  return { ok: true };
}

export async function editarStatus(
  id: string,
  input: StatusEventoInput,
): Promise<ActionResult> {
  const p = statusEventoSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();

  const { data: atual } = await supabase
    .from("status_evento")
    .select("protegido")
    .eq("id", id)
    .single();
  if (atual?.protegido) {
    return { ok: false, error: "Status protegido não pode ser editado." };
  }

  const { data: lc } = await supabase
    .from("status_lifecycles")
    .select("id")
    .eq("lifecycle", p.data.lifecycle)
    .single();
  if (!lc) return { ok: false, error: "Lifecycle inválido." };
  const { error } = await supabase
    .from("status_evento")
    .update({ nome: p.data.nome, lifecycle_id: lc.id })
    .eq("id", id);
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Já existe um status com esse nome." : error.message,
    };
  }
  revalidatePath("/eventos/status");
  return { ok: true };
}

export async function excluirStatus(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("status_evento")
    .select("protegido")
    .eq("id", id)
    .single();
  if (atual?.protegido) {
    return { ok: false, error: "Status protegido não pode ser excluído." };
  }
  const { error } = await supabase.from("status_evento").delete().eq("id", id);
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23503"
          ? "Status em uso por eventos — não pode ser excluído."
          : error.message,
    };
  }
  revalidatePath("/eventos/status");
  return { ok: true };
}
