"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
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
  await audit({ acao: "create", entidade: "tela", registroId: data.id });
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
  await audit({ acao: "update", entidade: "tela", registroId: id });
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
  await audit({
    acao: "update",
    entidade: "tela",
    registroId: id,
    diff: { status: habilitar ? "habilitada" : "desabilitada" },
  });
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
  await audit({ acao: "delete", entidade: "tela", registroId: id });
  revalidatePath("/telas");
  return { ok: true };
}
