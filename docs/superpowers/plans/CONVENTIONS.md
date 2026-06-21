# Convenções Técnicas — Portal Admin Karmaleões

> Documento de referência compartilhado por **todos** os planos em `docs/superpowers/plans/`.
> Cada plano assume estas convenções e **não** as repete. Atualize aqui quando uma decisão transversal mudar.

**Escopo:** apenas o Admin. Hub público e os módulos de Fãs e Propostas Comerciais estão fora (ver [design](../specs/2026-05-25-karmaleoes-admin-design.md)).

---

## 1. Stack fixada

| Camada | Decisão |
|--------|---------|
| Framework | **Next.js (App Router, 15+)**, TypeScript. Mutations via **Server Actions**. |
| Banco/Auth/Storage | **Supabase** — Postgres + Auth (e-mail+senha + **MFA TOTP** nativo) + Storage. |
| Acesso a dados | **supabase-js** (`@supabase/ssr` no server) + **migrations SQL** versionadas via **Supabase CLI** (`supabase/migrations/*.sql`). Sem ORM. |
| Cache/sessão | **Redis (Upstash)** via `@upstash/redis` — sessão única e timeout de inatividade. |
| UI | **shadcn/ui** + Tailwind. Formulários com **react-hook-form** + **zod**. |
| Validação | **zod** (compartilhada entre form e server action). |
| Testes | **Vitest** (unit/integration) + **Playwright** (e2e), rodando contra **Supabase local** (`supabase start`). |
| Recuperação de senha | **Por e-mail** (fluxo nativo do Supabase Auth — reset/magic link). Sem SMS. |
| Gerenciador de pacotes | **pnpm**. |
| Lint/format | ESLint + Prettier. |
| Execução | **Local em Docker** (`docker-compose`: `web` + `redis` + `redis-http`); **deploy na Vercel é nativo** (sem Docker). Supabase é remoto em ambos. |
| CI/CD | GitHub Actions (lint, typecheck, unit, e2e) → deploy **Vercel** (build nativo do Next). |

---

## 2. Estrutura de pastas

```
app/
  (auth)/                  # rotas públicas de auth
    login/
    recuperar-senha/
    configurar-2fa/
  (admin)/                 # rotas protegidas (layout com guarda de sessão)
    usuarios/
    telas/  marquees/
    banners/
    eventos/  eventos/status/
    conteudos/  conteudos/categorias/
    obras/  obras/colaboradores/  obras/roles/
    layout.tsx
  layout.tsx
  middleware.ts            # valida sessão + sessão única (Redis)
lib/
  supabase/ server.ts client.ts admin.ts   # clients (anon, server-ssr, service-role)
  redis.ts                 # client Upstash + helpers de sessão
  audit.ts                 # helper de auditoria de escrita
  storage.ts               # helpers de upload (Supabase Storage)
  validation/              # schemas zod por entidade
components/
  ui/                      # shadcn
  data-table/  form/       # padrões reutilizáveis (listagem, form, upload, confirm)
supabase/
  migrations/*.sql
  seed.sql                 # 1º admin + status de evento pré-cadastrados
tests/
  unit/  integration/  e2e/
```

**Regra:** arquivos que mudam juntos vivem juntos (split por responsabilidade, não por camada). Arquivos pequenos e focados.

---

## 3. Banco de dados

- **Nomenclatura:** tabelas/colunas em `snake_case`; PKs `id uuid default gen_random_uuid()`; timestamps `created_at`/`updated_at` (trigger `set_updated_at`).
- **RLS:** habilitado em **todas** as tabelas. MVP sem RBAC → política única: usuário **autenticado e ativo** tem acesso integral (CRUD). Leitura/escrita negadas a anônimos.
- **Migrations:** uma migration por mudança, idempotentes onde possível, nomeadas `NNNN_descricao.sql`. Nunca editar migration já aplicada — criar nova.
- **Seed:** `supabase/seed.sql` cria o 1º admin (RN-LOGIN-006) e os status de evento pré-cadastrados (Ingressos a venda, Esgotado, Adiado, Sucesso, Cancelado — **"Expirado" não é seedado**, é virtual).

### Eventos — campos virtuais (sem job)
Expor via **view SQL** `eventos_view` (ou função) que calcula na leitura, comparando `now()` (fuso a definir) com a data de referência:
- `expirado` = data atual passou da data de referência (`data`, ou `nova_data` se status Adiado);
- `status_efetivo` = `'Expirado'` se `expirado` e lifecycle `'Em aberto'`; senão status armazenado;
- `enable_efetivo` = `enable` armazenado **AND NOT** `expirado`.

Toda leitura de eventos (admin e futuro Hub) consome a **view**, nunca recalcula a regra na aplicação.

---

## 4. Autenticação & sessão (resumo — detalhe no plano 01)

- Login **e-mail + senha** via Supabase Auth; **MFA TOTP** nativo (enroll no 1º acesso, challenge nos seguintes).
- **Sessão única:** ao logar, grava `session:{user_id}` no Redis com o id da sessão atual; `middleware.ts` rejeita requisições cujo id não bate (login novo invalida o anterior).
- **Timeout de inatividade:** TTL no Redis renovado a cada request autenticado; expirado → redireciona para login.
- **Recuperação:** **por e-mail** (informa e-mail → link/código de redefinição por e-mail → nova senha), via Supabase Auth nativo. Sem SMS.
- **Usuários:** sem auto-registro; CRUD interno; e-mail único/imutável; **telefone opcional** (contato); CPF **não** existe no admin.

---

## 5. Auditoria de escrita (RF-LOGIN-006)

- Tabela `audit_log` (id, user_id, acao `create|update|delete`, entidade, registro_id, data_hora, diff opcional).
- **Nível de aplicação:** helper `audit(...)` chamado dentro de **toda Server Action de escrita** (módulos 1–6). Leituras não auditadas.
- Centralizado em `lib/audit.ts`; cada plano de módulo invoca o helper em create/update/delete.

---

## 6. Storage de imagens (Supabase Storage)

- Buckets por domínio: `banners`, `conteudos`, `obras` (+ `marquees` se item tiver imagem).
- Upload pela Server Action → `lib/storage.ts`; persiste o **path/URL** na entidade.
- Acesso conforme sensibilidade (público com CDN para assets exibidos; signed URL se privado).
- Saída futura para S3/R2 viável pela compatibilidade S3.

---

## 7. Testes & Definition of Done

**TDD obrigatório** (skill `superpowers:test-driven-development`): teste falhando → implementação mínima → teste passa → commit.

- **Unit (Vitest):** regras de negócio puras (ex.: cálculo de expiração, máquina de publicação de banner, validações zod).
- **Integration (Vitest + Supabase local):** Server Actions + migrations + RLS.
- **E2E (Playwright):** os roteiros `modules/*/TESTES.md` de cada módulo.

**DoD de cada módulo:**
- [ ] Migrations aplicadas + RLS + seed quando aplicável
- [ ] Server Actions com validação zod e **auditoria** nas escritas
- [ ] Unit + integration + e2e cobrindo os RF/RN e o `TESTES.md` do módulo
- [ ] `pnpm lint && pnpm typecheck` verdes
- [ ] Telas (listagem/form/detalhe) com padrões reutilizáveis
- [ ] Links externos abrem em **nova aba** (onde aplicável)

---

## 8. Commits & execução

- Commits **frequentes e pequenos**, convencionais: `feat:`, `fix:`, `test:`, `chore:`, `refactor:`.
- Trabalhar em branch por módulo (não na `main`).
- Cada plano é executável via `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans`.
