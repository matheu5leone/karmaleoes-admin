# Orçamento de Desenvolvimento — Portal Admin Karmaleões

**Data:** 2026-05-31
**Escopo:** Plataforma administrativa (Admin) **apenas**. Hub público e módulo de Fãs ficam **fora**.
**Stack:** Next.js (App Router) + Supabase (Postgres / Storage) + Redis.
**Fonte:** `docs/superpowers/specs/2026-05-25-karmaleoes-admin-design.md` + `modules/*`.

---

## 1. Premissas

- 1 dev fullstack pleno/sênior como linha-base de esforço; designer em paralelo (track de UI/UX).
- **1 homem-dia (hd) = 8 h** de esforço técnico (não é dia de calendário).
- Base de UI sobre **shadcn/ui** + Tailwind (não é design do zero pixel a pixel).
- Auth com **Supabase Auth nativo**: login por **e-mail + senha**, MFA **TOTP** nativo do Supabase. CPF **removido** do usuário admin. Permanecem como custom: sessão única em Redis e recuperação via SMS de terceiro (Twilio/Zenvia). Custos de licença/uso de SMS-gateway **não** inclusos.
- Estimativas em faixa **otimista–pessimista**; o valor "Base" é o ponto de planejamento.
- **Excluídos:** Hub, módulo de Fãs (8), gestão de projeto, QA manual e buffer de risco (ver §5).

---

## 2. Esforço por módulo (desenvolvimento, sem testes)

| # | Módulo | Principais entregas | Otim. (h) | Base (h) | Pess. (h) |
|---|--------|---------------------|----------:|---------:|----------:|
| 1 | **Autenticação / Sessão** | E-mail+senha + TOTP via Supabase Auth nativo, 1º acesso (senha temp→enroll TOTP), recuperação SMS, sessão única (Redis), timeout, CRUD de usuários, seed 1º admin | 40 | 48 | 62 |
| 2 | **Telas, Navegação e Marquees** | CRUD telas, CRUD marquees (N:N), itens com ordenação e navegação interna/externa, validações | 36 | 44 | 52 |
| 3 | **Banners por tela** | Banner asset + associação Banner×Tela, máquina de publicação (1 publicado/tela, auto-revert), regras de tela habilitada | 30 | 36 | 44 |
| 4 | **Eventos** | CRUD, status dinâmicos por lifecycle (protegidos), encerramento manual com regras de data, Adiado/nova data, Enable, prioridade, **expiração por campos virtuais** (`status_efetivo`/`enable_efetivo`, sem job) | 50 | 62 | 74 |
| 5 | **Conteúdos Digitais** | CRUD conteúdo, CRUD categorias, status editorial, destaque, ordenação manual | 32 | 38 | 46 |
| 6 | **Obras e Colaborações** | CRUD músicas/coleções/colaboradores/roles, relação N:1 e N:N, links de plataforma (discriminador), ordenação por lançamento | 48 | 58 | 68 |
| 7 | **Propostas Comerciais** | Tabela + listagem + detalhe + filtros (estado/cidade) — **somente leitura** | 12 | 16 | 20 |
| | **Subtotal módulos** | | **248** | **302** | **366** |

---

## 3. Esforço transversal (fundação)

| Item | Descrição | Otim. (h) | Base (h) | Pess. (h) |
|------|-----------|----------:|---------:|----------:|
| Scaffolding & arquitetura | Next App Router, clients Supabase/Redis, estrutura, lint, env | 10 | 12 | 16 |
| Shell do admin | Layout, navegação, rotas protegidas, middleware de sessão | 20 | 24 | 30 |
| Auditoria de escrita | Interceptor reutilizável (create/update/delete) p/ todos os módulos | 10 | 12 | 16 |
| Upload de imagens | Componente reutilizável sobre Supabase Storage | 6 | 8 | 10 |
| Padrões de CRUD | Tabelas, forms, validação (zod), toasts, paginação/filtros | 14 | 16 | 22 |
| **Subtotal fundação** | | **60** | **72** | **94** |

---

## 4. Tracks adicionais (selecionados)

| Track | Descrição | Otim. (h) | Base (h) | Pess. (h) |
|-------|-----------|----------:|---------:|----------:|
| **Testes automatizados** | Testes por módulo (roteiros `TESTES.md`) + infra (Vitest/Playwright, fixtures, harness Supabase) | 80 | 96 | 112 |
| **UI/UX Design** | Identidade visual, telas-chave (login, listagens, forms, dashboard), responsivo, tokens | 48 | 64 | 80 |
| **Infra & Deploy** | Setup Supabase (ambientes), Redis (Upstash), CI/CD (Vercel), env, integração SMS/TOTP, logs | 32 | 40 | 48 |
| **Subtotal tracks** | | **160** | **200** | **240** |

---

## 5. Total

| Bloco | Otim. (h) | Base (h) | Pess. (h) |
|-------|----------:|---------:|----------:|
| Módulos (§2) | 248 | 302 | 366 |
| Fundação (§3) | 60 | 72 | 94 |
| Tracks: testes + design + infra (§4) | 160 | 200 | 240 |
| **TOTAL (horas)** | **468** | **574** | **700** |
| **TOTAL (homem-dia, 8h)** | **≈ 59 hd** | **≈ 72 hd** | **≈ 88 hd** |

### Cronograma indicativo (1 dev + designer em paralelo)
- ~6 h produtivas/dia útil → **base ≈ 96 dias úteis ≈ 19 semanas** solo.
- Com 2 devs fullstack: **≈ 10–12 semanas** (após a fundação, módulos paralelizam bem).

---

## 6. Adicionais recomendados (não inclusos)

Você optou por **não** incluir gestão/QA/buffer. Para uma proposta comercial, recomenda-se somar:

| Item | Acréscimo típico |
|------|------------------|
| Gestão de projeto / coordenação | +10–15% |
| QA manual / homologação | +8–12% |
| Buffer de risco (auth custom é o maior risco) | +10–15% |

Aplicando ~**+30%** sobre a base: **≈ 746 h ≈ 93 homem-dia**.

---

## 7. Riscos e observações

- **Auth (módulo 1):** com login por **e-mail**, usa-se o Supabase Auth nativo (e-mail+senha + MFA TOTP), o que **reduz o risco** antes apontado. Custom remanescente: sessão única (Redis) e recuperação por SMS — esta última ainda depende de homologação do gateway. (Alternativa de menor custo: recuperação por e-mail nativa do Supabase, se aceitável.)
- **Expiração de eventos (módulo 4):** resolvida por **campos virtuais** (`status_efetivo`/`enable_efetivo`) calculados na leitura — **sem job/cron**. Reduz risco e infra (sem pg_cron/Vercel Cron, sem idempotência, sem fuso de job). Atenção apenas em garantir o cálculo consistente em todas as leituras (view SQL / camada de query) e definir a data corrente/fuso de comparação.
- Definições deixadas para o dev na doc (formatos de upload, timeout de sessão, fuso) podem mover ±5%.
- Custos recorrentes de terceiros (SMS, Supabase, Redis/Upstash, Vercel) são **operacionais**, fora deste orçamento de desenvolvimento.
