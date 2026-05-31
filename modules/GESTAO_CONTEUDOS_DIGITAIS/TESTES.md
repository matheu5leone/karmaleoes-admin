# Roteiro de Testes — Gestão de Conteúdos Digitais

**Especificação:** [GESTAO_CONTEUDOS_DIGITAIS.md](./GESTAO_CONTEUDOS_DIGITAIS.md)

## Escopo

Validar curadoria manual, tipos de conteúdo, status, destaque, categorias, ordenação, links externos e independência do módulo de Obras (RN-CONT-001 a 008).

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
| E2E | Admin + Hub |

---

## Fluxo operacional macro

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-CONT-001 | P0 | E2E | Fluxo principal | Cadastrar → categorizar → status → publicar → acessar no Hub → link externo | Conteúdo publicado acessível em nova aba |

## Requisitos Funcionais

| ID | RF/RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-------|------------|------|---------|--------|-------------------|
| TC-CONT-002 | RF-CONT-001 | P0 | Positivo | Cadastro por tipo | Cadastrar vídeo, playlist, notícia, entrevista, podcast | Todos os tipos aceitos |
| TC-CONT-003 | RF-CONT-002 | P0 | Positivo | Estrutura completa | Preencher título, descrição, thumbnail, categoria, link, plataforma, data, status | Campos obrigatórios validados e persistidos |
| TC-CONT-004 | RF-CONT-003 | P1 | Positivo | Edição | Alterar conteúdo existente | Atualização persistida |
| TC-CONT-005 | RF-CONT-004 | P1 | Positivo | Listagem | Listar conteúdos | Lista exibe registros cadastrados |
| TC-CONT-006 | RF-CONT-005 | P0 | Positivo | Status draft/publicado/pendente/desabilitado | Transicionar entre status | Comportamento conforme RN-CONT-004/005/006 |
| TC-CONT-007 | RF-CONT-005 | P0 | E2E | Draft oculto | Conteúdo em draft | Não exibido no Hub (RN-CONT-005) |
| TC-CONT-008 | RF-CONT-005 | P0 | E2E | Desabilitado oculto | Conteúdo desabilitado | Não exibido (RN-CONT-004) |
| TC-CONT-009 | RF-CONT-005 | P0 | E2E | Pendente oculto | Conteúdo em status pendente | Não exibido até admin alterar para publicado (RN-CONT-006) |
| TC-CONT-010 | RF-CONT-006 | P1 | E2E | Destaque | Marcar conteúdo em destaque | Priorização visual no Hub |
| TC-CONT-011 | RF-CONT-007 | P0 | E2E | Link externo | Acessar conteúdo no Hub | Nova aba (RN-CONT-007) |
| TC-CONT-012 | RF-CONT-008 | P1 | Positivo | Categorização temática | Atribuir categoria temática (ex: Bastidores, Lançamentos) distinta do Tipo (formato) | Agrupamento temático funcional, independente do Tipo |
| TC-CONT-013 | RF-CONT-009 | P1 | E2E | Ordenação manual | Reordenar conteúdos | Ordem refletida no Hub |

## Regras de Negócio

| ID | RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-----|------------|------|---------|--------|-------------------|
| TC-CONT-014 | RN-CONT-001 | P0 | Positivo | Cadastro manual por admin | Cadastrar via admin | Somente fluxo administrativo |
| TC-CONT-015 | RN-CONT-002 | P0 | Negativo | Sem hospedagem de mídia | Verificar armazenamento | Apenas metadados + link (RN-CONT-003) |
| TC-CONT-016 | RN-CONT-008 | P1 | Integração | Independência de Obras | Cadastrar conteúdo e obra | Módulos não compartilham entidade indevidamente |

## Checklist de regressão do módulo

- [ ] Cadastro por tipo e estrutura completa (P0)
- [ ] Status e visibilidade no Hub (P0)
- [ ] Destaque e ordenação (P1)
- [ ] Links externos em nova aba (P0)
- [ ] Independência do módulo Obras (P1)
