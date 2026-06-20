# Plano 05 — Conteúdos Digitais (Módulo 5)

> **Objetivo:** CRUD de conteúdos externos com categorias gerenciáveis, status editorial, destaque e
> ordenação manual. Independente do módulo de Obras.
>
> **Specs-fonte:** [`modules/GESTAO_CONTEUDOS_DIGITAIS/`](../../modules/GESTAO_CONTEUDOS_DIGITAIS/GESTAO_CONTEUDOS_DIGITAIS.md)
> (RF-CONT-001..009, RN-CONT-001..008) + [`TESTES.md`](../../modules/GESTAO_CONTEUDOS_DIGITAIS/TESTES.md).
> **Depende de:** 01. **Próximo:** 06.

## 1. Modelo de dados

**`categoria_conteudo`** — agrupamentos temáticos gerenciáveis pelo admin (RF-CONT-008), distintos do `tipo`:

| Coluna | Tipo |
|--------|------|
| `id` | uuid PK |
| `nome` | text (ex.: Bastidores, Lançamentos, Exclusivos) |

**`conteudo`** (RF-CONT-002):

| Coluna | Tipo | Regra |
|--------|------|-------|
| `id` | uuid PK | |
| `titulo`, `descricao` | text | |
| `thumbnail` | text | path/URL (bucket `conteudos`) |
| `categoria_id` | uuid FK → `categoria_conteudo` | agrupamento temático |
| `tipo` | text **enum fixo** | `video\|playlist\|noticia\|entrevista\|podcast` (RF-CONT-001) |
| `plataforma` | text | origem externa |
| `link` | text | abre em **nova aba** (RF-007/RN-007) |
| `status` | text | `draft\|pendente\|publicado\|desabilitado` (RF-005) |
| `destaque` | bool | priorização visual (RF-006) |
| `ordem` | int | ordenação manual no Hub (RF-009) |
| `data` | date | data de referência do conteúdo |

- Visibilidade no Hub: **somente** `publicado` (draft/pendente/desabilitado ocultos — RN-004/005/006).
- O Hub **não** hospeda mídia — só referência externa (RN-002/003).
- RLS `is_active_admin()`. Thumbnail via [`transversal-storage-imagens.md`](./transversal-storage-imagens.md).

## 2. Server Actions (zod + auditoria)

- Categorias: `criarCategoria`, `editarCategoria`, `excluirCategoria` (avaliar bloqueio se em uso).
- Conteúdo: `criarConteudo`, `editarConteudo`, `excluirConteudo`, `alterarStatus`, `toggleDestaque`, `reordenar`.
- **Validações:** `tipo` no enum fixo; `categoria_id` válido; `link` obrigatório (URL).

## 3. Telas (UI)

- `app/(admin)/conteudos/` — listagem (`data-table`, filtro por tipo/categoria/status) + form
  (thumbnail via `ImageUpload`) + controle de status/destaque/ordenação.
- `app/(admin)/conteudos/categorias/` — CRUD de categorias.

## 4. Sequência de tarefas (TDD)

1. Migrations + RLS; bucket `conteudos`.
2. CRUD categorias (RF-008).
3. CRUD conteúdo (tipo enum fixo; categoria FK; thumbnail) (RF-001/002/003).
4. Status editorial + destaque + ordenação manual (RF-005/006/009).
5. Link externo em nova aba (RF-007); independência de Obras (RN-008).
6. Auditoria; E2E do `TESTES.md`.

## 5. Mapeamento de testes

- **Unit:** validação do enum `tipo`; regras de visibilidade por status; ordenação/destaque.
- **Integration:** CRUD + FK categoria + RLS + auditoria.
- **E2E:** `modules/GESTAO_CONTEUDOS_DIGITAIS/TESTES.md`.

## 6. Definition of Done

- [ ] Migrations + RLS; bucket configurado.
- [ ] CRUD categorias e conteúdos; status editorial, destaque e ordenação.
- [ ] Só `publicado` visível; links em nova aba; auditoria.
- [ ] Unit + integration + e2e verdes; lint/typecheck verdes.

## 7. Riscos / decisões

- Exclusão de categoria em uso: definir comportamento (bloquear vs. reatribuir) na implementação.
