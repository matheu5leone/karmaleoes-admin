# Roteiro de Testes — Gestão de Obras e Colaborações

**Especificação:** [GESTAO_OBRAS_E_COLABORACOES.md](./GESTAO_OBRAS_E_COLABORACOES.md)

## Escopo

Validar músicas, coleções (álbum/EP), colaboradores, roles, relacionamento N:1 música-coleção, links de plataformas por música e coleção, ordenação por lançamento e regras RN-OBRA-001 a 009.

## Legenda

| Prioridade | Significado |
|------------|-------------|
| P0 | Bloqueante para release |
| P1 | Funcionalidade essencial |
| P2 | Complementar |

| Tipo | Significado |
|------|-------------|
| Positivo | Fluxo válido esperado |
| Negativo | Validação de rejeição/erro |
| E2E | Admin + Hub + plataformas externas |

---

## Fluxo operacional macro

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-OBRA-001 | P0 | E2E | Fluxo principal | Música → coleção → colaborador → role → vínculos → Hub → link plataforma | Catálogo exibido e navegável |

## Gestão de Músicas

| ID | RF/RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-------|------------|------|---------|--------|-------------------|
| TC-OBRA-002 | RF-OBRA-001 | P0 | Positivo | Cadastro de música | Cadastrar com nome, data, duração, ISRC, cover | Música criada; RN-OBRA-001/002 |
| TC-OBRA-003 | RF-OBRA-002 | P1 | Positivo | Edição de música | Alterar metadados | Dados atualizados |
| TC-OBRA-004 | RF-OBRA-003 | P1 | Positivo | Listagem de músicas | Listar catálogo | Lista exibida |

## Gestão de Coleções

| ID | RF/RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-------|------------|------|---------|--------|-------------------|
| TC-OBRA-005 | RF-OBRA-004 | P0 | Positivo | Cadastro álbum e EP | Cadastrar coleção de cada tipo | Tipos suportados |
| TC-OBRA-006 | RF-OBRA-005 | P0 | Positivo | Vínculo N:1 música-coleção | Associar múltiplas músicas à mesma coleção | RN-OBRA-003 atendida |
| TC-OBRA-006b | RF-OBRA-005 | P0 | Negativo | Música em apenas uma coleção | Tentar associar mesma música a duas coleções | Operação rejeitada (N:1) |
| TC-OBRA-007 | RN-OBRA-004 | P0 | Positivo | Música sem coleção | Cadastrar música isolada | Música válida sem coleção |
| TC-OBRA-008 | RF-OBRA-006 | P1 | Positivo | Edição de coleção | Alterar coleção existente | Dados atualizados |

## Gestão de Colaboradores

| ID | RF/RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-------|------------|------|---------|--------|-------------------|
| TC-OBRA-009 | RF-OBRA-007 | P0 | Positivo | Cadastro de colaborador | Cadastrar nome, redes, descrição | Colaborador criado |
| TC-OBRA-010 | RF-OBRA-008 | P0 | Positivo | Cadastro dinâmico de roles | Criar roles (feat, produtor, etc.) | RN-OBRA-005 atendida |
| TC-OBRA-011 | RF-OBRA-009 | P0 | Positivo | Vínculo obra-colaborador-role | Associar colaborador a música/coleção com role | Relacionamento tripartite persistido |
| TC-OBRA-012 | RN-OBRA-006/007 | P1 | Positivo | Múltiplos colaboradores e obras | Vincular vários colaboradores e obras cruzadas | N:N funcional |

## Plataformas Externas

| ID | RF/RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-------|------------|------|---------|--------|-------------------|
| TC-OBRA-013 | RF-OBRA-010 | P0 | Positivo | Links por música | Cadastrar Spotify, Deezer, Apple, Amazon, YouTube para uma música | Links persistidos com discriminador musica_id |
| TC-OBRA-013b | RF-OBRA-010 | P0 | Positivo | Links por coleção | Cadastrar links de plataforma para uma coleção | Links persistidos com discriminador colecao_id |
| TC-OBRA-014 | RF-OBRA-011 | P0 | E2E | Abertura em nova aba | Clicar link no Hub | RN-OBRA-008 atendida |

## Organização e Exibição

| ID | RF/RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-------|------------|------|---------|--------|-------------------|
| TC-OBRA-015 | RF-OBRA-012 | P0 | E2E | Ordenação por lançamento | Cadastrar obras com datas distintas | Hub exibe mais recente → mais antiga |
| TC-OBRA-016 | RN-OBRA-009 | P2 | Negativo | Sem status no MVP | Buscar controle de status | Funcionalidade inexistente |

## Checklist de regressão do módulo

- [ ] CRUD músicas e coleções (P0)
- [ ] Relacionamentos música/coleção/colaborador/role (P0)
- [ ] Links de plataformas e nova aba (P0)
- [ ] Ordenação por data de lançamento (P0)
