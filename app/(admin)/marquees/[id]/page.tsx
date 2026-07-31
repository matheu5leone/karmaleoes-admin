import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MarqueeEditor,
  type EditorItem,
  type EditorTela,
  type IconOpt,
} from "./_components";

export default async function MarqueeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Tudo em paralelo (o marquee inclusive) — o notFound é checado depois.
  const [
    { data: marquee },
    { data: telas },
    { data: assoc },
    { data: itens },
    { data: icons },
  ] = await Promise.all([
    supabase
      .from("marquee")
      .select("id, nome, props_visuais")
      .eq("id", id)
      .single(),
    supabase.from("tela").select("id, nome, status").order("nome"),
    supabase.from("marquee_tela").select("tela_id").eq("marquee_id", id),
    supabase
      .from("marquee_item")
      .select(
        "id, titulo, icon_id, icons(name, extension), tipo_nav, tela_destino_id, url_externa, ordem",
      )
      .eq("marquee_id", id)
      .order("ordem", { ascending: true }),
    supabase.from("icons").select("id, name, extension").order("name"),
  ]);
  if (!marquee) notFound();

  const itensMapped: EditorItem[] = (itens ?? []).map((it) => ({
    id: it.id,
    titulo: it.titulo,
    icon_id: it.icon_id,
    icon: it.icons as { name: string; extension: string } | null,
    tipo_nav: it.tipo_nav,
    tela_destino_id: it.tela_destino_id,
    url_externa: it.url_externa,
    ordem: it.ordem,
  }));

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
        itens={itensMapped}
        icons={(icons ?? []) as IconOpt[]}
      />
    </div>
  );
}
