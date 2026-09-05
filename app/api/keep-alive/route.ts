import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Keep-alive do Supabase (evita a pausa automática por inatividade > 7 dias no
 * plano free). Acionado por um Vercel Cron (ver `vercel.json`, a cada 5 dias):
 * faz uma query leve no banco — uma requisição externa ao projeto conta como
 * atividade e zera o contador de inatividade.
 *
 * A rota NÃO está nos PROTECTED_PREFIXES do middleware, então passa direto (sem auth).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  // Proteção opcional: se CRON_SECRET estiver definido, exige o header que o
  // Vercel Cron injeta automaticamente (Authorization: Bearer <CRON_SECRET>).
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json(
      { ok: false, error: "missing supabase env" },
      { status: 500 },
    );
  }

  // keep_alive() INSERE uma linha e devolve a contagem acumulada (migration
  // 0018). Escrita de verdade: é o que conta como atividade para o free tier, e
  // deixa rastro para conferir se o agendamento dispara mesmo.
  const supabase = createClient(url, anon, { auth: { persistSession: false } });
  const startedAt = Date.now();
  const { data, error } = await supabase.rpc("keep_alive");
  const resultado = data as
    | { executado_em: string; total_execucoes: number }
    | null;

  // Sempre 200: a atividade já aconteceu mesmo se a query der erro (evita retry).
  return NextResponse.json({
    ok: !error,
    ranAt: new Date().toISOString(),
    ms: Date.now() - startedAt,
    totalExecucoes: resultado?.total_execucoes ?? null,
    error: error?.message ?? null,
  });
}
