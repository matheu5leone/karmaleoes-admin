import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MarqueesManager, type MarqueeRow } from "./_components";

export default async function MarqueesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("marquee")
    .select("id, nome, marquee_tela(count), marquee_item(count)")
    .order("nome", { ascending: true });

  const rows = (data ?? []) as Array<{
    id: string;
    nome: string;
    marquee_tela: { count: number }[];
    marquee_item: { count: number }[];
  }>;
  const marquees: MarqueeRow[] = rows.map((m) => ({
    id: m.id,
    nome: m.nome,
    telas: m.marquee_tela?.[0]?.count ?? 0,
    itens: m.marquee_item?.[0]?.count ?? 0,
  }));

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marquees</h1>
          <p className="mb-6 mt-1 text-muted-foreground">
            Componentes navegáveis reutilizáveis, associáveis a várias telas.
          </p>
        </div>
        <Link
          href="/marquees/icones"
          className="shrink-0 text-sm text-brand hover:underline"
        >
          Ícones
        </Link>
      </div>
      <MarqueesManager marquees={marquees} />
    </div>
  );
}
