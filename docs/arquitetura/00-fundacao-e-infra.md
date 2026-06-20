# Plano 00 — Fundação & Infra

> **Objetivo:** repositório executável com shell admin protegido, clients, padrões reutilizáveis, CI e
> infra provisionada. É a base de todos os módulos seguintes.
>
> **Specs-fonte:** transversais — [`CONVENTIONS.md`](../superpowers/plans/CONVENTIONS.md),
> [`ARQUITETURA.md`](../../ARQUITETURA.md), [`VISAO_GERAL.md §Padrões`](../../VISAO_GERAL.md).
> **Depende de:** —. **Próximo:** [`01-autenticacao-e-sessao.md`](./01-autenticacao-e-sessao.md).

## 1. Escopo

Scaffold + infra + padrões reutilizáveis. **Não** implementa regra de negócio de módulo; entrega o
esqueleto onde os módulos 1–6 plugam.

## 2. Modelo de dados (migration base)

- Extensão `pgcrypto` (para `gen_random_uuid()`).
- Função/trigger `set_updated_at` (compartilhada — ver [`transversal-banco-rls-migrations.md`](./transversal-banco-rls-migrations.md)).
- Tabela `audit_log` + RLS (ver [`transversal-auditoria.md`](./transversal-auditoria.md)).
- Função auxiliar `is_active_admin()` (base da policy de RLS; usada pelos módulos).

## 3. Infra & bibliotecas

- `lib/supabase/{server,client,admin}.ts` — clients anon, server-SSR (`@supabase/ssr`) e service-role.
- `lib/redis.ts` — client Upstash + helpers de sessão (set/get/invalidate/touchTTL).
- `lib/audit.ts` — helper de auditoria (ver doc transversal).
- `lib/storage.ts` — upload/remover/URL (ver [`transversal-storage-imagens.md`](./transversal-storage-imagens.md)); buckets `banners`, `conteudos`, `obras`, `marquees`.
- `middleware.ts` — **stub** de guarda de sessão (ativado no Plano 01; ver [`transversal-totp-e-sessao.md`](./transversal-totp-e-sessao.md)).

## 4. Shell & padrões de UI

- `app/(admin)/layout.tsx` — navegação lateral + área protegida.
- `app/(auth)/` — rotas públicas de auth (placeholders até Plano 01).
- Padrões reutilizáveis em `components/`:
  - `data-table/` — listagem com filtro, ordenação e paginação.
  - `form/` — campos + integração react-hook-form + zod + submit/toast.
  - `ImageUpload` — upload sobre `lib/storage.ts`.
  - `ConfirmDialog` — confirmação de ações destrutivas.
  - toasts (feedback de Server Actions).

## 5. Harness de testes & CI

- Vitest config (unit/integration) + Playwright config (e2e) contra **Supabase local**.
- Helpers de Supabase local (reset/seed entre testes) + smoke e2e (app sobe, redireciona p/ login).
- GitHub Actions: `lint`, `typecheck`, `vitest`, `playwright`.
- Ambientes Vercel + `.env.example` (Supabase, Upstash, e-mail).

## 6. Sequência de tarefas (TDD)

1. Scaffold Next.js (App Router, TS) + pnpm + ESLint/Prettier + Tailwind + shadcn init.
2. `supabase init`/`start`; clients Supabase.
3. `lib/redis.ts` + helpers de sessão (teste de set/get/invalidate/TTL).
4. Migration base (`pgcrypto`, `set_updated_at`, `audit_log`+RLS, `is_active_admin()`); `lib/audit.ts` (teste).
5. `lib/storage.ts` + buckets; `ImageUpload` (teste de upload).
6. Shell admin + `middleware.ts` stub + padrões `data-table`/`form`/`ConfirmDialog`.
7. Harness Vitest/Playwright + smoke e2e; GitHub Actions.

## 7. Definition of Done

- [ ] App sobe local; `pnpm lint && pnpm typecheck && pnpm test` verdes.
- [ ] CI passa (lint/typecheck/unit/e2e).
- [ ] `audit()` e `ImageUpload` cobertos por teste.
- [ ] Migration base aplicada com RLS; `is_active_admin()` disponível.
- [ ] Shell protegido renderiza; middleware stub redireciona rota protegida sem sessão.

## 8. Riscos

- Configuração de Supabase local + Playwright na CI (tempo de setup). Mitigar com helpers e cache.
- Contrato dos helpers (`audit`, `storage`, `redis`) precisa estar estável antes dos módulos — tratá-los
  como API interna versionada.
