# Transversal — Banco de Dados, RLS & Migrations

> Reutilizado por **todos** os módulos. Centraliza as convenções de schema, a política de RLS e a
> disciplina de migrations. Base: [`CONVENTIONS.md §3`](../superpowers/plans/CONVENTIONS.md).

## 1. Convenções de schema

- **Nomenclatura:** tabelas e colunas em `snake_case`.
- **Chave primária:** `id uuid primary key default gen_random_uuid()` (extensão `pgcrypto`).
- **Timestamps:** `created_at timestamptz not null default now()` e `updated_at timestamptz not null default now()`.
- **Trigger `set_updated_at`:** função compartilhada que atualiza `updated_at` em cada `UPDATE`. Criada na
  migration base (Plano 00) e aplicada por trigger em toda tabela com `updated_at`.
- **FKs:** sempre com `on delete` explícito (`restrict` por padrão; `cascade` apenas em tabelas de junção).
- **Enums:** preferir `text` + `check (coluna in (...))` para flexibilidade de migration, salvo quando o
  domínio for estável (decisão por tabela, documentada na migration).

## 2. RLS (Row-Level Security)

- **Habilitado em todas as tabelas** (`alter table ... enable row level security`).
- **MVP sem RBAC** → política única: usuário **autenticado e ativo** (`admin_user.status = 'ativo'`) tem
  acesso integral (select/insert/update/delete). Anônimos: negado.
- Implementar via função auxiliar `is_active_admin()` (checa `auth.uid()` contra `admin_user` ativo),
  reutilizada nas policies de cada tabela.
- A escrita de fato ocorre por **Server Actions** no servidor; a RLS é a barreira de defesa em profundidade.

## 3. Migrations

- **Uma migration por mudança**, nomeada `NNNN_descricao.sql`, idempotente onde possível.
- **Nunca editar** uma migration já aplicada — criar uma nova.
- Ordem de criação acompanha a sequência dos planos (00 → 06).
- **Seed** (`supabase/seed.sql`): 1º admin (RN-LOGIN-006) e status de evento pré-cadastrados
  (Ingressos a venda, Esgotado, Adiado, Sucesso, Cancelado — **"Expirado" não é seedado**, é virtual).

## 4. Padrão da view de eventos (sem job)

Eventos expõem campos virtuais por **view SQL** `eventos_view`, calculada na leitura (nunca na aplicação):

- `expirado` = data atual ultrapassou a **data de referência** (`data`, ou `nova_data` se status "Adiado");
- `status_efetivo` = `'Expirado'` se `expirado` **e** lifecycle `'Em aberto'`; senão o status armazenado;
- `enable_efetivo` = `enable` armazenado **AND NOT** `expirado`.

Toda leitura de eventos (admin e futuro Hub) consome a **view**. Detalhe em [`04-eventos.md`](./04-eventos.md).
A data corrente/fuso de comparação é uma **lacuna** a definir pelo dev (documentar na própria view).

## 5. Checklist por tabela

- [ ] PK uuid + `created_at`/`updated_at` + trigger `set_updated_at`
- [ ] RLS habilitado + policy `is_active_admin()`
- [ ] FKs com `on delete` explícito
- [ ] Índices em FKs e colunas de filtro/ordenação frequentes
- [ ] Migration nomeada `NNNN_descricao.sql`, não destrutiva sobre dados existentes
