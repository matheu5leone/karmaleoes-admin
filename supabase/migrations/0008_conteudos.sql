-- =============================================================================
-- 0008_conteudos — Plano 05 (Conteúdos Digitais)
-- Specs: modules/GESTAO_CONTEUDOS_DIGITAIS (RF-CONT-001..009, RN-CONT-001..008).
-- =============================================================================

create table public.categoria_conteudo (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.conteudo (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  descricao     text,
  thumbnail     text,
  categoria_id  uuid references public.categoria_conteudo (id) on delete set null,
  tipo          text not null check (tipo in ('video', 'playlist', 'noticia', 'entrevista', 'podcast')),
  plataforma    text,
  link          text not null,
  status        text not null default 'draft' check (status in ('draft', 'pendente', 'publicado', 'desabilitado')),
  destaque      boolean not null default false,
  ordem         integer not null default 0,
  data          date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index conteudo_categoria_idx on public.conteudo (categoria_id);
create index conteudo_status_ordem_idx on public.conteudo (status, ordem);

create trigger set_updated_at before update on public.categoria_conteudo for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.conteudo           for each row execute function public.set_updated_at();

do $$
declare t text;
begin
  foreach t in array array['categoria_conteudo', 'conteudo']
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
