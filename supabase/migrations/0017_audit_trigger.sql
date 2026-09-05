-- 0017_audit_trigger.sql
-- Auditoria capturada por TRIGGER no banco, com antes/depois completos.
--
-- Antes, cada Server Action chamava audit() à mão: 58 chamadas em 15 arquivos, e
-- só 6 de 16 registros tinham diff — bastava esquecer numa ação para o rastro
-- sumir. O trigger não pode ser esquecido, guarda a linha inteira dos dois lados
-- e também registra alterações feitas direto no Supabase, que é o que torna a
-- tela de histórico um espelho fiel do banco.

alter table public.audit_log
  add column if not exists antes jsonb,
  add column if not exists depois jsonb;

comment on column public.audit_log.antes  is 'Linha completa antes (null em create).';
comment on column public.audit_log.depois is 'Linha completa depois (null em delete).';

-- now() é o timestamp da TRANSAÇÃO: várias linhas de auditoria numa mesma
-- transação sairiam com horário idêntico e ordem ambígua. clock_timestamp()
-- marca cada instrução.
alter table public.audit_log
  alter column created_at set default clock_timestamp();

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_antes jsonb;
  v_depois jsonb;
  v_acao text;
  v_diff jsonb;
  v_registro uuid;
begin
  if TG_OP = 'INSERT' then
    v_acao := 'create';
    v_depois := to_jsonb(NEW);
  elsif TG_OP = 'UPDATE' then
    v_acao := 'update';
    v_antes := to_jsonb(OLD);
    v_depois := to_jsonb(NEW);
    -- diff = só o que mudou de fato; updated_at muda em toda escrita.
    select jsonb_object_agg(d.key, d.value) into v_diff
      from jsonb_each(v_depois) d
     where d.key <> 'updated_at'
       and v_antes -> d.key is distinct from d.value;
    if v_diff is null then
      return null;  -- update que não alterou nada: não polui o log
    end if;
  else
    v_acao := 'delete';
    v_antes := to_jsonb(OLD);
  end if;

  v_registro := nullif(coalesce(v_depois, v_antes) ->> 'id', '')::uuid;

  insert into public.audit_log
    (user_id, acao, entidade, registro_id, antes, depois, diff)
  values
    (auth.uid(), v_acao, TG_TABLE_NAME, v_registro, v_antes, v_depois, v_diff);

  return null;  -- AFTER trigger: retorno é ignorado
end
$fn$;

-- Aplica em todas as tabelas de domínio. Nunca em audit_log: daria laço.
do $do$
declare t text;
begin
  for t in
    select c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'audit_log'
  loop
    execute format('drop trigger if exists audit_%1$s on public.%1$I', t);
    execute format(
      'create trigger audit_%1$s after insert or update or delete on public.%1$I
         for each row execute function public.audit_trigger()', t);
  end loop;
end
$do$;
