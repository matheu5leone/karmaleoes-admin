import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusManager, type StatusRow } from "./_components";

export default async function StatusEventoPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("status_evento")
    .select("id, nome, lifecycle, protegido")
    .order("lifecycle", { ascending: true })
    .order("nome", { ascending: true });

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
      <StatusManager statuses={(data ?? []) as StatusRow[]} />
    </div>
  );
}
