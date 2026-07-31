import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusManager, type StatusRow } from "./_components";

export default async function StatusEventoPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("status_evento")
    .select("id, nome, protegido, status_lifecycles(lifecycle)")
    .order("nome", { ascending: true });

  const statuses: StatusRow[] = (data ?? []).map((s) => ({
    id: s.id,
    nome: s.nome,
    protegido: s.protegido,
    lifecycle:
      (s.status_lifecycles as { lifecycle: string } | null)?.lifecycle ?? "",
  }));

  return (
    <div>
      <Link href="/eventos" className="text-sm text-brand hover:underline">
        ← Eventos
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Status de evento
      </h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Status dinâmicos por lifecycle. &quot;Adiado&quot; é protegido;
        &quot;Expirado&quot; é reservado (calculado, não cadastrável).
      </p>
      <StatusManager statuses={statuses} />
    </div>
  );
}
