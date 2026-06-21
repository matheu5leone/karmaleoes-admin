import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

// Buckets por domínio (ver transversal-storage-imagens.md). Só `marquees` existe
// no Plano 02; os demais entram com seus módulos.
export type Bucket = "marquees" | "banners" | "conteudos" | "obras";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** Sobe uma imagem ao bucket e devolve path + URL pública. Valida tipo e tamanho. */
export async function uploadImagem(
  bucket: Bucket,
  file: File,
): Promise<{ path: string; url: string }> {
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error("Formato inválido (use PNG, JPG, WEBP ou GIF).");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Imagem muito grande (máx. 5 MB).");
  }

  const supabase = await createClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

/** Remove uma imagem do bucket (evita órfãos ao trocar/excluir). */
export async function removerImagem(bucket: Bucket, path: string): Promise<void> {
  const supabase = await createClient();
  await supabase.storage.from(bucket).remove([path]);
}
