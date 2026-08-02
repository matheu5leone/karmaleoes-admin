import { createClient } from "@/lib/supabase/server";
import { TelasManager, type Tela } from "./_components";
import type { MarqueeResumo } from "@/components/marquees/marquee-hover-preview";
import type { PreviewItem } from "@/components/marquees/marquee-preview";

type MarqueeJoin = {
  tela_id: string;
  marquee: {
    id: string;
    nome: string;
    props_visuais: { cor_fundo?: string | null; cor_texto?: string | null } | null;
  } | null;
};
type ItemJoin = {
  id: string;
  marquee_id: string;
  titulo: string;
  icons: { name: string; extension: string } | null;
};

export default async function TelasPage() {
  const supabase = await createClient();
  // Tudo em paralelo: as listas são pequenas e o hover precisa dos dados prontos
  // (buscar no hover custaria ~700ms e mataria a sensação de instantâneo).
  const [{ data: telas }, { data: assoc }, { data: itens }] = await Promise.all([
    supabase.from("tela").select("id, nome, rota, status").order("nome"),
    supabase
      .from("marquee_tela")
      .select("tela_id, marquee(id, nome, props_visuais)"),
    supabase
      .from("marquee_item")
      .select("id, marquee_id, titulo, icons(name, extension)")
      .order("ordem", { ascending: true }),
  ]);

  // Itens agrupados por marquee.
  const itensPorMarquee = new Map<string, PreviewItem[]>();
  for (const it of (itens ?? []) as unknown as ItemJoin[]) {
    const lista = itensPorMarquee.get(it.marquee_id) ?? [];
    lista.push({ id: it.id, titulo: it.titulo, icon: it.icons ?? null });
    itensPorMarquee.set(it.marquee_id, lista);
  }

  // Marquees agrupados por tela.
  const marqueesPorTela = new Map<string, MarqueeResumo[]>();
  for (const a of (assoc ?? []) as unknown as MarqueeJoin[]) {
    if (!a.marquee) continue;
    const lista = marqueesPorTela.get(a.tela_id) ?? [];
    lista.push({
      id: a.marquee.id,
      nome: a.marquee.nome,
      corFundo: a.marquee.props_visuais?.cor_fundo ?? "",
      corTexto: a.marquee.props_visuais?.cor_texto ?? "",
      itens: itensPorMarquee.get(a.marquee.id) ?? [],
    });
    marqueesPorTela.set(a.tela_id, lista);
  }

  const lista: Tela[] = ((telas ?? []) as Omit<Tela, "marquees">[]).map((t) => ({
    ...t,
    marquees: marqueesPorTela.get(t.id) ?? [],
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Telas</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Telas do Hub e seu status de exibição. Telas desabilitadas não aparecem
        na navegação. Passe o mouse no nome do marquee para ver a faixa montada.
      </p>
      <TelasManager telas={lista} />
    </div>
  );
}
