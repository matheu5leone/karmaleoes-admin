"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import {
  encerramentoSchema,
  eventoSchema,
  hojeSaoPaulo,
  sucessoPermitido,
  type EncerramentoInput,
  type EventoInput,
} from "@/lib/validation/eventos";

export type ActionResult = { ok: true } | { ok: false; error: string };

type StatusRow = { nome: string; status_lifecycles: { lifecycle: string } | null };

function montarRow(input: EventoInput) {
  return {
    nome: input.nome,
    descricao: input.descricao || null,
    category_id: input.category_id || null,
    data: input.data,
    horario: input.horario || null,
    local: input.local || null,
    organizador: input.organizador || null,
    link_externo: input.link_externo || null,
    status_id: input.status_id,
    prioridade: input.prioridade,
    nova_data: input.nova_data || null,
  };
}

export async function criarEvento(
  input: EventoInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const p = eventoSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();

  const { data: status } = await supabase
    .from("status_evento")
    .select("nome, status_lifecycles(lifecycle)")
    .eq("id", p.data.status_id)
    .single<StatusRow>();
  if (!status || status.status_lifecycles?.lifecycle !== "Em aberto") {
    return { ok: false, error: "Evento é criado com status 'Em aberto'." };
  }
  if (status.nome === "Adiado" && !p.data.nova_data) {
    return { ok: false, error: "Status 'Adiado' exige a nova data." };
  }

  const { data, error } = await supabase
    .from("evento")
    .insert({ ...montarRow(p.data), lifecycle: "Em aberto", enable: false })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "create", entidade: "evento", registroId: data.id });
  revalidatePath("/eventos");
  return { ok: true, id: data.id };
}

export async function editarEvento(
  id: string,
  input: EventoInput,
): Promise<ActionResult> {
  const p = eventoSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();

  const { data: evento } = await supabase
    .from("evento")
    .select("lifecycle")
    .eq("id", id)
    .single();
  const { data: status } = await supabase
    .from("status_evento")
    .select("nome, status_lifecycles(lifecycle)")
    .eq("id", p.data.status_id)
    .single<StatusRow>();
  if (
    !evento ||
    !status ||
    status.status_lifecycles?.lifecycle !== evento.lifecycle
  ) {
    return { ok: false, error: "Status deve pertencer ao lifecycle atual." };
  }
  if (status.nome === "Adiado" && !p.data.nova_data) {
    return { ok: false, error: "Status 'Adiado' exige a nova data." };
  }

  const { error } = await supabase
    .from("evento")
    .update(montarRow(p.data))
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "update", entidade: "evento", registroId: id });
  revalidatePath("/eventos");
  return { ok: true };
}

/** Habilita/desabilita o evento (enable), manual a qualquer hora (RF-009/RN-012). */
export async function setEnable(
  id: string,
  enable: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("evento").update({ enable }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({
    acao: "update",
    entidade: "evento",
    registroId: id,
    diff: { enable },
  });
  revalidatePath("/eventos");
  return { ok: true };
}

/** Encerramento manual (RF-EVENTO-006). Não altera enable (RN-011). */
export async function encerrarEvento(
  id: string,
  input: EncerramentoInput,
): Promise<ActionResult> {
  const p = encerramentoSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();

  const { data: status } = await supabase
    .from("status_evento")
    .select("nome, status_lifecycles(lifecycle)")
    .eq("id", p.data.status_id)
    .single<StatusRow>();
  if (!status || status.status_lifecycles?.lifecycle !== "Encerrado") {
    return { ok: false, error: "Selecione um status de encerramento." };
  }

  // Sucesso só na data de referência ou depois (RN-014).
  if (status.nome === "Sucesso") {
    const { data: vw } = await supabase
      .from("eventos_view")
      .select("data_referencia")
      .eq("id", id)
      .single();
    if (vw?.data_referencia && !sucessoPermitido(vw.data_referencia, hojeSaoPaulo())) {
      return {
        ok: false,
        error: "Sucesso só é permitido na data de referência ou depois.",
      };
    }
  }

  const { error } = await supabase
    .from("evento")
    .update({
      lifecycle: "Encerrado",
      status_id: p.data.status_id,
      obs_encerramento: p.data.obs_encerramento,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({
    acao: "update",
    entidade: "evento",
    registroId: id,
    diff: { lifecycle: "Encerrado", status: status.nome },
  });
  revalidatePath("/eventos");
  return { ok: true };
}

export async function excluirEvento(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("evento").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "delete", entidade: "evento", registroId: id });
  revalidatePath("/eventos");
  return { ok: true };
}
