-- =============================================================================
-- 0005_banners — Plano 03 (Banners por Tela)
-- Specs: modules/GESTAO_BANNERS_POR_TELA (RF-BANNER-001..006, RN-BANNER-001..008).
-- =============================================================================

-- Banner é asset reutilizável (sem status; o status vive na associação).
create table public.banner (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  imagem      text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Associação Banner × Tela com status por tela.
create table public.banner_tela (
  id          uuid primary key default gen_random_uuid(),
  banner_id   uuid not null references public.banner (id) on delete cascade,
  tela_id     uuid not null references public.tela (id) on delete cascade,
  status      text not null default 'draft' check (status in ('draft', 'publicado')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (banner_id, tela_id)
);
-- Invariante: no máximo 1 publicado por tela (RN-BANNER-002).
create unique index banner_tela_um_publicado_por_tela
  on public.banner_tela (tela_id) where status = 'publicado';

create trigger set_updated_at before update on public.banner       for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.banner_tela  for each row execute function public.set_updated_at();

-- Máquina de publicação atômica: rebaixa a publicada da MESMA tela e publica a
-- alvo (RF-BANNER-005/RN-006). SECURITY INVOKER → RLS do admin aplica.
create or replace function public.publicar_banner_tela(assoc_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare v_tela uuid;
begin
  select tela_id into v_tela from public.banner_tela where id = assoc_id;
  if v_tela is null then
    raise exception 'Associação não encontrada';
  end if;
  update public.banner_tela
    set status = 'draft'
    where tela_id = v_tela and status = 'publicado' and id <> assoc_id;
  update public.banner_tela set status = 'publicado' where id = assoc_id;
end;
$$;

-- RLS + revogação do anon.
do $$
declare t text;
begin
  foreach t in array array['banner', 'banner_tela']
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

-- A função é uso interno do admin: só authenticated executa.
revoke execute on function public.publicar_banner_tela(uuid) from public, anon;
grant execute on function public.publicar_banner_tela(uuid) to authenticated;
