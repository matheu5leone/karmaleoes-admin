-- 0019_user_role_super.sql
-- Nova regra de super administrador.
--
-- Antes: o super admin era implícito — a conta mais antiga (created_at). Qualquer
-- restauração, seed ou exclusão mudava quem era o "raiz" sem ninguém decidir.
-- Agora: todos nascem ADMIN e o papel SUPER é atribuído explicitamente, pelo
-- dashboard do Supabase, na coluna admin_user.user_role.
--
-- SUPER mantém as permissões que eram do raiz:
--   - lê o audit_log (tela Histórico);
--   - não pode ser desativado.

alter table public.admin_user
  add column if not exists user_role text not null default 'ADMIN';

alter table public.admin_user drop constraint if exists admin_user_user_role_check;
alter table public.admin_user
  add constraint admin_user_user_role_check check (user_role in ('ADMIN', 'SUPER'));

comment on column public.admin_user.user_role is
  'ADMIN (padrão) ou SUPER. SUPER vê o Histórico e não pode ser desativado. Só é alterável pelo dashboard/SQL do Supabase — nunca pela API do app.';

-- Trava de escalada de privilégio.
-- A RLS de admin_user deixa qualquer admin ativo editar a tabela pela API; sem
-- esta trava, um ADMIN se promoveria a SUPER com uma chamada direta ao PostgREST.
-- SECURITY INVOKER de propósito: precisa do current_user real. Requisições do app
-- rodam como `authenticated`; o dashboard/SQL editor como `postgres`; scripts com
-- service key como `service_role` — esses dois continuam podendo alterar.
create or replace function public.prevent_user_role_change()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' and new.user_role <> 'ADMIN' then
      raise exception 'user_role só pode ser definido pelo dashboard do Supabase';
    end if;
    if tg_op = 'UPDATE' and new.user_role is distinct from old.user_role then
      raise exception 'user_role só pode ser alterado pelo dashboard do Supabase';
    end if;
  end if;
  return new;
end
$fn$;

drop trigger if exists admin_user_role_guard on public.admin_user;
create trigger admin_user_role_guard
  before insert or update on public.admin_user
  for each row execute function public.prevent_user_role_change();

create or replace function public.is_super_admin()
returns boolean
language sql
stable security definer
set search_path = ''
as $fn$
  select exists (
    select 1 from public.admin_user
     where id = auth.uid() and status = 'ativo' and user_role = 'SUPER'
  );
$fn$;

-- Leitura do audit_log passa de "mais antigo" (0015) para "papel SUPER".
drop policy if exists audit_log_select_root on public.audit_log;
drop policy if exists audit_log_select_super on public.audit_log;
create policy audit_log_select_super on public.audit_log
  for select to authenticated using (is_super_admin());

drop function if exists public.is_root_admin();
