import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ObraVinculos,
  type LinkView,
  type VinculoView,
} from "@/components/obras/obra-vinculos";

export default async function ColecaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: colecao } = await supabase
    .from("colecao")
    .select("id, nome, tipo")
    .eq("id", id)
    .single();
  if (!colecao) notFound();

  const [{ data: colaboradores }, { data: roles }, { data: vinculos }, { data: links }] =
    await Promise.all([
      supabase.from("colaborador").select("id, nome").order("nome"),
      supabase.from("role").select("id, nome").order("nome"),
      supabase
        .from("obra_colaborador")
        .select("id, colaborador(nome), role(nome)")
        .eq("colecao_id", id),
      supabase
        .from("link_plataforma")
        .select("id, plataforma, url")
        .eq("colecao_id", id),
    ]);

  const vrows = (vinculos ?? []) as Array<{
    id: string;
    colaborador: { nome: string } | null;
    role: { nome: string } | null;
  }>;
  const vinc: VinculoView[] = vrows.map((v) => ({
    id: v.id,
    colaborador_nome: v.colaborador?.nome ?? "?",
    role_nome: v.role?.nome ?? "?",
  }));

  return (
    <div>
      <Link href="/obras" className="text-sm text-brand hover:underline">
        ← Obras
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {colecao.nome}{" "}
        <span className="text-base font-normal text-muted-foreground">
          ({colecao.tipo})
        </span>
      </h1>
      <ObraVinculos
        tipo="colecao"
        obraId={id}
        colaboradores={colaboradores ?? []}
        roles={roles ?? []}
        vinculos={vinc}
        links={(links ?? []) as LinkView[]}
      />
    </div>
  );
}
