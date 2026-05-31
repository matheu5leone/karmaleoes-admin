# Roteiro de Testes — Gestão de Fãs (CRM Inicial)

**Especificação:** [GESTAO_FAS_CRM_INICIAL.md](./GESTAO_FAS_CRM_INICIAL.md)

## Escopo

Validar cadastro público no Hub, consentimentos granulares, duplicidade por CPF com validação de dígitos, listagem e filtros geográficos, e limites do MVP (RN-FAN-001 a 009).

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
| TC-FAN-001 | P0 | E2E | Fluxo principal | Formulário → consentimentos → validar duplicidade → armazenar → listar no admin | Fã cadastrado e visível na base |

## Requisitos Funcionais

| ID | RF/RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-------|------------|------|---------|--------|-------------------|
| TC-FAN-002 | RF-FAN-001 | P0 | Positivo | Cadastro via Hub | Preencher formulário público | Fã registrado |
| TC-FAN-003 | RF-FAN-002 | P0 | Positivo | Estrutura completa | Validar nome, CPF, telefone, e-mail, nascimento, estado, cidade, consentimentos, data | Campos persistidos |
| TC-FAN-004 | RF-FAN-003 | P0 | Negativo | Armazenamento obrigatório | Enviar sem consentimento_armazenamento | Bloqueado (RN-FAN-003) |
| TC-FAN-004b | RF-FAN-003 | P0 | Positivo | Armazenamento aceito | Marcar consentimento_armazenamento | Cadastro permitido |
| TC-FAN-004c | RF-FAN-003 | P1 | Positivo | Comunicações e marketing opcionais | Cadastrar com armazenamento true e comunicações/marketing false | Cadastro concluído; opt-ins registrados como false |
| TC-FAN-005 | RF-FAN-003 | P0 | Positivo | Três consentimentos independentes | Aceitar armazenamento, comunicações e marketing | Três booleanos persistidos separadamente |
| TC-FAN-006 | RF-FAN-004 | P0 | Negativo | Duplicidade por CPF | Cadastrar mesmo CPF duas vezes | Segundo cadastro rejeitado (RN-FAN-002/009) |
| TC-FAN-006b | RF-FAN-004 | P0 | Negativo | CPF inválido | Informar CPF com dígitos verificadores incorretos | Cadastro bloqueado; validação de dígitos |
| TC-FAN-006c | RF-FAN-004 | P0 | Negativo | CPF vazio | Tentar cadastrar sem informar CPF | Cadastro bloqueado; campo obrigatório |
| TC-FAN-006d | RN-FAN-009 | P0 | Negativo | Mensagem de CPF duplicado | Cadastrar CPF já existente | Mensagem informativa; registro existente inalterado |
| TC-FAN-007 | RF-FAN-005 | P0 | Positivo | Listagem no admin | Acessar base consolidada | Lista exibe fãs cadastrados |
| TC-FAN-008 | RF-FAN-006 | P1 | Positivo | Filtro por estado/cidade | Aplicar filtros geográficos | Resultados segmentados corretamente |

## Regras de Negócio — MVP

| ID | RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-----|------------|------|---------|--------|-------------------|
| TC-FAN-010 | RN-FAN-001 | P0 | Positivo | Cadastro inicial via Hub | Primeiro cadastro pelo formulário | Fluxo principal atendido |
| TC-FAN-011 | RN-FAN-004 | P1 | Positivo | Finalidade dos dados | Verificar uso declarado | Administrativa, analítica, campanhas futuras |
| TC-FAN-012 | RN-FAN-005 | P2 | Negativo | Sem automações CRM | Buscar workflows automáticos | Inexistentes no MVP |
| TC-FAN-013 | RN-FAN-006 | P2 | Negativo | Sem comunicações automáticas | Cadastrar fã | Nenhum e-mail/SMS automático |
| TC-FAN-014 | RN-FAN-007 | P2 | Negativo | Sem rastreamento de origem | Cadastrar fã | Campo origem não disponível |
| TC-FAN-015 | RN-FAN-008 | P2 | Negativo | Sem status de fã | Buscar status no cadastro | Controle inexistente no MVP |

## Checklist de regressão do módulo

- [ ] Cadastro público com estrutura completa (P0)
- [ ] Consentimento de armazenamento obrigatório (P0)
- [ ] Consentimentos de comunicações e marketing opcionais (P1)
- [ ] Bloqueio de duplicidade por CPF com mensagem informativa (P0)
- [ ] Validação de dígitos verificadores do CPF (P0)
- [ ] Listagem e filtros geográficos no admin (P0/P1)
- [ ] Ausência de automações MVP (P2)
