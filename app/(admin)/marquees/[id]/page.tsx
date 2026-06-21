import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarqueeEditor, type EditorItem, type EditorTela } from "./_components";

export default async function MarqueeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: marquee } = await supabase
    .from("marquee")
    .select("id, nome, props_visuais")
    .eq("id", id)
    .single();
  if (!marquee) notFound();

  const [{ data: telas }, { data: assoc }, { data: itens }] = await Promise.all([
    supabase.from("tela").select("id, nome, status").order("nome"),
    supabase.from("marquee_tela").select("tela_id").eq("marquee_id", id),
    supabase
      .from("marquee_item")
      .select("id, titulo, imagem, tipo_nav, tela_destino_id, url_externa, ordem")
      .eq("marquee_id", id)
      .order("ordem", { ascending: true }),
  ]);

  const props = (marquee.props_visuais ?? {}) as {
    cor_fundo?: string | null;
    cor_texto?: string | null;
  };

  return (
    <div>
      <Link href="/marquees" className="text-sm text-brand hover:underline">
        ← Marquees
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {marquee.nome}
      </h1>
      <MarqueeEditor
        marqueeId={id}
        nomeInicial={marquee.nome}
        corFundoInicial={props.cor_fundo ?? ""}
        corTextoInicial={props.cor_texto ?? ""}
        telas={(telas ?? []) as EditorTela[]}
        telaIdsAssociadas={(assoc ?? []).map((a) => a.tela_id)}
        itens={(itens ?? []) as EditorItem[]}
      />
    </div>
  );
}
