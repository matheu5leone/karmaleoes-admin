import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BannerAssociacoes,
  type DetAssoc,
  type DetTela,
  type PublicadoNaTela,
} from "./_components";

export default async function BannerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: banner } = await supabase
    .from("banner")
    .select("id, nome, imagem")
    .eq("id", id)
    .single();
  if (!banner) notFound();

  const [{ data: telas }, { data: assoc }, { data: publicados }] =
    await Promise.all([
      supabase.from("tela").select("id, nome, status").order("nome"),
      supabase
        .from("banner_tela")
        .select("id, tela_id, status")
        .eq("banner_id", id),
      // Quem está publicado em cada tela hoje — inclusive de OUTROS banners.
      // Sem isso, a confirmação não saberia dizer qual banner sairia do ar.
      supabase
        .from("banner_tela")
        .select("tela_id, banner_id, banner(nome)")
        .eq("status", "publicado"),
    ]);

  const publicadoPorTela: Record<string, PublicadoNaTela> = {};
  for (const p of (publicados ?? []) as unknown as Array<{
    tela_id: string;
    banner_id: string;
    banner: { nome: string } | null;
  }>) {
    if (p.banner_id === id) continue; // o próprio banner não conta como troca
    publicadoPorTela[p.tela_id] = {
      bannerId: p.banner_id,
      nome: p.banner?.nome ?? "outro banner",
    };
  }

  return (
    <div>
      <Link href="/banners" className="text-sm text-brand hover:underline">
        ← Banners
      </Link>
      <div className="mt-2 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner.imagem}
          alt=""
          className="h-16 w-28 rounded-md border border-border object-cover"
        />
        <h1 className="text-2xl font-semibold tracking-tight">{banner.nome}</h1>
      </div>

      <BannerAssociacoes
        bannerId={id}
        telas={(telas ?? []) as DetTela[]}
        assoc={(assoc ?? []) as DetAssoc[]}
        publicadoPorTela={publicadoPorTela}
      />
    </div>
  );
}
