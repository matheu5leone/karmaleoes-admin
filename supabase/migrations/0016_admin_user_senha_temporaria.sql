-- 0016_admin_user_senha_temporaria.sql
-- Marca contas que ainda usam a senha temporária de cadastro.
-- O 1º acesso passa a exigir troca de senha — antes, a senha definida no seed
-- (ou pelo admin que criou a conta) valia indefinidamente.

alter table public.admin_user
  add column if not exists senha_temporaria boolean not null default false;

comment on column public.admin_user.senha_temporaria is
  'true enquanto a conta usa a senha definida no cadastro/seed. Zerada na 1ª troca.';

-- Contas existentes nunca trocaram a senha desde a criação.
update public.admin_user set senha_temporaria = true;
