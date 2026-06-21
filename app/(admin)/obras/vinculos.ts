"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import {
  linkSchema,
  vinculoSchema,
  type LinkInput,
  type ObraTipo,
  type VinculoInput,
} from "@/lib/validation/obras";

export type ActionResult = { ok: true } | { ok: false; error: string };

function obraRef(tipo: ObraTipo, id: string) {
  return tipo === "musica" ? { musica_id: id } : { colecao_id: id };
}

export async function vincularColaborador(
  tipo: ObraTipo,
  obraId: string,
  input: VinculoInput,
): Promise<ActionResult> {
  const p = vinculoSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obra_colaborador")
    .insert({
      ...obraRef(tipo, obraId),
      colaborador_id: p.data.colaborador_id,
      role_id: p.data.role_id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "create", entidade: "obra_colaborador", registroId: data.id });
  revalidatePath(`/obras/${tipo}/${obraId}`);
  return { ok: true };
}

export async function removerColaborador(
  tipo: ObraTipo,
  obraId: string,
  vinculoId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("obra_colaborador")
    .delete()
    .eq("id", vinculoId);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "delete", entidade: "obra_colaborador", registroId: vinculoId });
  revalidatePath(`/obras/${tipo}/${obraId}`);
  return { ok: true };
}

export async function adicionarLink(
  tipo: ObraTipo,
  obraId: string,
  input: LinkInput,
): Promise<ActionResult> {
  const p = linkSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("link_plataforma")
    .insert({ ...obraRef(tipo, obraId), plataforma: p.data.plataforma, url: p.data.url })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "create", entidade: "link_plataforma", registroId: data.id });
  revalidatePath(`/obras/${tipo}/${obraId}`);
  return { ok: true };
}

export async function removerLink(
  tipo: ObraTipo,
  obraId: string,
  linkId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("link_plataforma")
    .delete()
    .eq("id", linkId);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "delete", entidade: "link_plataforma", registroId: linkId });
  revalidatePath(`/obras/${tipo}/${obraId}`);
  return { ok: true };
}
