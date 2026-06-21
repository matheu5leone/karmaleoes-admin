import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export type AuditAcao = "create" | "update" | "delete";

export interface AuditParams {
  acao: AuditAcao;
  entidade: string;
  registroId?: string | null;
  diff?: Json | null;
}

/**
 * Registra um log de auditoria de ESCRITA (RF-LOGIN-006).
 * Chamado dentro de toda Server Action de create/update/delete (módulos 1–6).
 * Resolve o usuário responsável a partir da sessão (Supabase Auth) no server.
 * Ver docs/arquitetura/transversal-auditoria.md.
 */
export async function audit({
  acao,
  entidade,
  registroId = null,
  diff = null,
}: AuditParams): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("audit_log").insert({
    user_id: user?.id ?? null,
    acao,
    entidade,
    registro_id: registroId,
    diff,
  });
}
