# Plano 03 — Banners por Tela (Módulo 3)

> **Objetivo:** banner como **asset reutilizável** + publicação por associação Banner×Tela
> (1 publicado por tela, com auto-revert da associação anterior **da mesma tela**).
>
> **Specs-fonte:** [`modules/GESTAO_BANNERS_POR_TELA/`](../../modules/GESTAO_BANNERS_POR_TELA/GESTAO_BANNERS_POR_TELA.md)
> (RF-BANNER-001..006, RN-BANNER-001..008) + [`TESTES.md`](../../modules/GESTAO_BANNERS_POR_TELA/TESTES.md).
> **Depende de:** 02 (precisa de `tela`). **Próximo:** 04.

## 1. Modelo de dados

**`banner`** — asset sem status próprio (controle de publicação fica na associação, RF-BANNER-001):

| Coluna | Tipo | Regra |
|--------|------|-------|
| `id` | uuid PK | |
| `nome` | text | label interno (não exibido no Hub) |
| `imagem` | text | path/URL (bucket `banners`) |
| `created_at`/`updated_at` | timestamptz | edição reflete em todas as associações (RF-BANNER-003) |

**`banner_tela`** — associação com status **por tela** (RF-BANNER-004):

| Coluna | Tipo | Regra |
|--------|------|-------|
| `id` | uuid PK | |
| `banner_id` | uuid FK | |
| `tela_id` | uuid FK | só tela **habilitada** ao criar (RN-BANNER-008) |
| `status` | text `draft\|publicado` | criada em `draft` (RF-BANNER-002) |
| `created_at`/`updated_at` | timestamptz | |

- **Invariante (RN-BANNER-002):** no máximo **uma** associação `publicado` por `tela_id`. Reforçar com
  índice único parcial: `unique (tela_id) where status = 'publicado'`.
- RLS `is_active_admin()`. Imagem via [`transversal-storage-imagens.md`](./transversal-storage-imagens.md).

## 2. Máquina de publicação (núcleo do módulo)

`publicarAssociacao(associacao_id)` (RF-BANNER-005 / RN-BANNER-006):
1. Identifica a `tela_id` da associação.
2. Reverte para `draft` a associação atualmente `publicado` **da mesma tela** (se houver).
3. Marca a associação alvo como `publicado`.
4. **Outras telas do mesmo banner permanecem inalteradas.**
5. Executar em **transação**; auditar a mudança.

> Esta lógica pura deve ter **unit test dedicado** (troca de publicação isolada por tela).

## 3. Server Actions (zod + auditoria)

- `criarBanner`, `editarBanner` (nome+imagem; edição reflete em todas as associações).
- `associarBannerTela` (cria em `draft`; valida tela habilitada).
- `publicarAssociacao` / `despublicarAssociacao` (máquina §2).
- Listagem: banner com telas associadas e status por tela (RF-BANNER-006).

## 4. Regras de visibilidade

- Associação `draft` **não** exibe no Hub (RN-BANNER-003).
- Banner **não** exibido em tela desabilitada, mesmo se `publicado` (RN-BANNER-007).
- Sem ordenação/versionamento/agendamento (RN-BANNER-005).

## 5. Sequência de tarefas (TDD)

1. Migrations + RLS + índice único parcial; bucket `banners`.
2. CRUD banner (nome+imagem via `ImageUpload`); edição reflete nas associações (RF-001/003).
3. Associação a telas habilitadas, criada em `draft` (RF-002, RN-008).
4. **Máquina de publicação** + auto-revert (RF-004/005, RN-002/006) — **unit test**.
5. Não exibir em tela desabilitada (RN-007); listagem com status por tela (RF-006).
6. Auditoria; E2E do `TESTES.md`.

## 6. Mapeamento de testes

- **Unit:** máquina de troca de publicação (1 publicado/tela; outras telas intactas).
- **Integration:** índice único parcial impede 2 publicados na mesma tela; auditoria.
- **E2E:** `modules/GESTAO_BANNERS_POR_TELA/TESTES.md`.

## 7. Definition of Done

- [ ] Migrations + RLS + índice único parcial; bucket configurado.
- [ ] CRUD banner; associação em draft só p/ tela habilitada.
- [ ] Publicação com auto-revert por tela, coberta por unit test.
- [ ] Visibilidade respeita draft e tela desabilitada; auditoria; lint/typecheck verdes.

## 8. Riscos

- Concorrência na publicação simultânea na mesma tela → mitigado por transação + índice único parcial.
