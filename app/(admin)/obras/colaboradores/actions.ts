"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { colaboradorSchema, type ColaboradorInput } from "@/lib/validation/obras";

export type ActionResult = { ok: true } | { ok: false; error: string };

function montar(input: ColaboradorInput) {
  return {
    nome: input.nome,
    instagram: input.instagram || null,
    linkedin: input.linkedin || null,
    descricao: input.descricao || null,
  };
}

export async function criarColaborador(
  input: ColaboradorInput,
): Promise<ActionResult> {
  const p = colaboradorSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("colaborador")
    .insert(montar(p.data))
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "create", entidade: "colaborador", registroId: data.id });
  revalidatePath("/obras/colaboradores");
  return { ok: true };
}

export async function editarColaborador(
  id: string,
  input: ColaboradorInput,
): Promise<ActionResult> {
  const p = colaboradorSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("colaborador")
    .update(montar(p.data))
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "update", entidade: "colaborador", registroId: id });
  revalidatePath("/obras/colaboradores");
  return { ok: true };
}

export async function excluirColaborador(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("colaborador").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "delete", entidade: "colaborador", registroId: id });
  revalidatePath("/obras/colaboradores");
  return { ok: true };
}
