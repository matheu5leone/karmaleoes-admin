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
- Auth com **Supabase Auth nativo**: login por **e-mail + senha**, MFA **TOTP** nativo, **recuperação de senha por e-mail** (nativa). Sem SMS. CPF **removido** do usuário admin; telefone **opcional** (contato). Único custom relevante: sessão única em Redis.
- Estimativas em faixa **otimista–pessimista**; o valor "Base" é o ponto de planejamento.
- **Excluídos:** Hub, módulo de Fãs (8), gestão de projeto, QA manual e buffer de risco (ver §5).

---

## 2. Esforço por módulo (desenvolvimento, sem testes)

| # | Módulo | Principais entregas | Otim. (h) | Base (h) | Pess. (h) |
|---|--------|---------------------|----------:|---------:|----------:|
| 1 | **Autenticação / Sessão** | E-mail+senha + TOTP via Supabase Auth nativo, 1º acesso (senha temp→enroll TOTP), recuperação por e-mail (nativa), sessão única (Redis), timeout, CRUD de usuários, seed 1º admin | 36 | 43 | 56 |
| 2 | **Telas, Navegação e Marquees** | CRUD telas, CRUD marquees (N:N), itens com ordenação e navegação interna/externa, validações | 36 | 44 | 52 |
| 3 | **Banners por tela** | Banner asset + associação Banner×Tela, máquina de publicação (1 publicado/tela, auto-revert), regras de tela habilitada | 30 | 36 | 44 |
| 4 | **Eventos** | CRUD, status dinâmicos por lifecycle (protegidos), encerramento manual com regras de data, Adiado/nova data, Enable, prioridade, **expiração por campos virtuais** (`status_efetivo`/`enable_efetivo`, sem job) | 50 | 62 | 74 |
| 5 | **Conteúdos Digitais** | CRUD conteúdo, CRUD categorias, status editorial, destaque, ordenação manual | 32 | 38 | 46 |
| 6 | **Obras e Colaborações** | CRUD músicas/coleções/colaboradores/roles, relação N:1 e N:N, links de plataforma (discriminador), ordenação por lançamento | 48 | 58 | 68 |
| 7 | **Propostas Comerciais** | Tabela + listagem + detalhe + filtros (estado/cidade) — **somente leitura** | 12 | 16 | 20 |
| | **Subtotal módulos** | | **244** | **297** | **360** |

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
| **Infra & Deploy** | Setup Supabase (ambientes), Redis (Upstash), CI/CD (Vercel), env, e-mail transacional (Supabase Auth), logs | 28 | 36 | 44 |
| **Subtotal tracks** | | **156** | **196** | **236** |

---

## 5. Total

| Bloco | Otim. (h) | Base (h) | Pess. (h) |
|-------|----------:|---------:|----------:|
| Módulos (§2) | 244 | 297 | 360 |
| Fundação (§3) | 60 | 72 | 94 |
| Tracks: testes + design + infra (§4) | 156 | 196 | 236 |
| **TOTAL (horas)** | **460** | **565** | **690** |
| **TOTAL (homem-dia, 8h)** | **≈ 58 hd** | **≈ 71 hd** | **≈ 86 hd** |
| **TOTAL (R$ a R$ 110/h)** | **R$ 50.600** | **R$ 62.150** | **R$ 75.900** |

### Cronograma indicativo (1 dev + designer em paralelo)
- ~6 h produtivas/dia útil → **base ≈ 94 dias úteis ≈ 19 semanas** solo.
- Com 2 devs fullstack: **≈ 10–12 semanas** (após a fundação, módulos paralelizam bem).

---

## 6. Adicionais recomendados (não inclusos)

Você optou por **não** incluir gestão/QA/buffer. Para uma proposta comercial, recomenda-se somar:

| Item | Acréscimo típico |
|------|------------------|
| Gestão de projeto / coordenação | +10–15% |
| QA manual / homologação | +8–12% |
| Buffer de risco (sessão única em Redis é o principal custom) | +10–15% |

Aplicando ~**+30%** sobre a base: **≈ 735 h ≈ 92 homem-dia ≈ R$ 80.850**.

---

## 7. Riscos e observações

- **Auth (módulo 1):** login, MFA TOTP e **recuperação por e-mail** usam o Supabase Auth **nativo** — sem SMS e sem dependência externa de gateway. Custom remanescente é só a **sessão única (Redis)**. É o cenário de menor risco/custo para o módulo.
- **Expiração de eventos (módulo 4):** resolvida por **campos virtuais** (`status_efetivo`/`enable_efetivo`) calculados na leitura — **sem job/cron**. Reduz risco e infra (sem pg_cron/Vercel Cron, sem idempotência, sem fuso de job). Atenção apenas em garantir o cálculo consistente em todas as leituras (view SQL / camada de query) e definir a data corrente/fuso de comparação.
- Definições deixadas para o dev na doc (formatos de upload, timeout de sessão, fuso) podem mover ±5%.
- Custos recorrentes de terceiros (Supabase, Redis/Upstash, Vercel, e-mail transacional) são **operacionais**, fora deste orçamento de desenvolvimento.

---

## 8. Estimativa por funcionalidade (R$ 110,00/h)

### Módulos

| Módulo | Funcionalidade | Horas | Valor (R$) |
|--------|----------------|------:|-----------:|
| **1 · Auth** | Login e-mail+senha + MFA TOTP (challenge) | 10 | 1.100 |
| | 1º acesso: enroll TOTP (QR + validação) | 6 | 660 |
| | Recuperação de senha por e-mail (Supabase nativo) | 3 | 330 |
| | Sessão única (Redis) + middleware | 8 | 880 |
| | Timeout de inatividade | 4 | 440 |
| | CRUD de usuários + seed 1º admin | 12 | 1.320 |
| | **Subtotal** | **43** | **4.730** |
| **2 · Telas/Marquees** | CRUD Telas + habilitar/desabilitar | 10 | 1.100 |
| | CRUD Marquees + associação N:N a telas | 12 | 1.320 |
| | Itens de marquee (CRUD + ordenação + navegação) | 16 | 1.760 |
| | Validações de navegação (interna/nova aba) | 6 | 660 |
| | **Subtotal** | **44** | **4.840** |
| **3 · Banners** | CRUD Banner (asset + imagem) | 8 | 880 |
| | Associação Banner×Tela (habilitadas, draft) | 8 | 880 |
| | Publicação por tela + auto-revert (máquina) | 12 | 1.320 |
| | Listagem + regras de visibilidade | 8 | 880 |
| | **Subtotal** | **36** | **3.960** |
| **4 · Eventos** | CRUD Evento (campos, enable, prioridade) | 14 | 1.540 |
| | CRUD Status dinâmicos (lifecycle, protegidos) | 10 | 1.100 |
| | Alteração de status + Adiado/nova data | 8 | 880 |
| | Encerramento manual (regras Sucesso/Cancelado) | 12 | 1.320 |
| | Campos virtuais (view `eventos_view`) | 10 | 1.100 |
| | Listagem/visibilidade + link compra (nova aba) | 8 | 880 |
| | **Subtotal** | **62** | **6.820** |
| **5 · Conteúdos** | CRUD Categorias | 6 | 660 |
| | CRUD Conteúdo (tipo enum + thumbnail) | 14 | 1.540 |
| | Status editorial (draft/pendente/publicado/desab.) | 8 | 880 |
| | Destaque + ordenação manual + link nova aba | 10 | 1.100 |
| | **Subtotal** | **38** | **4.180** |
| **6 · Obras** | CRUD Músicas (ISRC, duração, cover) | 10 | 1.100 |
| | CRUD Coleções + vínculo música→coleção (N:1) | 12 | 1.320 |
| | CRUD Colaboradores | 8 | 880 |
| | CRUD Roles | 6 | 660 |
| | Vínculo obra×colaborador×role (N:N) | 12 | 1.320 |
| | Links de plataforma + ordenação por lançamento | 10 | 1.100 |
| | **Subtotal** | **58** | **6.380** |
| **7 · Propostas** | Schema + RLS (read-only) | 4 | 440 |
| | Listagem + filtros (estado/cidade) | 8 | 880 |
| | Detalhe da proposta | 4 | 440 |
| | **Subtotal** | **16** | **1.760** |
| | **Subtotal MÓDULOS** | **297** | **32.670** |

### Transversais

| Bloco | Horas | Valor (R$) |
|-------|------:|-----------:|
| Fundação (scaffold, shell, auditoria, upload, padrões CRUD) | 72 | 7.920 |
| Testes (unit + integration + e2e) | 96 | 10.560 |
| UI/UX Design | 64 | 7.040 |
| Infra & Deploy | 36 | 3.960 |

### Total

| | Horas | Valor (R$) |
|---|------:|-----------:|
| Módulos | 297 | 32.670 |
| Fundação | 72 | 7.920 |
| Testes | 96 | 10.560 |
| Design | 64 | 7.040 |
| Infra | 36 | 3.960 |
| **TOTAL (base)** | **565** | **R$ 62.150,00** |

Faixa: **460 h (otimista, R$ 50.600)** a **690 h (pessimista, R$ 75.900)**. Com +30% (gestão/QA/buffer): ~735 h → **R$ 80.850**.
