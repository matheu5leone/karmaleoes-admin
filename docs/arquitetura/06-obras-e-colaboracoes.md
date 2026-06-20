# Plano 06 — Obras & Colaborações (Módulo 6)

> **Objetivo:** músicas, coleções (N:1), colaboradores, roles dinâmicos, vínculos obra×colaborador×role e
> links de plataforma (discriminador música/coleção).
>
> **Specs-fonte:** [`modules/GESTAO_OBRAS_E_COLABORACOES/`](../../modules/GESTAO_OBRAS_E_COLABORACOES/GESTAO_OBRAS_E_COLABORACOES.md)
> (RF-OBRA-001..012, RN-OBRA-001..009) + [`TESTES.md`](../../modules/GESTAO_OBRAS_E_COLABORACOES/TESTES.md).
> **Depende de:** 01. **Próximo:** — (último módulo).

## 1. Modelo de dados

**`musica`** (RF-OBRA-001): `id`, `nome`, `data_lancamento` date, `duracao`, `isrc`, `cover_image` (bucket `obras`),
`colecao_id` uuid FK **null** (N:1 — pode existir sem coleção, RN-003/004).

**`colecao`** (RF-OBRA-004): `id`, `nome`, `descricao`, `tipo` text `album\|EP`, `cover_image`, `data_lancamento` date.

**`colaborador`** (RF-OBRA-007): `id`, `nome`, `instagram`, `linkedin`, `descricao`.

**`role`** (RF-OBRA-008): `id`, `nome` — tipos de participação dinâmicos (feat, produtor, compositor, …).

**`obra_colaborador`** — junção obra×colaborador×role (RF-OBRA-009, RN-006/007):

| Coluna | Tipo | Regra |
|--------|------|-------|
| `id` | uuid PK | |
| `musica_id` | uuid FK null | **XOR** com `colecao_id` (a "obra" é música **ou** coleção) |
| `colecao_id` | uuid FK null | |
| `colaborador_id` | uuid FK | |
| `role_id` | uuid FK | |

**`link_plataforma`** — discriminador música/coleção (RF-OBRA-010):

| Coluna | Tipo | Regra |
|--------|------|-------|
| `id` | uuid PK | |
| `musica_id` | uuid FK null | **XOR** com `colecao_id` |
| `colecao_id` | uuid FK null | |
| `plataforma` | text | Spotify, Deezer, Apple Music, Amazon Music, YouTube |
| `url` | text | abre em **nova aba** (RF-011/RN-008) |

- **Checks XOR** em `obra_colaborador` e `link_plataforma` (exatamente um de música/coleção).
- Sem controle de status/visibilidade no MVP — visível após cadastro (RN-009).
- Hub não armazena mídia (RN-001/002). RLS `is_active_admin()`. Covers via [`transversal-storage-imagens.md`](./transversal-storage-imagens.md).

## 2. Server Actions (zod + auditoria)

- Músicas: `criarMusica`, `editarMusica`, `vincularColecao` (N:1).
- Coleções: `criarColecao`, `editarColecao`.
- Colaboradores: `criarColaborador`, `editarColaborador`.
- Roles: `criarRole`, `editarRole`, `excluirRole` (avaliar bloqueio se em uso).
- Vínculos: `vincularColaborador` (obra XOR + colaborador + role), `removerVinculo`.
- Links: `adicionarLink` / `removerLink` (XOR música/coleção).

## 3. Telas (UI)

- `app/(admin)/obras/` — CRUD músicas e coleções (cover via `ImageUpload`), vínculo música→coleção,
  editor de colaboradores por obra (colaborador + role) e links de plataforma. **Ordenação por data de
  lançamento, mais recente → mais antiga** (RF-012).
- `app/(admin)/obras/colaboradores/` — CRUD colaboradores.
- `app/(admin)/obras/roles/` — CRUD roles.

## 4. Sequência de tarefas (TDD)

1. Migrations das 6 tabelas + RLS + checks XOR; bucket `obras`.
2. CRUD música (ISRC, duração, cover) e coleção; vínculo música→coleção N:1 (RF-001..006, RN-003/004).
3. CRUD colaborador e role; vínculo obra×colaborador×role (RF-007/008/009, RN-005/006/007).
4. Links de plataforma por música **ou** coleção (discriminador), nova aba (RF-010/011).
5. Ordenação por data de lançamento (RF-012); sem status no MVP (RN-009).
6. Auditoria; E2E do `TESTES.md`.

## 5. Mapeamento de testes

- **Unit:** checks XOR (obra_colaborador / link_plataforma); ordenação por data de lançamento.
- **Integration:** N:1 música→coleção; N:N obra×colaborador×role; RLS + auditoria.
- **E2E:** `modules/GESTAO_OBRAS_E_COLABORACOES/TESTES.md`.

## 6. Definition of Done

- [ ] Migrations + RLS + checks XOR; bucket configurado.
- [ ] CRUD de músicas/coleções/colaboradores/roles; vínculos N:1 e N:N.
- [ ] Links por música ou coleção, em nova aba; ordenação por lançamento.
- [ ] Auditoria; unit + integration + e2e verdes; lint/typecheck verdes.

## 7. Riscos / decisões

- Exclusão de role em uso: definir comportamento (bloquear vs. reatribuir) na implementação.
- Modelagem da "obra" polimórfica (música/coleção) via XOR de FKs — manter consistente entre
  `obra_colaborador` e `link_plataforma`.
