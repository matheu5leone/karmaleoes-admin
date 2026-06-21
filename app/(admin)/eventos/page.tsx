import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EventosManager, type EventoRow, type StatusOpt } from "./_components";

export default async function EventosPage() {
  const supabase = await createClient();
  const [{ data: eventos }, { data: statuses }] = await Promise.all([
    supabase
      .from("eventos_view")
      .select(
        "id, nome, data, horario, local, organizador, categoria, descricao, link_externo, lifecycle, status_id, status_efetivo, enable, enable_efetivo, prioridade, nova_data",
      )
      .order("prioridade", { ascending: false })
      .order("data", { ascending: true }),
    supabase
      .from("status_evento")
      .select("id, nome, lifecycle")
      .order("nome", { ascending: true }),
  ]);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Eventos</h1>
          <p className="mb-6 mt-1 text-muted-foreground">
            Visibilidade no Hub via <code>enable_efetivo</code> (não expirado).
          </p>
        </div>
        <Link
          href="/eventos/status"
          className="text-sm text-brand hover:underline"
        >
          Gerenciar status
        </Link>
      </div>
      <EventosManager
        eventos={(eventos ?? []) as EventoRow[]}
        statuses={(statuses ?? []) as StatusOpt[]}
      />
    </div>
  );
}
