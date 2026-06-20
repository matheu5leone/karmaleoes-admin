# Transversal — Autenticação TOTP, Sessão Única & Timeout

> Mecanismos de segurança usados por **toda** a aplicação. Consumido pelo Plano 00 (middleware stub) e
> detalhado/ativado no Plano 01. Specs-fonte: `modules/AUTENTICACAO_LOGIN_CONTROLE_SESSAO/*`
> (RF-LOGIN-001/002/003/004/007, RN-LOGIN-003/004/005).

## 1. Autenticação base (Supabase Auth nativo)

- Login por **e-mail + senha** via Supabase Auth.
- **Recuperação de senha por e-mail** (fluxo nativo: link/código de redefinição). **Sem SMS.**
- Telefone do usuário é **opcional** (contato); CPF **não** existe no admin.
- Somente usuários **previamente cadastrados e ativos** autenticam (RN-LOGIN-001/004).

## 2. MFA TOTP (RF-LOGIN-002 / RF-LOGIN-007)

Usa o **MFA TOTP nativo do Supabase Auth** — compatível com Google/Microsoft Authenticator, Authy.

**Primeiro acesso (enroll):**
1. Admin cadastra usuário (e-mail + senha temporária).
2. No 1º login, após validar e-mail+senha, o sistema chama `auth.mfa.enroll()` e exibe o **QR code**.
3. Usuário escaneia e valida com o **primeiro código** → `auth.mfa.verify()`.
4. Marca `admin_user.two_factor_configured = true`. A partir daí, TOTP é exigido em todo login.

**Logins seguintes (challenge):**
1. e-mail + senha → `auth.mfa.challenge()` → usuário informa o código TOTP → `auth.mfa.verify()`.
2. Sessão só é considerada **AAL2** (autenticada com 2FA) após o verify.

**Telas:** `app/(auth)/configurar-2fa/` (enroll/QR) e o passo de challenge no fluxo de `login/`.

## 3. Sessão única (RF-LOGIN-004 / RN-LOGIN-003)

Único custom relevante da camada de auth. Apenas **uma sessão ativa** por usuário.

- Ao concluir o login (pós-TOTP), gerar um `session_id` e gravar no Redis:
  `set("session:{user_id}", session_id)` (sobrescreve o anterior → login novo **invalida** o anterior).
- O `session_id` corrente acompanha a requisição (cookie próprio ou claim).
- `middleware.ts` lê `session:{user_id}` e **rejeita** requisições cujo `session_id` não bate →
  redireciona para `login`.

## 4. Timeout de inatividade (RN-LOGIN-005)

- A chave `session:{user_id}` no Redis tem **TTL renovável**: cada request autenticado renova o TTL.
- Expirado o TTL (sem atividade) → middleware trata como sessão inválida → redireciona para `login`.
- **Duração do timeout:** lacuna a definir pelo dev (valor do TTL).

## 5. Guarda no middleware

`middleware.ts` (criado como stub no Plano 00, ativado no Plano 01) executa, para rotas `(admin)`:
1. Valida o cookie/sessão do Supabase Auth (e nível **AAL2**).
2. Valida a **sessão única** + **TTL** no Redis (§3, §4).
3. Confirma que o `admin_user` está **ativo** (RN-LOGIN-004).
4. Falha em qualquer passo → redirect para `login`.

## 6. Pontos de teste

- **Integration:** invalidação de sessão anterior ao logar em "novo dispositivo"; expiração por TTL;
  bloqueio de usuário inativo.
- **E2E (Playwright):** roteiros `TESTES.md` do Módulo 1 (TC-LOGIN-*) — enroll TOTP, challenge,
  recuperação por e-mail, sessão única.

## 7. Implementação relacionada

- `lib/redis.ts` — client Upstash + helpers `setSession/getSession/invalidateSession/touchTTL`.
- `lib/supabase/server.ts` — client SSR para ler a sessão do Auth no middleware/Server Components.
- Tabela `admin_user` e CRUD de usuários: [`01-autenticacao-e-sessao.md`](./01-autenticacao-e-sessao.md).
