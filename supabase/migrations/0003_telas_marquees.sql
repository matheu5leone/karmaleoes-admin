-- =============================================================================
-- 0003_telas_marquees — Plano 02 (Telas, Navegação & Marquees)
-- Specs: modules/GESTAO_TELAS_NAVEGACAO_E_MARQUEES (RF-NAV-001..011, RN-NAV-001..007).
-- =============================================================================

-- Tela: referência a rota existente no Hub (cadastro manual, RN-NAV-002).
create table public.tela (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  rota        text not null unique,
  status      text not null default 'habilitada' check (status in ('habilitada', 'desabilitada')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Marquee: componente reutilizável (RF-NAV-005/006).
create table public.marquee (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  props_visuais  jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Associação N:N marquee × tela.
create table public.marquee_tela (
  id          uuid primary key default gen_random_uuid(),
  marquee_id  uuid not null references public.marquee (id) on delete cascade,
  tela_id     uuid not null references public.tela (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (marquee_id, tela_id)
);
create index marquee_tela_tela_idx on public.marquee_tela (tela_id);

-- Item de marquee: um destino por item (RN-NAV-005); sem limite (RN-NAV-007).
create table public.marquee_item (
  id               uuid primary key default gen_random_uuid(),
  marquee_id       uuid not null references public.marquee (id) on delete cascade,
  titulo           text not null,
  imagem           text,
  tipo_nav         text not null check (tipo_nav in ('interno', 'externo')),
  tela_destino_id  uuid references public.tela (id) on delete restrict,
  url_externa      text,
  ordem            integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint marquee_item_destino_xor check (
    (tipo_nav = 'interno' and tela_destino_id is not null and url_externa is null) or
    (tipo_nav = 'externo' and url_externa is not null and tela_destino_id is null)
  )
);
create index marquee_item_marquee_ordem_idx on public.marquee_item (marquee_id, ordem);

-- Triggers de updated_at.
create trigger set_updated_at before update on public.tela          for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.marquee       for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.marquee_tela  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.marquee_item  for each row execute function public.set_updated_at();

-- RLS: autenticado + ativo (is_active_admin) tem CRUD; anon sem acesso.
do $$
declare t text;
begin
  foreach t in array array['tela', 'marquee', 'marquee_tela', 'marquee_item']
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
