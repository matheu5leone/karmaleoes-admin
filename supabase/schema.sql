-- =============================================================================
-- Portal Administrativo Karmaleões — SCHEMA CONSOLIDADO (referência)
-- -----------------------------------------------------------------------------
-- Reflete o modelo de dados dos 6 módulos do escopo atual, conforme:
--   ARQUITETURA.md (§4 ERD) · docs/arquitetura/00..06 · transversais.
--
-- ⚠️ ESTE ARQUIVO NÃO DEVE SER EXECUTADO DIRETAMENTE EM PRODUÇÃO.
--    É a fotografia canônica do schema, para leitura/alinhamento. A aplicação
--    real será feita por MIGRATIONS incrementais (supabase/migrations/NNNN_*.sql),
--    criadas plano a plano (00 → 06). Mantenha este arquivo em sincronia quando
--    o modelo evoluir.
--
-- Convenções (transversal-banco-rls-migrations.md):
--   snake_case · PK uuid default gen_random_uuid() · created_at/updated_at +
--   trigger set_updated_at · RLS habilitado em TODA tabela · política única
--   is_active_admin() (sem RBAC no MVP) · enums como text + CHECK.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Fundação (Plano 00) — extensões, helpers, auditoria, RLS base
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;            -- gen_random_uuid()

-- Atualiza updated_at em cada UPDATE (aplicado por trigger em toda tabela).
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

-- Política de acesso do MVP (sem RBAC): usuário autenticado E ativo tem CRUD.
-- SECURITY DEFINER para conseguir ler admin_user dentro das policies sem recursão.
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

-- Auditoria de escrita (RF-LOGIN-006) — ver transversal-auditoria.md.
create table public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.admin_user (id) on delete set null,
  acao         text not null check (acao in ('create', 'update', 'delete')),
  entidade     text not null,
  registro_id  uuid,
  diff         jsonb,
  created_at   timestamptz not null default now()
);
create index audit_log_entidade_idx on public.audit_log (entidade, registro_id);
create index audit_log_user_idx on public.audit_log (user_id);

-- =============================================================================
-- 1. Autenticação & Usuários (Plano 01) — modules/AUTENTICACAO_LOGIN_CONTROLE_SESSAO
-- =============================================================================
-- Usuário administrativo, espelha auth.users (id = auth.users.id).
-- E-mail é o identificador de login (único, imutável — RN-LOGIN-007).
-- Telefone opcional; CPF NÃO existe no admin. two_factor_configured = false
-- até o 1º acesso (RF-LOGIN-007). Sem auto-registro (RN-LOGIN-006).
create table public.admin_user (
  id                     uuid primary key references auth.users (id) on delete cascade,
  email                  text not null unique,
  telefone               text,
  status                 text not null default 'ativo' check (status in ('ativo', 'inativo')),
  two_factor_configured  boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- E-mail imutável após criação (RN-LOGIN-007).
create or replace function public.prevent_email_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    raise exception 'E-mail do admin é imutável (RN-LOGIN-007)';
  end if;
  return new;
end;
$$;
create trigger admin_user_email_immutable
  before update on public.admin_user
  for each row execute function public.prevent_email_update();

-- =============================================================================
-- 2. Telas, Navegação & Marquees (Plano 02) — modules/GESTAO_TELAS_NAVEGACAO_E_MARQUEES
-- =============================================================================
-- Tela: referência a rota existente no Hub (cadastro manual, RN-NAV-002).
create table public.tela (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  rota        text not null unique,           -- slug/rota no Hub (RF-NAV-001)
  status      text not null default 'habilitada' check (status in ('habilitada', 'desabilitada')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Marquee: componente reutilizável (RF-NAV-005/006).
create table public.marquee (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  props_visuais  jsonb not null default '{}'::jsonb,  -- cores, ícones, estilo (RF-NAV-007)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Associação N:N marquee × tela (reutilização).
create table public.marquee_tela (
  id          uuid primary key default gen_random_uuid(),
  marquee_id  uuid not null references public.marquee (id) on delete cascade,
  tela_id     uuid not null references public.tela (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (marquee_id, tela_id)
);
create index marquee_tela_tela_idx on public.marquee_tela (tela_id);

-- Item de marquee: um destino por item (RN-NAV-005); interno só p/ tela habilitada
-- (validado em app — RF-NAV-011/RN-NAV-004). Sem limite de itens (RN-NAV-007).
create table public.marquee_item (
  id               uuid primary key default gen_random_uuid(),
  marquee_id       uuid not null references public.marquee (id) on delete cascade,
  titulo           text not null,
  imagem           text,                       -- path/URL (bucket marquees)
  tipo_nav         text not null check (tipo_nav in ('interno', 'externo')),
  tela_destino_id  uuid references public.tela (id) on delete restrict,
  url_externa      text,                       -- abre em nova aba (RF-NAV-010)
  ordem            integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- XOR de destino conforme tipo_nav:
  constraint marquee_item_destino_xor check (
    (tipo_nav = 'interno' and tela_destino_id is not null and url_externa is null) or
    (tipo_nav = 'externo' and url_externa is not null and tela_destino_id is null)
  )
);
create index marquee_item_marquee_ordem_idx on public.marquee_item (marquee_id, ordem);

-- =============================================================================
-- 3. Banners por Tela (Plano 03) — modules/GESTAO_BANNERS_POR_TELA
-- =============================================================================
-- Banner é um ASSET sem status (RF-BANNER-001). O status vive na associação.
create table public.banner (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,                   -- label interno (não exibido no Hub)
  imagem      text not null,                   -- path/URL (bucket banners)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Associação Banner × Tela: status por tela (RF-BANNER-004). Criada em 'draft'.
-- Invariante: no máx. 1 'publicado' por tela (RN-BANNER-002) → índice único parcial.
-- Máquina de publicação (auto-revert da mesma tela) é app-level (RF-BANNER-005/RN-006).
create table public.banner_tela (
  id          uuid primary key default gen_random_uuid(),
  banner_id   uuid not null references public.banner (id) on delete cascade,
  tela_id     uuid not null references public.tela (id) on delete cascade,
  status      text not null default 'draft' check (status in ('draft', 'publicado')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (banner_id, tela_id)
);
create unique index banner_tela_um_publicado_por_tela
  on public.banner_tela (tela_id) where status = 'publicado';

-- =============================================================================
-- 4. Eventos (Plano 04) — modules/GESTAO_EVENTOS
-- =============================================================================
-- Status dinâmicos por lifecycle. "Expirado" é rótulo virtual reservado:
-- não pode ser cadastrado (CHECK). "Adiado" é protegido (RN-EVENTO-009).
create table public.status_evento (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique check (nome <> 'Expirado'),
  lifecycle   text not null check (lifecycle in ('Em aberto', 'Encerrado')),
  protegido   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Evento. enable default false (RN-EVENTO-012). nova_data obrigatória quando
-- status 'Adiado' e obs_encerramento obrigatória ao encerrar → validado em app
-- (Server Action), pois dependem do nome do status. Status em uso não excluível
-- (garantido pela FK on delete restrict + RN-EVENTO-013).
create table public.evento (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null,
  descricao         text,
  categoria         text,
  data              date not null,             -- data de referência padrão p/ expiração
  horario           time,
  local             text,
  organizador       text,
  link_externo      text,                      -- compra em nova aba (RF-EVENTO-007)
  lifecycle         text not null default 'Em aberto' check (lifecycle in ('Em aberto', 'Encerrado')),
  status_id         uuid not null references public.status_evento (id) on delete restrict,
  enable            boolean not null default false,
  prioridade        integer not null default 0,
  nova_data         date,                      -- referência se status 'Adiado' (RN-EVENTO-008)
  obs_encerramento  text,                      -- obrigatória ao encerrar (RF-EVENTO-006)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index evento_status_idx on public.evento (status_id);
create index evento_prioridade_idx on public.evento (prioridade desc, data);

-- View de leitura com CAMPOS VIRTUAIS (sem job, sem mutação — RF-EVENTO-005).
-- Toda leitura de eventos (admin e futuro Hub) consome esta view.
-- LACUNA: a data corrente/fuso de comparação é definida pelo time (APP_TIMEZONE).
--         Aqui usa-se current_date; ajustar para (now() at time zone <tz>)::date se necessário.
create or replace view public.eventos_view as
select
  e.*,
  s.nome      as status_nome,
  s.lifecycle as status_lifecycle,
  -- data de referência: nova_data se status 'Adiado' e preenchida; senão data
  case when s.nome = 'Adiado' and e.nova_data is not null then e.nova_data else e.data end
    as data_referencia,
  -- expirado: dia seguinte à data de referência em diante
  (current_date > case when s.nome = 'Adiado' and e.nova_data is not null then e.nova_data else e.data end)
    as expirado,
  -- status_efetivo: 'Expirado' se expirado e lifecycle 'Em aberto'; senão status armazenado
  case
    when (current_date > case when s.nome = 'Adiado' and e.nova_data is not null then e.nova_data else e.data end)
         and e.lifecycle = 'Em aberto'
    then 'Expirado'
    else s.nome
  end as status_efetivo,
  -- enable_efetivo: enable armazenado E NÃO expirado (rege a visibilidade no Hub)
  (e.enable and not (current_date > case when s.nome = 'Adiado' and e.nova_data is not null then e.nova_data else e.data end))
    as enable_efetivo
from public.evento e
join public.status_evento s on s.id = e.status_id;

-- =============================================================================
-- 5. Conteúdos Digitais (Plano 05) — modules/GESTAO_CONTEUDOS_DIGITAIS
-- =============================================================================
-- Categoria: agrupamento temático gerenciável (RF-CONT-008), distinto de 'tipo'.
create table public.categoria_conteudo (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Conteúdo externo (Hub não hospeda mídia — RN-CONT-002/003). Só 'publicado'
-- aparece no Hub (RN-CONT-004/005/006). Link abre em nova aba (RN-CONT-007).
create table public.conteudo (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  descricao     text,
  thumbnail     text,                          -- path/URL (bucket conteudos)
  categoria_id  uuid references public.categoria_conteudo (id) on delete set null,
  tipo          text not null check (tipo in ('video', 'playlist', 'noticia', 'entrevista', 'podcast')),
  plataforma    text,
  link          text not null,                 -- URL externa
  status        text not null default 'draft' check (status in ('draft', 'pendente', 'publicado', 'desabilitado')),
  destaque      boolean not null default false,
  ordem         integer not null default 0,
  data          date,                          -- data de referência do conteúdo
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index conteudo_categoria_idx on public.conteudo (categoria_id);
create index conteudo_status_ordem_idx on public.conteudo (status, ordem);

-- =============================================================================
-- 6. Obras & Colaborações (Plano 06) — modules/GESTAO_OBRAS_E_COLABORACOES
-- =============================================================================
-- Coleção (álbum/EP). Sem controle de status no MVP (RN-OBRA-009).
create table public.colecao (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  descricao       text,
  tipo            text not null check (tipo in ('album', 'EP')),
  cover_image     text,                        -- path/URL (bucket obras)
  data_lancamento date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Música: pode pertencer a no máx. 1 coleção (N:1) ou existir sem coleção (RN-OBRA-003/004).
create table public.musica (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  data_lancamento date,
  duracao         interval,                    -- tempo da faixa
  isrc            text,                         -- código internacional de gravação
  cover_image     text,                        -- path/URL (bucket obras)
  colecao_id      uuid references public.colecao (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index musica_colecao_idx on public.musica (colecao_id);
create index musica_lancamento_idx on public.musica (data_lancamento desc);

-- Colaborador.
create table public.colaborador (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  instagram   text,
  linkedin    text,
  descricao   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Role: tipo de participação dinâmico (RN-OBRA-005).
create table public.role (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Vínculo obra (música XOR coleção) × colaborador × role (RF-OBRA-009, RN-OBRA-006/007).
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

-- Link de plataforma por música XOR coleção (discriminador — RF-OBRA-010). Nova aba (RN-OBRA-008).
create table public.link_plataforma (
  id          uuid primary key default gen_random_uuid(),
  musica_id   uuid references public.musica (id) on delete cascade,
  colecao_id  uuid references public.colecao (id) on delete cascade,
  plataforma  text not null,                   -- Spotify, Deezer, Apple Music, Amazon Music, YouTube
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

-- =============================================================================
-- Triggers set_updated_at (toda tabela com updated_at)
-- =============================================================================
create trigger set_updated_at before update on public.admin_user          for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tela                 for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.marquee              for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.marquee_tela         for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.marquee_item         for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.banner               for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.banner_tela          for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.status_evento        for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.evento               for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.categoria_conteudo   for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.conteudo             for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.colecao              for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.musica               for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.colaborador          for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.role                 for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.obra_colaborador     for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.link_plataforma      for each row execute function public.set_updated_at();

-- =============================================================================
-- RLS — habilitar em TODA tabela + política única (autenticado + ativo → CRUD)
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'audit_log', 'admin_user', 'tela', 'marquee', 'marquee_tela', 'marquee_item',
    'banner', 'banner_tela', 'status_evento', 'evento', 'categoria_conteudo',
    'conteudo', 'colecao', 'musica', 'colaborador', 'role', 'obra_colaborador',
    'link_plataforma'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$
      create policy admin_full_access on public.%I
        for all to authenticated
        using (public.is_active_admin())
        with check (public.is_active_admin());
    $f$, t);
  end loop;
end $$;

-- Reduz superfície de descoberta para o papel anon (advisors 0026/0028):
-- admin_user/audit_log não devem ser visíveis sem login; is_active_admin é uso
-- interno de RLS (o papel authenticated mantém execute, exigido pelas policies).
revoke select on public.admin_user from anon;
revoke select on public.audit_log from anon;
revoke select on public.tela from anon;
revoke select on public.marquee from anon;
revoke select on public.marquee_tela from anon;
revoke select on public.marquee_item from anon;
revoke execute on function public.is_active_admin() from public, anon;
grant execute on function public.is_active_admin() to authenticated;

-- =============================================================================
-- Seed mínimo — status de evento pré-cadastrados (RF-EVENTO-004)
-- "Expirado" NÃO é seedado (rótulo virtual). 1º admin é criado no Plano 01
-- (depende de auth.users; ver seed.sql / fluxo de implantação — RN-LOGIN-006).
-- =============================================================================
insert into public.status_evento (nome, lifecycle, protegido) values
  ('Ingressos a venda', 'Em aberto', false),
  ('Esgotado',          'Em aberto', false),
  ('Adiado',            'Em aberto', true),
  ('Sucesso',           'Encerrado', false),
  ('Cancelado',         'Encerrado', false)
on conflict (nome) do nothing;
