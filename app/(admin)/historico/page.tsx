import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getContaAtual } from "@/lib/conta";
import { HistoricoTabela, type LogRow } from "./_components";

const POR_PAGINA = 50;

/** Colunas que aceitam ordenação (lista fechada: vai direto para o `order`). */
const ORDENAVEIS = ["created_at", "acao", "entidade", "registro_id"] as const;
type Ordenavel = (typeof ORDENAVEIS)[number];

function normalizarOrdem(v?: string): Ordenavel {
  return (ORDENAVEIS as readonly string[]).includes(v ?? "")
    ? (v as Ordenavel)
    : "created_at";
}

type Params = {
  ordem?: string;
  dir?: string;
  pagina?: string;
  entidade?: string;
  acao?: string;
  autor?: string;
  de?: string;
  ate?: string;
};

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  // A RLS (0015) já barra a leitura; aqui é a guarda de rota.
  if (!(await getContaAtual()).isRoot) notFound();

  const sp = await searchParams;
  const ordem = normalizarOrdem(sp.ordem);
  const asc = sp.dir === "asc";
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const inicio = (pagina - 1) * POR_PAGINA;

  const supabase = await createClient();

  let q = supabase
    .from("audit_log")
    .select("id, acao, entidade, registro_id, diff, antes, depois, user_id, created_at", {
      count: "exact",
    });

  if (sp.entidade) q = q.eq("entidade", sp.entidade);
  if (sp.acao) q = q.eq("acao", sp.acao);
  if (sp.autor) q = q.eq("user_id", sp.autor);
  if (sp.de) q = q.gte("created_at", `${sp.de}T00:00:00`);
  if (sp.ate) q = q.lte("created_at", `${sp.ate}T23:59:59`);

  const [{ data: logs, count }, { data: admins }, { data: entidades }] =
    await Promise.all([
      q.order(ordem, { ascending: asc }).range(inicio, inicio + POR_PAGINA - 1),
      supabase.from("admin_user").select("id, email"),
      supabase.from("audit_log").select("entidade"),
    ]);

  const emailPorId = new Map((admins ?? []).map((a) => [a.id, a.email] as const));

  const lista: LogRow[] = (logs ?? []).map((l) => ({
    id: l.id,
    acao: l.acao,
    entidade: l.entidade,
    registroId: l.registro_id,
    antes: l.antes as Record<string, unknown> | null,
    depois: l.depois as Record<string, unknown> | null,
    diff: l.diff as Record<string, unknown> | null,
    autor: l.user_id ? (emailPorId.get(l.user_id) ?? "—") : "sistema",
    createdAt: l.created_at,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Toda escrita no banco, capturada por trigger — inclusive alterações
        feitas fora do painel. Visível apenas para o administrador raiz.
      </p>
      <HistoricoTabela
        logs={lista}
        total={count ?? 0}
        pagina={pagina}
        porPagina={POR_PAGINA}
        ordem={ordem}
        dir={asc ? "asc" : "desc"}
        filtros={{
          entidade: sp.entidade ?? "",
          acao: sp.acao ?? "",
          autor: sp.autor ?? "",
          de: sp.de ?? "",
          ate: sp.ate ?? "",
        }}
        entidadesDisponiveis={[
          ...new Set((entidades ?? []).map((e) => e.entidade)),
        ].sort()}
        autoresDisponiveis={(admins ?? []).map((a) => ({
          id: a.id,
          email: a.email,
        }))}
      />
    </div>
  );
}
