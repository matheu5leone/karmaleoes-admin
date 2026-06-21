"use server";

import { uploadImagem, type Bucket } from "@/lib/storage";

/** Server Action de upload de imagem (reutilizável pelo ImageUpload). */
export async function uploadImagemAction(
  bucket: Bucket,
  formData: FormData,
): Promise<
  { ok: true; url: string; path: string } | { ok: false; error: string }
> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione um arquivo." };
  }
  try {
    const { path, url } = await uploadImagem(bucket, file);
    return { ok: true, url, path };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Falha no upload.",
    };
  }
}
