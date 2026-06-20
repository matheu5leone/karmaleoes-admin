# Transversal — Auditoria de Escrita

> Reutilizado por **todos** os módulos com escrita (1–6). Spec-fonte: RF-LOGIN-006 e
> [`VISAO_GERAL.md §Auditoria`](../../VISAO_GERAL.md). Base: [`CONVENTIONS.md §5`](../superpowers/plans/CONVENTIONS.md).

## 1. Objetivo

Registrar log de **toda operação de escrita** (create, update, delete) nos módulos administrativos.
**Leituras não são auditadas** no MVP.

## 2. Tabela `audit_log`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | identificador do log |
| `user_id` | uuid FK → `admin_user` | usuário responsável pela ação |
| `acao` | text `create\|update\|delete` | tipo de operação |
| `entidade` | text | nome da entidade/tabela afetada |
| `registro_id` | uuid (nullable) | ID do registro alterado |
| `diff` | jsonb (nullable, opcional) | antes/depois quando aplicável |
| `created_at` | timestamptz | momento da operação |

Criada na **migration base** (Plano 00), com RLS habilitado. Inserção apenas pelo helper no servidor.

## 3. Helper `lib/audit.ts`

```ts
// assinatura conceitual
await audit({ acao, entidade, registroId, diff? })
```

- Resolve o `user_id` a partir da sessão (Supabase Auth) no servidor.
- Chamado **dentro de cada Server Action de escrita**, após a mutação bem-sucedida e na mesma
  unidade lógica (idealmente na mesma transação, quando o caminho permitir).
- Centralizado para garantir consistência de campos e evitar duplicação por módulo.

## 4. Regra de aplicação por módulo

Cada plano de módulo invoca `audit(...)` em **create/update/delete** das suas entidades:

| Módulo | Entidades auditadas (exemplos) |
|--------|--------------------------------|
| 1 · Auth | `admin_user` (cadastro/edição/ativação) |
| 2 · Telas | `tela`, `marquee`, `marquee_tela`, `marquee_item` |
| 3 · Banners | `banner`, `banner_tela` (incl. publicação/auto-revert) |
| 4 · Eventos | `evento`, `status_evento` (incl. encerramento) |
| 5 · Conteúdos | `conteudo`, `categoria_conteudo` |
| 6 · Obras | `musica`, `colecao`, `colaborador`, `role`, `obra_colaborador`, `link_plataforma` |

## 5. Pontos de teste

- **Integration:** cada Server Action de escrita gera exatamente um registro em `audit_log` com os
  campos corretos (`acao`, `entidade`, `registro_id`, `user_id`).
- Operações de leitura **não** geram log.
