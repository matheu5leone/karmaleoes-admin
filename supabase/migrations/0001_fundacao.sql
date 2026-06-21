-- =============================================================================
-- 0001_fundacao — Plano 00 (Fundação & Infra)
-- -----------------------------------------------------------------------------
-- Extensões, helper de updated_at e auditoria de escrita (RF-LOGIN-006).
-- NOTA DE ORDEM: is_active_admin() e o endurecimento das policies dependem de
-- admin_user (Plano 01). Aqui audit_log usa policy temporária `to authenticated`
-- e user_id referencia auth.users(id). Ver docs/arquitetura/00-fundacao-e-infra.md.
-- =============================================================================

create extension if not exists pgcrypto;

-- Atualiza updated_at em cada UPDATE (aplicado por trigger nas tabelas).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auditoria de escrita — ver docs/arquitetura/transversal-auditoria.md.
create table public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users (id) on delete set null,
  acao         text not null check (acao in ('create', 'update', 'delete')),
  entidade     text not null,
  registro_id  uuid,
  diff         jsonb,
  created_at   timestamptz not null default now()
);
create index audit_log_entidade_idx on public.audit_log (entidade, registro_id);
create index audit_log_user_idx on public.audit_log (user_id);

alter table public.audit_log enable row level security;

-- Policy TEMPORÁRIA (Plano 00): qualquer autenticado. Será endurecida no Plano 01
-- para is_active_admin() quando admin_user existir.
create policy audit_log_authenticated on public.audit_log
  for all to authenticated
  using (true)
  with check (true);
