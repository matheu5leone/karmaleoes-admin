# Roteiro de Testes — Gestão de Banners por Tela

**Especificação:** [GESTAO_BANNERS_POR_TELA.md](./GESTAO_BANNERS_POR_TELA.md)

## Escopo

Validar ciclo de vida de banners (cadastro como asset, associação a telas com status draft/publicado por vínculo, substituição automática de banner ativo por tela sem efeito colateral em outras telas) e exibição no Hub conforme RN-BANNER-001 a 008.

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
| E2E | Admin + exibição no Hub |

---

## Fluxo operacional macro

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-BANNER-001 | P0 | E2E | Fluxo principal | Cadastrar banner → associar a telas (draft) → publicar por tela → validar ativo | Banner exibido conforme status de cada associação |

## Requisitos Funcionais

| ID | RF/RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-------|------------|------|---------|--------|-------------------|
| TC-BANNER-002 | RF-BANNER-001 | P0 | Positivo | Cadastro com nome e imagem | Cadastrar banner com nome e imagem | Banner criado como asset, sem status global |
| TC-BANNER-003 | RF-BANNER-002 | P0 | Positivo | Associação multi-tela | Associar banner a 2+ telas habilitadas | Vínculos criados com status `draft` (RN-BANNER-001) |
| TC-BANNER-003b | RF-BANNER-002 | P0 | Negativo | Associação em tela desabilitada | Tentar associar banner a tela desabilitada | Operação bloqueada ou alerta (RN-BANNER-008) |
| TC-BANNER-004 | RF-BANNER-003 | P1 | Positivo | Edição de banner | Alterar nome/imagem do banner | Dados atualizados em todas as telas associadas |
| TC-BANNER-005 | RF-BANNER-004 | P0 | Positivo | Publicação por associação | Alterar status draft → publicado em uma associação | RN-BANNER-004: transição manual por tela |
| TC-BANNER-006 | RF-BANNER-004 | P0 | E2E | Draft não exibido | Manter associação em draft | Hub não exibe banner na tela (RN-BANNER-003) |
| TC-BANNER-007 | RF-BANNER-005 | P0 | Positivo | Substituição automática na mesma tela | Publicar segundo banner na mesma tela | Associação anterior **da mesma tela** revertida para draft; nova associação ativa (RN-BANNER-006) |
| TC-BANNER-008 | RF-BANNER-006 | P1 | Positivo | Listagem consolidada | Listar banners | Exibe imagem, telas associadas e status de cada vínculo |
| TC-BANNER-012 | RF-BANNER-006 | P0 | Positivo | Publicação isolada por tela | Banner A publicado em Tela 1 e Tela 2; publicar Banner B só na Tela 1 | Banner A permanece `publicado` na Tela 2; na Tela 1 Banner A volta para draft e Banner B fica ativo |
| TC-BANNER-013 | RN-BANNER-007 | P1 | E2E | Tela desabilitada oculta banner | Associação `publicado` + tela desabilitada | Hub não exibe banner (RN-BANNER-007) |

## Escopo excluído (RN-BANNER-005)

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-BANNER-009 | P2 | Negativo | Sem ordenação | Verificar UI/API | Não há ordenação de banners |
| TC-BANNER-010 | P2 | Negativo | Sem versionamento | Editar banner com associações publicadas | Sem histórico de versões |
| TC-BANNER-011 | P2 | Negativo | Sem agendamento | Buscar agendamento automático | Funcionalidade inexistente no MVP |

## Checklist de regressão do módulo

- [ ] Cadastro de banner como asset (nome + imagem, sem status global) (P0)
- [ ] Associação a telas habilitadas com status draft por vínculo (P0)
- [ ] Publicação por associação/tela (P0)
- [ ] Substituição automática restrita à tela afetada (P0)
- [ ] Multi-tela sem efeito colateral ao publicar em uma tela (P0)
- [ ] Ocultação em telas desabilitadas (P1)
- [ ] Listagem administrativa com status por vínculo (P1)
