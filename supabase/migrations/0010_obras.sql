-- =============================================================================
-- 0010_obras — Plano 06 (Obras & Colaborações)
-- Specs: modules/GESTAO_OBRAS_E_COLABORACOES (RF-OBRA-001..012, RN-OBRA-001..009).
-- "Obra" é polimórfica: música XOR coleção (CHECK em obra_colaborador/link_plataforma).
-- =============================================================================

create table public.colecao (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  descricao       text,
  tipo            text not null check (tipo in ('album', 'EP')),
  cover_image     text,
  data_lancamento date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.musica (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  data_lancamento date,
  duracao         text,
  isrc            text,
  cover_image     text,
  colecao_id      uuid references public.colecao (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index musica_colecao_idx on public.musica (colecao_id);
create index musica_lancamento_idx on public.musica (data_lancamento desc);

create table public.colaborador (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  instagram   text,
  linkedin    text,
  descricao   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.role (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.obra_colaborador (
  id              uuid primary key default gen_random_uuid(),
  musica_id       uuid references public.musica (id) on delete cascade,
  colecao_id      uuid references public.colecao (id) on delete cascade,
  colaborador_id  uuid not null references public.colaborador (id) on delete cascade,
  role_id         uuid not null references public.role (id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint obra_colaborador_obra_xor check (
    (musica_id is not null and colecao_id is null) or
    (musica_id is null and colecao_id is not null)
  )
);
create index obra_colaborador_musica_idx on public.obra_colaborador (musica_id);
create index obra_colaborador_colecao_idx on public.obra_colaborador (colecao_id);
create index obra_colaborador_colaborador_idx on public.obra_colaborador (colaborador_id);

create table public.link_plataforma (
  id          uuid primary key default gen_random_uuid(),
  musica_id   uuid references public.musica (id) on delete cascade,
  colecao_id  uuid references public.colecao (id) on delete cascade,
  plataforma  text not null,
  url         text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint link_plataforma_obra_xor check (
    (musica_id is not null and colecao_id is null) or
    (musica_id is null and colecao_id is not null)
  )
);
create index link_plataforma_musica_idx on public.link_plataforma (musica_id);
create index link_plataforma_colecao_idx on public.link_plataforma (colecao_id);

create trigger set_updated_at before update on public.colecao          for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.musica           for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.colaborador      for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.role             for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.obra_colaborador for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.link_plataforma  for each row execute function public.set_updated_at();

do $$
declare t text;
begin
  foreach t in array array['colecao', 'musica', 'colaborador', 'role', 'obra_colaborador', 'link_plataforma']
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
