# Roteiro de Testes — Gestão de Telas, Navegação Interna e Marquees

**Especificação:** [GESTAO_TELAS_NAVEGACAO_E_MARQUEES.md](./GESTAO_TELAS_NAVEGACAO_E_MARQUEES.md)

## Escopo

Validar cadastro e habilitação de telas, marquees reutilizáveis, itens, navegação interna/externa e regras RN-NAV-001 a 007 no admin e no Hub.

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
| E2E | Admin configurado + comportamento no Hub |

---

## Fluxo operacional macro

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-NAV-001 | P0 | E2E | Fluxo principal completo | Cadastrar tela → habilitar → criar marquee → itens → navegação | Configuração refletida no Hub conforme regras |

## Gestão de Telas

| ID | RF/RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-------|------------|------|---------|--------|-------------------|
| TC-NAV-002 | RF-NAV-001 | P0 | Positivo | Cadastro manual de tela | Admin informa rota/slug e registra tela existente no código-fonte | Registro administrativo criado; RN-NAV-001/002 |
| TC-NAV-004 | RF-NAV-002 | P1 | Positivo | Edição de propriedades | Editar nome/status/referência | Dados atualizados |
| TC-NAV-005 | RF-NAV-003 | P0 | E2E | Desabilitar tela | Desabilitar tela cadastrada | Hub não exibe tela (RN-NAV-003) |
| TC-NAV-006 | RF-NAV-004 | P1 | Positivo | Listagem com status | Listar telas | Exibe habilitada/desabilitada |

## Gestão de Marquees

| ID | RF/RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-------|------------|------|---------|--------|-------------------|
| TC-NAV-007 | RF-NAV-005 | P0 | Positivo | Cadastro de marquee independente | Criar marquee como entidade independente e associar a tela | Marquee criado com CRUD próprio e associado via N:N |
| TC-NAV-008 | RF-NAV-006 | P0 | Positivo | Reutilização em múltiplas telas | Associar mesmo marquee a 2+ telas | RN-NAV-006 atendida |
| TC-NAV-009 | RF-NAV-007 | P1 | Positivo | Layout do marquee | Configurar cores/ícones/estilo | Propriedades persistidas e refletidas no Hub |
| TC-NAV-010 | RF-NAV-008 | P0 | Positivo | CRUD de itens | Cadastrar, editar, remover, ordenar itens | Itens exibidos conforme ordem |
| TC-NAV-011 | RF-NAV-008 | P2 | Positivo | Sem limite de itens | Cadastrar volume elevado de itens | Sistema aceita todos (RN-NAV-007) |

## Navegação dos Itens

| ID | RF/RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-------|------------|------|---------|--------|-------------------|
| TC-NAV-012 | RF-NAV-009 | P0 | E2E | Navegação interna | Configurar destino para tela habilitada | Clique navega corretamente no Hub |
| TC-NAV-013 | RF-NAV-010 | P0 | E2E | Navegação externa | Configurar URL externa | Abre em nova aba |
| TC-NAV-014 | RF-NAV-011 | P0 | Negativo | Bloqueio para tela desabilitada | Apontar item para tela desabilitada | Sistema impede configuração ou exibição (RN-NAV-004) |
| TC-NAV-015 | RN-NAV-005 | P0 | Negativo | Um destino por item | Tentar múltiplos destinos no mesmo item | Apenas interno **ou** externo permitido |

## Checklist de regressão do módulo

- [ ] Cadastro/edição/habilitação de telas (P0)
- [ ] Marquees reutilizáveis e itens (P0)
- [ ] Navegação interna e externa no Hub (P0)
- [ ] Validação contra telas desabilitadas (P0)
