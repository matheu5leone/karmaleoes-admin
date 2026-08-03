import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isRootAdmin } from "@/lib/root-admin";
import { HistoricoTimeline, type LogRow } from "./_components";

/** Quantos registros a tela carrega por vez. */
const LIMITE = 200;

export default async function HistoricoPage() {
  // A leitura já é barrada pela RLS (migration 0015); aqui é a guarda de rota.
  if (!(await isRootAdmin())) notFound();

  const supabase = await createClient();
  const [{ data: logs }, { data: admins }] = await Promise.all([
    supabase
      .from("audit_log")
      .select("id, acao, entidade, registro_id, diff, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMITE),
    supabase.from("admin_user").select("id, email"),
  ]);

  const emailPorId = new Map(
    (admins ?? []).map((a) => [a.id, a.email] as const),
  );

  const lista: LogRow[] = (logs ?? []).map((l) => ({
    id: l.id,
    acao: l.acao,
    entidade: l.entidade,
    registroId: l.registro_id,
    diff: l.diff as Record<string, unknown> | null,
    autor: l.user_id ? (emailPorId.get(l.user_id) ?? "—") : "sistema",
    createdAt: l.created_at,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Trilha de auditoria das escritas no painel. Visível apenas para o
        administrador raiz. Mostrando os {LIMITE} registros mais recentes.
      </p>
      <HistoricoTimeline logs={lista} />
    </div>
  );
}
