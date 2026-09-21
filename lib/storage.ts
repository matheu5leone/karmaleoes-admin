import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type { Bucket } from "@/lib/storage-tipos";
import { erroDoArquivo } from "@/lib/upload-formatos";

export type { Bucket } from "@/lib/storage-tipos";
export { MAX_IMAGE_BYTES } from "@/lib/upload-formatos";

/** Sobe uma imagem ao bucket e devolve path + URL pública. Valida tipo e tamanho. */
export async function uploadImagem(
  bucket: Bucket,
  file: File,
): Promise<{ path: string; url: string }> {
  // Mesma checagem do cliente, refeita aqui: o cliente é só conveniência.
  const erro = erroDoArquivo(bucket, file);
  if (erro) throw new Error(erro);

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
