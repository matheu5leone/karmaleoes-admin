import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  EventosManager,
  type CategoriaOpt,
  type EventoRow,
  type StatusOpt,
} from "./_components";

export default async function EventosPage() {
  const supabase = await createClient();
  const [{ data: eventos }, { data: statuses }, { data: categorias }] =
    await Promise.all([
      supabase
        .from("eventos_view")
        .select(
          "id, nome, data, horario, local, organizador, category_id, category_name, descricao, link_externo, lifecycle, status_id, status_efetivo, enable, enable_efetivo, prioridade, nova_data",
        )
        .order("prioridade", { ascending: false })
        .order("data", { ascending: true }),
      supabase
        .from("status_evento")
        .select("id, nome, status_lifecycles(lifecycle)")
        .order("nome", { ascending: true }),
      supabase
        .from("category")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

  const statusOpts: StatusOpt[] = (statuses ?? []).map((s) => ({
    id: s.id,
    nome: s.nome,
    lifecycle:
      (s.status_lifecycles as { lifecycle: string } | null)?.lifecycle ?? "",
  }));

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Eventos</h1>
          <p className="mb-6 mt-1 text-muted-foreground">
            Visibilidade no Hub via <code>enable_efetivo</code> (não expirado).
          </p>
        </div>
        <div className="flex shrink-0 gap-4">
          <Link
            href="/eventos/categorias"
            className="text-sm text-brand hover:underline"
          >
            Categorias
          </Link>
          <Link
            href="/eventos/status"
            className="text-sm text-brand hover:underline"
          >
            Status
          </Link>
        </div>
      </div>
      <EventosManager
        eventos={(eventos ?? []) as EventoRow[]}
        statuses={statusOpts}
        categorias={(categorias ?? []) as CategoriaOpt[]}
      />
    </div>
  );
}
