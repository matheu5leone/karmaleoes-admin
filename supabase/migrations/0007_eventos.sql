-- =============================================================================
-- 0007_eventos — Plano 04 (Gestão de Eventos)
-- Specs: modules/GESTAO_EVENTOS (RF-EVENTO-001..009, RN-EVENTO-001..015).
-- Expiração por campos virtuais na view (sem job). Fuso: America/Sao_Paulo.
-- =============================================================================

create table public.status_evento (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique check (nome <> 'Expirado'),
  lifecycle   text not null check (lifecycle in ('Em aberto', 'Encerrado')),
  protegido   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.evento (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null,
  descricao         text,
  categoria         text,
  data              date not null,
  horario           time,
  local             text,
  organizador       text,
  link_externo      text,
  lifecycle         text not null default 'Em aberto' check (lifecycle in ('Em aberto', 'Encerrado')),
  status_id         uuid not null references public.status_evento (id) on delete restrict,
  enable            boolean not null default false,
  prioridade        integer not null default 0,
  nova_data         date,
  obs_encerramento  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index evento_status_idx on public.evento (status_id);
create index evento_prioridade_idx on public.evento (prioridade desc, data);

create trigger set_updated_at before update on public.status_evento for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.evento        for each row execute function public.set_updated_at();

-- View com campos virtuais (RF-EVENTO-005). security_invoker → RLS do chamador aplica.
create view public.eventos_view with (security_invoker = true) as
select
  e.*,
  s.nome      as status_nome,
  s.lifecycle as status_lifecycle,
  case when s.nome = 'Adiado' and e.nova_data is not null then e.nova_data else e.data end
    as data_referencia,
  ((now() at time zone 'America/Sao_Paulo')::date
    > case when s.nome = 'Adiado' and e.nova_data is not null then e.nova_data else e.data end)
    as expirado,
  case
    when ((now() at time zone 'America/Sao_Paulo')::date
          > case when s.nome = 'Adiado' and e.nova_data is not null then e.nova_data else e.data end)
         and e.lifecycle = 'Em aberto'
    then 'Expirado'
    else s.nome
  end as status_efetivo,
  (e.enable and not ((now() at time zone 'America/Sao_Paulo')::date
    > case when s.nome = 'Adiado' and e.nova_data is not null then e.nova_data else e.data end))
    as enable_efetivo
from public.evento e
join public.status_evento s on s.id = e.status_id;

-- RLS + revogação do anon.
do $$
declare t text;
begin
  foreach t in array array['status_evento', 'evento']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$
      create policy admin_full_access on public.%I
        for all to authenticated
        using (public.is_active_admin())
        with check (public.is_active_admin());
    $f$, t);
    execute format('revoke select on public.%I from anon;', t);
  end loop;
end $$;
revoke select on public.eventos_view from anon;

-- Seed de status (RF-EVENTO-004). "Expirado" NÃO é seedado (rótulo virtual).
insert into public.status_evento (nome, lifecycle, protegido) values
  ('Ingressos a venda', 'Em aberto', false),
  ('Esgotado',          'Em aberto', false),
  ('Adiado',            'Em aberto', true),
  ('Sucesso',           'Encerrado', false),
  ('Cancelado',         'Encerrado', false)
on conflict (nome) do nothing;
