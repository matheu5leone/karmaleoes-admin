"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bannerSchema, type BannerInput } from "@/lib/validation/banners";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function criarBanner(
  input: BannerInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const p = bannerSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("banner")
    .insert({ nome: p.data.nome, imagem: p.data.imagem })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/banners");
  return { ok: true, id: data.id };
}

export async function editarBanner(
  id: string,
  input: BannerInput,
): Promise<ActionResult> {
  const p = bannerSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("banner")
    .update({ nome: p.data.nome, imagem: p.data.imagem })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/banners");
  revalidatePath(`/banners/${id}`);
  return { ok: true };
}

export async function excluirBanner(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("banner").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/banners");
  return { ok: true };
}

/** Associa o banner a uma tela HABILITADA (RN-BANNER-008), criando em draft. */
export async function associarTela(
  bannerId: string,
  telaId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: tela } = await supabase
    .from("tela")
    .select("status")
    .eq("id", telaId)
    .single();
  if (!tela || tela.status !== "habilitada") {
    return { ok: false, error: "Só é possível associar a telas habilitadas." };
  }
  const { error } = await supabase
    .from("banner_tela")
    .insert({ banner_id: bannerId, tela_id: telaId, status: "draft" });
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Já associado a esta tela." : error.message,
    };
  }
  revalidatePath(`/banners/${bannerId}`);
  return { ok: true };
}

export async function removerAssociacao(
  bannerId: string,
  assocId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("banner_tela")
    .delete()
    .eq("id", assocId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/banners/${bannerId}`);
  return { ok: true };
}

/** Publica a associação (auto-revert da publicada anterior na mesma tela). */
export async function publicar(
  bannerId: string,
  assocId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("publicar_banner_tela", {
    assoc_id: assocId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/banners/${bannerId}`);
  return { ok: true };
}

export async function despublicar(
  bannerId: string,
  assocId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("banner_tela")
    .update({ status: "draft" })
    .eq("id", assocId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/banners/${bannerId}`);
  return { ok: true };
}
