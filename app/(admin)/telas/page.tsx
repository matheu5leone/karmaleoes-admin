import { createClient } from "@/lib/supabase/server";
import { TelasManager, type Tela } from "./_components";

export default async function TelasPage() {
  const supabase = await createClient();
  // Contagens de vínculo alimentam o botão "Desvincular" e a confirmação.
  const [{ data }, { data: bt }, { data: mt }, { data: mi }] = await Promise.all([
    supabase
      .from("tela")
      .select("id, nome, rota, status")
      .order("nome", { ascending: true }),
    supabase.from("banner_tela").select("tela_id"),
    supabase.from("marquee_tela").select("tela_id"),
    supabase.from("marquee_item").select("tela_destino_id").not("tela_destino_id", "is", null),
  ]);

  const contar = (linhas: { id: string | null }[]) => {
    const m = new Map<string, number>();
    for (const l of linhas) if (l.id) m.set(l.id, (m.get(l.id) ?? 0) + 1);
    return m;
  };
  const banners = contar((bt ?? []).map((r) => ({ id: r.tela_id })));
  const marquees = contar((mt ?? []).map((r) => ({ id: r.tela_id })));
  const itens = contar((mi ?? []).map((r) => ({ id: r.tela_destino_id })));

  const telas: Tela[] = ((data ?? []) as Omit<Tela, "vinculos">[]).map((t) => ({
    ...t,
    vinculos: {
      banners: banners.get(t.id) ?? 0,
      marquees: marquees.get(t.id) ?? 0,
      itens: itens.get(t.id) ?? 0,
    },
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Telas</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Telas do Hub e seu status de exibição. Telas desabilitadas não aparecem
        na navegação.
      </p>
      <TelasManager telas={telas} />
    </div>
  );
}
