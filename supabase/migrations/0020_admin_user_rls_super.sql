-- 0020_admin_user_rls_super.sql
-- Gestão de usuários passa a ser exclusiva do papel SUPER (grupo "Super Admin"
-- da sidebar).
--
-- A policy antiga era FOR ALL para qualquer admin ativo: esconder o menu não
-- bastaria, porque um ADMIN ainda criaria e desativaria contas chamando a API
-- direto. Agora:
--   - cada admin lê e atualiza apenas a PRÓPRIA linha — é o que middleware,
--     login, 2FA e troca de senha precisam;
--   - só SUPER lê e altera as linhas dos outros, cria e exclui contas.
-- (A troca de user_role continua travada pelo trigger da 0019.)

drop policy if exists admin_user_admin_access on public.admin_user;
drop policy if exists admin_user_select on public.admin_user;
drop policy if exists admin_user_update on public.admin_user;
drop policy if exists admin_user_insert on public.admin_user;
drop policy if exists admin_user_delete on public.admin_user;

create policy admin_user_select on public.admin_user
  for select to authenticated
  using ((id = auth.uid() and is_active_admin()) or is_super_admin());

create policy admin_user_update on public.admin_user
  for update to authenticated
  using ((id = auth.uid() and is_active_admin()) or is_super_admin())
  with check ((id = auth.uid() and is_active_admin()) or is_super_admin());

create policy admin_user_insert on public.admin_user
  for insert to authenticated
  with check (is_super_admin());

create policy admin_user_delete on public.admin_user
  for delete to authenticated
  using (is_super_admin());
