-- 0015_audit_log_root_only.sql
-- Histórico de auditoria visível apenas para o administrador raiz (o mais antigo
-- em admin_user — o criado pelo seed).
--
-- A policy anterior era FOR ALL para qualquer admin ativo, então esconder o item
-- de menu na UI seria cosmético: qualquer admin ainda leria a trilha pela API.

create or replace function public.is_root_admin()
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select coalesce(
    auth.uid() = (select id from public.admin_user order by created_at asc limit 1),
    false
  );
$$;

drop policy if exists audit_log_admin on public.audit_log;

-- Escrita: qualquer admin ativo (audit() roda em toda ação de create/update/delete).
create policy audit_log_insert on public.audit_log
  for insert to authenticated
  with check (is_active_admin());

-- Leitura: somente o administrador raiz.
create policy audit_log_select_root on public.audit_log
  for select to authenticated
  using (is_root_admin());

-- Sem policies de UPDATE/DELETE: a trilha fica append-only.
