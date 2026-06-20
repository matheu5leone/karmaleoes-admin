# Plano 04 — Eventos (Módulo 4)

> **Objetivo:** CRUD de eventos, status dinâmicos por lifecycle (protegidos), encerramento com regras de
> data, e **expiração por campos virtuais (sem job)**.
>
> **Specs-fonte:** [`modules/GESTAO_EVENTOS/`](../../modules/GESTAO_EVENTOS/GESTAO_EVENTOS.md)
> (RF-EVENTO-001..009, RN-EVENTO-001..015) + [`TESTES.md`](../../modules/GESTAO_EVENTOS/TESTES.md).
> **Depende de:** 01. **Próximo:** 05. É o módulo de maior complexidade.

## 1. Modelo de dados

**`status_evento`** (RF-EVENTO-004b / RN-EVENTO-010):

| Coluna | Tipo | Regra |
|--------|------|-------|
| `id` | uuid PK | |
| `nome` | text | "Expirado" é **reservado** (não cadastrável) |
| `lifecycle` | text `Em aberto\|Encerrado` | vínculo do status |
| `protegido` | bool | `true` para "Adiado" — não edita/exclui (RN-009) |

Seed: Ingressos a venda, Esgotado, **Adiado (protegido)** (Em aberto); Sucesso, Cancelado (Encerrado).
**"Expirado" não é seedado** (virtual).

**`evento`** (RF-EVENTO-001):

| Coluna | Tipo | Regra |
|--------|------|-------|
| `id` | uuid PK | |
| `nome`, `descricao`, `categoria`, `local`, `organizador` | text | |
| `data` | date | data de referência padrão p/ expiração |
| `horario` | time | |
| `link_externo` | text | compra em nova aba (RF-007) |
| `lifecycle` | text `Em aberto\|Encerrado` | |
| `status_id` | uuid FK → `status_evento` | status do lifecycle atual |
| `enable` | bool | **default false** (RN-012); intenção do admin |
| `prioridade` | int | destaque/ordenação (RF-008) |
| `nova_data` | date null | **obrigatório** quando status "Adiado" (RN-008) |
| `obs_encerramento` | text null | **obrigatória** ao encerrar (RF-006) |

- Status em uso por eventos **não** pode ser excluído (RN-013).
- RLS `is_active_admin()`.

## 2. View `eventos_view` (campos virtuais — sem job)

Ver [`transversal-banco-rls-migrations.md §4`](./transversal-banco-rls-migrations.md). Calcula na leitura
(RF-EVENTO-005), **sem mutar dados**:

| Campo virtual | Regra |
|---------------|-------|
| `data_referencia` | `nova_data` se status "Adiado" e preenchida; senão `data` |
| `expirado` | data atual ultrapassou `data_referencia` (dia seguinte em diante) |
| `status_efetivo` | `'Expirado'` se `expirado` **e** lifecycle "Em aberto"; senão status armazenado |
| `enable_efetivo` | `enable` **AND NOT** `expirado` — rege visibilidade no Hub (RN-002/006) |

**Toda leitura** de eventos (admin e futuro Hub) consome a view. Comportamento reativo: alterar
`nova_data` para o futuro faz o evento deixar de ser expirado automaticamente.

## 3. Regras de encerramento (RF-EVENTO-006)

Transiciona lifecycle "Em aberto" → "Encerrado"; exige status do lifecycle "Encerrado" + observação:

| Status | Permitido quando | Enable |
|--------|------------------|--------|
| Cancelado | a qualquer momento (mesmo antes da data) — RN-015 | **inalterado** |
| Sucesso | só na data de referência **ou depois** (RN-014) | **inalterado** |

- Encerramento **nunca** altera o `enable` armazenado (RN-011). Admin pode setar `enable` manualmente.
- Sucesso antes da data de referência → **rejeitado**.

## 4. Server Actions (zod + auditoria)

- `criarEvento` (enable default false), `editarEvento`, `alterarStatus` (Adiado exige `nova_data`).
- `encerrarEvento` (valida status/data conforme §3; obs obrigatória).
- `setEnable` (manual, a qualquer momento).
- Status: `criarStatus`, `editarStatus`, `excluirStatus` (bloqueia Adiado/protegido, "Expirado" e status em uso).

## 5. Telas (UI)

- `app/(admin)/eventos/` — listagem usando `eventos_view` (mostra `status_efetivo`/`enable_efetivo`);
  form de evento; ação de encerramento; toggle `enable`; link compra em nova aba.
- `app/(admin)/eventos/status/` — CRUD de status (respeitando proteções).

## 6. Sequência de tarefas (TDD)

1. Migrations + seed de status (sem "Expirado"); **view `eventos_view`** — **unit test** do cálculo.
2. CRUD evento; `enable` default false; prioridade (RF-001/002/003/008/009).
3. Alteração de status no lifecycle; Adiado exige `nova_data` (RF-004, RN-008).
4. CRUD de status; Adiado protegido; "Expirado" reservado; status em uso não excluível (RF-004b, RN-009/013).
5. Encerramento manual (Sucesso só na data+, Cancelado a qualquer hora; obs; não altera enable) (RF-006, RN-007/011/014/015).
6. Leitura via view; link compra em nova aba (RF-007).
7. Auditoria; E2E do `TESTES.md` (incl. expiração reativa).

## 7. Mapeamento de testes

- **Unit:** cálculo da view (`expirado`/`status_efetivo`/`enable_efetivo`) em todos os cenários de data e
  lifecycle; rejeição de Sucesso antecipado; obrigatoriedade de `nova_data`/observação.
- **Integration:** proteção do "Adiado"; status em uso não excluível; auditoria.
- **E2E:** `modules/GESTAO_EVENTOS/TESTES.md`.

## 8. Definition of Done

- [ ] Migrations + seed + `eventos_view`; cálculo coberto por unit test.
- [ ] CRUD evento/status com proteções; encerramento conforme regras de data.
- [ ] Leitura sempre via view; `enable` armazenado nunca mutado por rotina.
- [ ] Auditoria; link em nova aba; lint/typecheck verdes.

## 9. Riscos / lacunas

- **Data corrente / fuso** da comparação de expiração — lacuna a definir pelo dev (documentar na view).
- Garantir que **nenhuma** leitura recalcula a regra fora da view (fonte única).
