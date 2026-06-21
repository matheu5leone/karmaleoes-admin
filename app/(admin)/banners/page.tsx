import { createClient } from "@/lib/supabase/server";
import { BannersManager, type BannerRow } from "./_components";

export default async function BannersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("banner")
    .select("id, nome, imagem, banner_tela(status)")
    .order("nome", { ascending: true });

  const rows = (data ?? []) as Array<{
    id: string;
    nome: string;
    imagem: string;
    banner_tela: { status: string }[];
  }>;
  const banners: BannerRow[] = rows.map((b) => ({
    id: b.id,
    nome: b.nome,
    imagem: b.imagem,
    associacoes: b.banner_tela.length,
    publicadas: b.banner_tela.filter((a) => a.status === "publicado").length,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Banners</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Assets reutilizáveis. A publicação é por tela (1 publicado por tela).
      </p>
      <BannersManager banners={banners} />
    </div>
  );
}
