import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";

const EXTENSOES_IMAGEM = new Set(["svg", "png", "jpg", "jpeg", "webp", "gif"]);

/** Lê os arquivos de imagem em /public/icons e devolve { name, extension }. */
export async function listIconFiles(): Promise<
  { name: string; extension: string }[]
> {
  try {
    const dir = path.join(process.cwd(), "public", "icons");
    const arquivos = await fs.readdir(dir);
    const out: { name: string; extension: string }[] = [];
    for (const f of arquivos) {
      const ext = path.extname(f).slice(1).toLowerCase();
      if (!EXTENSOES_IMAGEM.has(ext)) continue;
      out.push({ name: path.basename(f, path.extname(f)), extension: ext });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Registra na tabela `icons` os arquivos de /public/icons que ainda não existem.
 * Rodado no start da aplicação (ver instrumentation.ts): novos ícones colocados
 * na pasta viram opção no frontend sem cadastro manual.
 *
 * Idempotente e resiliente (nunca quebra o boot). Usa a service-role porque roda
 * fora do contexto de requisição. Como o banco é o mesmo em dev e produção,
 * sincronizar no dev local já propaga a opção para a produção.
 */
export async function syncIconsFromFolder(): Promise<void> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    const arquivos = await listIconFiles();
    if (arquivos.length === 0) return;

    const admin = createAdminClient();
    const { data: existentes } = await admin
      .from("icons")
      .select("name, extension");
    const jaTem = new Set(
      (existentes ?? []).map((r) => `${r.name}.${r.extension}`),
    );
    const novos = arquivos.filter((f) => !jaTem.has(`${f.name}.${f.extension}`));
    if (novos.length > 0) {
      await admin.from("icons").insert(novos);
    }
  } catch {
    // silencioso de propósito
  }
}
