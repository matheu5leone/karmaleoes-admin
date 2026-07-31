-- 0013_der_lookups.sql
-- Tabelas de lookup do DER (Miro "DER - Karmaleões Admin & Hub"), nomes em inglês:
-- STATUS_LIFECYCLES, CATEGORY, ICONS. Converte os campos texto correspondentes
-- em FKs. Ver divergencias.md (itens 4.5–4.9). evento.lifecycle é MANTIDO (DER).

-- ===== STATUS_LIFECYCLES =====
create table public.status_lifecycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lifecycle text not null,
  created_at timestamptz not null default now()
);
alter table public.status_lifecycles enable row level security;
create policy admin_full_access on public.status_lifecycles
  for all to authenticated using (is_active_admin()) with check (is_active_admin());
insert into public.status_lifecycles (name, lifecycle) values
  ('Em aberto', 'Em aberto'),
  ('Encerrado', 'Encerrado');

-- ===== CATEGORY =====
create table public.category (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lifecycle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.category enable row level security;
create policy admin_full_access on public.category
  for all to authenticated using (is_active_admin()) with check (is_active_admin());
create trigger set_updated_at before update on public.category
  for each row execute function set_updated_at();

-- ===== ICONS =====
create table public.icons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  extension text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.icons enable row level security;
create policy admin_full_access on public.icons
  for all to authenticated using (is_active_admin()) with check (is_active_admin());
create trigger set_updated_at before update on public.icons
  for each row execute function set_updated_at();

-- anon não precisa ver estas tabelas de lookup (consistente com status_evento/categoria_conteudo).
revoke select on public.status_lifecycles, public.category, public.icons from anon;

-- A view eventos_view depende de status_evento.lifecycle e evento.categoria: dropar antes.
drop view if exists public.eventos_view;

-- ===== status_evento (EVENT_STATUSES): lifecycle texto -> lifecycle_id FK =====
alter table public.status_evento add column lifecycle_id uuid references public.status_lifecycles(id);
update public.status_evento se
  set lifecycle_id = sl.id
  from public.status_lifecycles sl
  where sl.lifecycle = se.lifecycle;
alter table public.status_evento alter column lifecycle_id set not null;
alter table public.status_evento drop column lifecycle;
create index status_evento_lifecycle_id_idx on public.status_evento (lifecycle_id);

-- ===== evento (EVENTS): categoria texto -> category_id FK (mantém lifecycle) =====
alter table public.evento add column category_id uuid references public.category(id);
alter table public.evento drop column categoria;
create index evento_category_id_idx on public.evento (category_id);

-- ===== marquee_item (MARQUEE_ITEMS): imagem texto -> icon_id FK =====
alter table public.marquee_item add column icon_id uuid references public.icons(id);
alter table public.marquee_item drop column imagem;
create index marquee_item_icon_id_idx on public.marquee_item (icon_id);

-- ===== Recria eventos_view com o schema novo =====
create view public.eventos_view as
select
  e.id,
  e.nome,
  e.descricao,
  e.category_id,
  c.name as category_name,
  e.data,
  e.horario,
  e.local,
  e.organizador,
  e.link_externo,
  e.lifecycle,
  e.status_id,
  e.enable,
  e.prioridade,
  e.nova_data,
  e.obs_encerramento,
  e.created_at,
  e.updated_at,
  s.nome as status_nome,
  sl.lifecycle as status_lifecycle,
  case when s.nome = 'Adiado' and e.nova_data is not null then e.nova_data else e.data end as data_referencia,
  ((now() at time zone 'America/Sao_Paulo')::date >
    case when s.nome = 'Adiado' and e.nova_data is not null then e.nova_data else e.data end) as expirado,
  case
    when ((now() at time zone 'America/Sao_Paulo')::date >
      case when s.nome = 'Adiado' and e.nova_data is not null then e.nova_data else e.data end)
      and e.lifecycle = 'Em aberto' then 'Expirado'
    else s.nome
  end as status_efetivo,
  (e.enable and not ((now() at time zone 'America/Sao_Paulo')::date >
    case when s.nome = 'Adiado' and e.nova_data is not null then e.nova_data else e.data end)) as enable_efetivo
from evento e
  join status_evento s on s.id = e.status_id
  left join status_lifecycles sl on sl.id = s.lifecycle_id
  left join category c on c.id = e.category_id;
