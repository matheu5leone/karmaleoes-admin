# Plano 01 — Autenticação & Controle de Sessão (Módulo 1)

> **Objetivo:** autenticação e-mail+senha+TOTP, recuperação por e-mail, sessão única, timeout e CRUD de
> usuários, com auditoria.
>
> **Specs-fonte:** [`modules/AUTENTICACAO_LOGIN_CONTROLE_SESSAO/`](../../modules/AUTENTICACAO_LOGIN_CONTROLE_SESSAO/AUTENTICACAO_LOGIN_CONTROLE_SESSAO.md)
> (RF-LOGIN-001..007, RN-LOGIN-001..007) + [`TESTES.md`](../../modules/AUTENTICACAO_LOGIN_CONTROLE_SESSAO/TESTES.md).
> **Mecanismos transversais:** [`transversal-totp-e-sessao.md`](./transversal-totp-e-sessao.md).
> **Depende de:** 00. **Próximo:** 02–06 (paralelizáveis em cadência sequencial).

## 1. Modelo de dados

**`admin_user`** (integrado ao `auth.users` do Supabase):

| Coluna | Tipo | Regra |
|--------|------|-------|
| `id` | uuid PK | vincula a `auth.users.id` |
| `email` | text | **único, imutável** após criação (RN-LOGIN-007) — identificador de login |
| `telefone` | text null | **opcional** (contato); recuperação é por e-mail |
| `status` | text `ativo\|inativo` | inativo não autentica (RN-LOGIN-004) |
| `two_factor_configured` | bool | `false` até concluir 1º acesso (RF-LOGIN-007) |
| `created_at`/`updated_at` | timestamptz | trigger `set_updated_at` |

- **RLS:** `is_active_admin()` (CRUD para autenticado+ativo).
- **Seed** (`supabase/seed.sql`): 1º admin criado na implantação (RN-LOGIN-006) — sem auto-registro.

## 2. Server Actions (validação zod + auditoria)

| Ação | Entrada (zod) | Regras |
|------|---------------|--------|
| `criarUsuario` | email, senha temporária, telefone? | e-mail único; cria em `auth.users` + `admin_user`; auditoria `create` |
| `editarUsuario` | id, telefone | e-mail **não** editável; auditoria `update` |
| `ativarDesativarUsuario` | id, status | inativo não autentica; auditoria `update` |

Login, challenge TOTP, enroll e recuperação usam o **Supabase Auth nativo** (ver doc transversal) —
não são Server Actions de escrita de domínio (não auditadas como CRUD de entidade).

## 3. Telas

- `app/(auth)/login/` — e-mail+senha → challenge TOTP.
- `app/(auth)/configurar-2fa/` — enroll TOTP (QR + validação 1º código) no 1º acesso.
- `app/(auth)/recuperar-senha/` — solicitação + redefinição por e-mail.
- `app/(admin)/usuarios/` — listagem (`data-table`) + form de cadastro/edição + ação ativar/desativar.

## 4. Mecanismos de sessão

Implementar conforme [`transversal-totp-e-sessao.md`](./transversal-totp-e-sessao.md): **sessão única**
(Redis, invalida anterior), **timeout** (TTL renovável) e **ativação** do `middleware.ts` (stub do Plano 00).

## 5. Sequência de tarefas (TDD)

1. Migration `admin_user` + RLS + vínculo `auth.users`; seed 1º admin.
2. Login e-mail+senha → challenge MFA TOTP (RF-LOGIN-001/002).
3. 1º acesso: senha temporária → enroll TOTP (QR) → validação (RF-LOGIN-007).
4. Sessão única (Redis) + ativar `middleware.ts` (RF-LOGIN-004 / RN-003).
5. Timeout de inatividade — TTL renovável (RN-LOGIN-005).
6. Recuperação por e-mail (Supabase nativo) — sem SMS (RF-LOGIN-003).
7. CRUD de usuários (e-mail imutável/único; telefone opcional; inativo não loga) + auditoria (RF-LOGIN-005).
8. E2E dos roteiros `TESTES.md` (TC-LOGIN-*).

## 6. Mapeamento de testes

- **Unit:** schemas zod (e-mail único/formato, status), helpers de sessão Redis.
- **Integration:** CRUD de usuários + RLS + auditoria; invalidação de sessão; bloqueio de inativo.
- **E2E:** `modules/AUTENTICACAO_LOGIN_CONTROLE_SESSAO/TESTES.md`.

## 7. Definition of Done

- [ ] Migration + RLS + seed aplicados.
- [ ] Login com TOTP, recuperação por e-mail, sessão única e timeout funcionando.
- [ ] CRUD de usuários com auditoria; e-mail imutável; inativo não autentica.
- [ ] Unit + integration + e2e cobrindo RF/RN e o `TESTES.md`.
- [ ] `pnpm lint && pnpm typecheck` verdes.

## 8. Riscos

- **Sessão única (Redis)** é o principal custom — cobrir bem por integração/e2e.
- 2FA e recuperação são **nativos do Supabase Auth** (e-mail + TOTP), sem dependência de SMS → baixo risco.
