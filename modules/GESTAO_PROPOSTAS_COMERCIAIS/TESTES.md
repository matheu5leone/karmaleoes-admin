# Roteiro de Testes — Gestão de Propostas Comerciais

**Especificação:** [GESTAO_PROPOSTAS_COMERCIAIS.md](./GESTAO_PROPOSTAS_COMERCIAIS.md)

## Escopo

Validar recebimento automático via Hub, visualização somente leitura no admin, consentimento obrigatório e ausência de funcionalidades fora do escopo (RN-PROP-001 a 009).

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
| E2E | Hub + admin |

---

## Fluxo operacional macro

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-PROP-001 | P0 | E2E | Fluxo principal | Formulário Hub → armazenamento → listagem admin → visualização | Proposta recebida e visível no admin; negociação fora do sistema (RN-PROP-004) |

## RF-PROP-001 — Recebimento Automático

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-PROP-002 | P0 | Positivo | Recebimento via Hub | Enviar formulário comercial válido com consentimento | Proposta armazenada automaticamente |
| TC-PROP-003 | P0 | Positivo | Estrutura completa | Validar campos: nome, estado, cidade, empresa, CNPJ (opcional), e-mail, telefone, mensagem, tipo, data/hora | Dados persistidos corretamente |

## RF-PROP-003/004 — Listagem e Visualização

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-PROP-004 | P0 | Positivo | Listagem de propostas | Acessar listagem no admin | Propostas recebidas exibidas |
| TC-PROP-005 | P0 | Positivo | Visualização de detalhes | Acessar proposta individual | Todos os campos da proposta exibidos |

## RF-PROP-005 — Consentimento de Dados

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-PROP-006 | P0 | Negativo | Consentimento obrigatório | Enviar formulário sem consentimento | Envio bloqueado (RN-PROP-008) |
| TC-PROP-007 | P0 | Positivo | Consentimento concedido | Marcar consentimento e enviar | Proposta aceita |

## Regras de Negócio — Escopo reduzido

| ID | RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-----|------------|------|---------|--------|-------------------|
| TC-PROP-010 | RN-PROP-002 | P0 | Negativo | Sem cadastro manual | Buscar funcionalidade de cadastro manual no admin | Funcionalidade inexistente |
| TC-PROP-011 | RN-PROP-003 | P0 | Negativo | Sem gestão de status/pipeline | Buscar controle de status ou pipeline no admin | Funcionalidade inexistente |
| TC-PROP-012 | RN-PROP-009 | P0 | Negativo | Somente leitura | Tentar editar proposta recebida | Operação não disponível |
| TC-PROP-013 | RN-PROP-005 | P2 | Negativo | Sem notificações automáticas | Receber proposta | Nenhum disparo automático |
| TC-PROP-014 | RN-PROP-006 | P2 | Negativo | Sem gestão documental | Buscar upload de contratos | Funcionalidade inexistente |

## Checklist de regressão do módulo

- [ ] Recebimento automático via formulário do Hub (P0)
- [ ] Listagem e visualização somente leitura (P0)
- [ ] Consentimento antes do envio (P0)
- [ ] Ausência de cadastro manual (P0)
- [ ] Ausência de status/pipeline/edição (P0)
- [ ] Ausência de automações (P2)
