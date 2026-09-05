-- 0018_keep_alive_contador.sql
-- O cron de 5 dias existia desde a 0012, mas keep_alive() era `stable` e só fazia
-- `select now()`: não gravava nada, então não havia como saber se o agendamento
-- realmente disparava. Agora cada execução INSERE uma linha — escrita de verdade
-- no banco, que é o que segura o free tier — e a contagem vira o histórico.

create table if not exists public.keep_alive_log (
  id uuid primary key default gen_random_uuid(),
  executado_em timestamptz not null default clock_timestamp()
);

comment on table public.keep_alive_log is
  'Uma linha por execução do cron de keep-alive.';

alter table public.keep_alive_log enable row level security;

-- Leitura para admins ativos; a escrita é só pela função (security definer).
drop policy if exists keep_alive_log_leitura on public.keep_alive_log;
create policy keep_alive_log_leitura on public.keep_alive_log
  for select to authenticated using (is_active_admin());

-- O tipo de retorno muda (timestamptz -> jsonb), então precisa de drop antes.
drop function if exists public.keep_alive();

create or replace function public.keep_alive()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare v_total bigint;
begin
  insert into public.keep_alive_log default values;
  select count(*) into v_total from public.keep_alive_log;
  return jsonb_build_object('executado_em', clock_timestamp(), 'total_execucoes', v_total);
end
$fn$;

grant execute on function public.keep_alive() to anon, authenticated;

-- Auditar o cron seria só ruído: uma linha a cada execução.
drop trigger if exists audit_keep_alive_log on public.keep_alive_log;
