# Plano 02 — Telas, Navegação & Marquees (Módulo 2)

> **Objetivo:** CRUD de telas (referências de rota do Hub), marquees reutilizáveis (N:N) e itens com
> navegação interna/externa.
>
> **Specs-fonte:** [`modules/GESTAO_TELAS_NAVEGACAO_E_MARQUEES/`](../../modules/GESTAO_TELAS_NAVEGACAO_E_MARQUEES/GESTAO_TELAS_NAVEGACAO_E_MARQUEES.md)
> (RF-NAV-001..011, RN-NAV-001..007) + [`TESTES.md`](../../modules/GESTAO_TELAS_NAVEGACAO_E_MARQUEES/TESTES.md).
> **Depende de:** 01. **Próximo:** [`03-banners-por-tela.md`](./03-banners-por-tela.md) (cadeia rígida 02→03).

## 1. Modelo de dados

**`tela`** — referência administrativa a uma rota existente no código do Hub (não criada dinamicamente, RN-NAV-002):

| Coluna | Tipo | Regra |
|--------|------|-------|
| `id` | uuid PK | |
| `nome` | text | exibição/referência |
| `rota` | text | slug/rota no Hub (RF-NAV-001) |
| `status` | text `habilitada\|desabilitada` | desabilitada não aparece no Hub (RN-NAV-003) |

**`marquee`** — entidade independente, reutilizável (RF-NAV-005/006):

| Coluna | Tipo | Regra |
|--------|------|-------|
| `id` | uuid PK | |
| `nome` | text | referência administrativa |
| `props_visuais` | jsonb | cores, ícones, estilo (RF-NAV-007) |

**`marquee_tela`** — junção N:N (marquee reutilizado em várias telas):
`id`, `marquee_id` FK, `tela_id` FK, `unique(marquee_id, tela_id)`.

**`marquee_item`** — item navegável (RF-NAV-008), sem limite por marquee (RN-NAV-007):

| Coluna | Tipo | Regra |
|--------|------|-------|
| `id` | uuid PK | |
| `marquee_id` | uuid FK | |
| `titulo` | text | |
| `imagem` | text null | path/URL (bucket `marquees`) |
| `tipo_nav` | text `interno\|externo` | um destino por item (RN-NAV-005) |
| `tela_destino_id` | uuid FK null | quando `interno` — só tela **habilitada** (RN-NAV-004) |
| `url_externa` | text null | quando `externo` — abre em nova aba (RF-NAV-010) |
| `ordem` | int | ordenação de exibição |

- **Check:** exatamente um destino preenchido conforme `tipo_nav` (XOR `tela_destino_id`/`url_externa`).
- RLS `is_active_admin()` em todas. Imagem via [`transversal-storage-imagens.md`](./transversal-storage-imagens.md).

## 2. Server Actions (zod + auditoria)

- Telas: `criarTela`, `editarTela`, `habilitarDesabilitarTela`.
- Marquees: `criarMarquee`, `editarMarquee`, `removerMarquee`, `associarMarqueeTela`, `desassociarMarqueeTela`.
- Itens: `criarItem`, `editarItem`, `removerItem`, `reordenarItens`.
- **Validações-chave:** destino interno só para tela habilitada (RF-NAV-011/RN-004); XOR de destino (RN-005).

## 3. Telas (UI)

- `app/(admin)/telas/` — listagem com status + form + toggle habilitar/desabilitar.
- `app/(admin)/marquees/` — CRUD marquee, associação N:N a telas, editor de itens (ordenável) com
  seletor de destino (tela habilitada **ou** URL externa).

## 4. Sequência de tarefas (TDD)

1. Migrations das 4 tabelas + RLS.
2. CRUD telas + habilitar/desabilitar (RF-NAV-001..004).
3. CRUD marquees + associação N:N + reutilização (RF-NAV-005/006/007).
4. CRUD/ordenação de itens; um destino por item; interno só p/ habilitada (RF-NAV-008..011, RN-004/005).
5. Links externos `target="_blank"` (RF-NAV-010).
6. Auditoria nas escritas; E2E do `TESTES.md`.

## 5. Mapeamento de testes

- **Unit:** XOR de destino; bloqueio de destino para tela desabilitada; reordenação.
- **Integration:** CRUD + N:N + RLS + auditoria.
- **E2E:** `modules/GESTAO_TELAS_NAVEGACAO_E_MARQUEES/TESTES.md`.

## 6. Definition of Done

- [ ] Migrations + RLS aplicadas; imagem de item via Storage (se usada).
- [ ] Telas, marquees (N:N) e itens com ordenação e regras de navegação.
- [ ] Auditoria nas escritas; links externos em nova aba.
- [ ] Unit + integration + e2e verdes; lint/typecheck verdes.

## 7. Riscos / decisões

- Implementação técnica da **navegação interna** no Hub é definida pelo dev (RF-NAV-009) — aqui só se
  armazena o destino e valida que a tela está habilitada.
