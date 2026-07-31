"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import {
  itemSchema,
  marqueeSchema,
  type ItemInput,
  type MarqueeInput,
} from "@/lib/validation/marquees";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function criarMarquee(
  input: MarqueeInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const p = marqueeSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marquee")
    .insert({
      nome: p.data.nome,
      props_visuais: {
        cor_fundo: p.data.cor_fundo || null,
        cor_texto: p.data.cor_texto || null,
      },
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "create", entidade: "marquee", registroId: data.id });
  revalidatePath("/marquees");
  return { ok: true, id: data.id };
}

export async function editarMarquee(
  id: string,
  input: MarqueeInput,
): Promise<ActionResult> {
  const p = marqueeSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("marquee")
    .update({
      nome: p.data.nome,
      props_visuais: {
        cor_fundo: p.data.cor_fundo || null,
        cor_texto: p.data.cor_texto || null,
      },
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "update", entidade: "marquee", registroId: id });
  revalidatePath(`/marquees/${id}`);
  revalidatePath("/marquees");
  return { ok: true };
}

export async function excluirMarquee(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("marquee").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "delete", entidade: "marquee", registroId: id });
  revalidatePath("/marquees");
  return { ok: true };
}

export async function associarTelas(
  marqueeId: string,
  telaIds: string[],
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("marquee_tela")
    .select("id, tela_id")
    .eq("marquee_id", marqueeId);

  const want = new Set(telaIds);
  const have = new Map((existing ?? []).map((e) => [e.tela_id, e.id]));

  const toRemove = (existing ?? [])
    .filter((e) => !want.has(e.tela_id))
    .map((e) => e.id);
  const toAdd = telaIds.filter((t) => !have.has(t));

  if (toRemove.length) {
    await supabase.from("marquee_tela").delete().in("id", toRemove);
  }
  if (toAdd.length) {
    const { error } = await supabase
      .from("marquee_tela")
      .insert(toAdd.map((t) => ({ marquee_id: marqueeId, tela_id: t })));
    if (error) return { ok: false, error: error.message };
  }
  await audit({
    acao: "update",
    entidade: "marquee",
    registroId: marqueeId,
    diff: { telas: telaIds },
  });
  revalidatePath(`/marquees/${marqueeId}`);
  return { ok: true };
}

export async function salvarItem(
  marqueeId: string,
  itemId: string | null,
  input: ItemInput,
): Promise<ActionResult> {
  const p = itemSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();

  // Navegação interna só para tela habilitada (RF-NAV-011 / RN-NAV-004).
  if (p.data.tipo_nav === "interno") {
    const { data: tela } = await supabase
      .from("tela")
      .select("status")
      .eq("id", p.data.tela_destino_id!)
      .single();
    if (!tela || tela.status !== "habilitada") {
      return { ok: false, error: "A tela de destino precisa estar habilitada." };
    }
  }

  const row = {
    marquee_id: marqueeId,
    titulo: p.data.titulo,
    icon_id: p.data.icon_id || null,
    tipo_nav: p.data.tipo_nav,
    tela_destino_id:
      p.data.tipo_nav === "interno" ? p.data.tela_destino_id! : null,
    url_externa: p.data.tipo_nav === "externo" ? p.data.url_externa! : null,
    ordem: p.data.ordem,
  };

  if (itemId) {
    const { error } = await supabase
      .from("marquee_item")
      .update(row)
      .eq("id", itemId);
    if (error) return { ok: false, error: error.message };
    await audit({ acao: "update", entidade: "marquee_item", registroId: itemId });
  } else {
    const { data, error } = await supabase
      .from("marquee_item")
      .insert(row)
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    await audit({ acao: "create", entidade: "marquee_item", registroId: data.id });
  }
  revalidatePath(`/marquees/${marqueeId}`);
  return { ok: true };
}

export async function excluirItem(
  marqueeId: string,
  itemId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("marquee_item")
    .delete()
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "delete", entidade: "marquee_item", registroId: itemId });
  revalidatePath(`/marquees/${marqueeId}`);
  return { ok: true };
}
