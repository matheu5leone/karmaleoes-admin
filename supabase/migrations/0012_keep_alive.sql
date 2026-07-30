-- 0012_keep_alive.sql
-- Função de keep-alive: retorna o horário atual, sem tocar em nenhuma tabela.
-- Usada por um Vercel Cron (a cada 5 dias, ver vercel.json + app/api/keep-alive)
-- para gerar atividade no projeto e evitar a pausa automática por inatividade
-- (>7 dias) no plano free do Supabase.

create or replace function public.keep_alive()
returns timestamptz
language sql
stable
set search_path = ''
as $$ select now(); $$;

-- Liberado para clientes anônimos e autenticados (chamado via RPC com a anon key).
grant execute on function public.keep_alive() to anon, authenticated;
