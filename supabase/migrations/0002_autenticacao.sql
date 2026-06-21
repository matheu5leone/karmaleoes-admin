-- =============================================================================
-- 0002_autenticacao — Plano 01 (Autenticação & Controle de Sessão)
-- -----------------------------------------------------------------------------
-- admin_user (Módulo 1), is_active_admin() e endurecimento da RLS (audit_log).
-- Specs: modules/AUTENTICACAO_LOGIN_CONTROLE_SESSAO (RF/RN-LOGIN-001..007).
-- =============================================================================

-- Usuário administrativo (espelha auth.users; id = auth.users.id).
create table public.admin_user (
  id                     uuid primary key references auth.users (id) on delete cascade,
  email                  text not null unique,
  telefone               text,
  status                 text not null default 'ativo' check (status in ('ativo', 'inativo')),
  two_factor_configured  boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.admin_user
  for each row execute function public.set_updated_at();

-- E-mail imutável após criação (RN-LOGIN-007).
create or replace function public.prevent_email_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    raise exception 'E-mail do admin e imutavel (RN-LOGIN-007)';
  end if;
  return new;
end;
$$;

create trigger admin_user_email_immutable
  before update on public.admin_user
  for each row execute function public.prevent_email_update();

-- Política de acesso do MVP (sem RBAC): autenticado E ativo tem CRUD.
create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_user
    where id = auth.uid() and status = 'ativo'
  );
$$;

alter table public.admin_user enable row level security;
create policy admin_user_admin_access on public.admin_user
  for all to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

-- Endurecer audit_log: remover policy temporária do Plano 00 → is_active_admin().
drop policy if exists audit_log_authenticated on public.audit_log;
create policy audit_log_admin on public.audit_log
  for all to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

-- Reduz superfície: anon não enxerga tabelas/funções internas (advisors 0026/0028).
revoke select on public.audit_log from anon;
revoke select on public.admin_user from anon;
-- is_active_admin é uso interno de RLS: só authenticated executa (não anon/public).
revoke execute on function public.is_active_admin() from public, anon;
grant execute on function public.is_active_admin() to authenticated;
