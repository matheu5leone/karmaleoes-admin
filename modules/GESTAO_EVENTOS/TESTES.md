# Roteiro de Testes — Gestão de Eventos

**Especificação:** [GESTAO_EVENTOS.md](./GESTAO_EVENTOS.md)

## Escopo

Validar cadastro manual, lifecycle (Em aberto / Encerrado), status dinâmicos vinculados a lifecycle, campo Enable para visibilidade, expiração por campo virtual (`status_efetivo`/`enable_efetivo`, comportamento distinto por lifecycle, sem mutação de dados), encerramento manual com restrições de data, gestão de status e regras de exibição no Hub (RN-EVENTO-001 a 015).

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
| E2E | Admin + Hub + link externo |

---

## Fluxo operacional macro

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-EVENTO-001 | P0 | E2E | Fluxo principal completo | Cadastrar (enable false) → habilitar (enable true) → visualizar no Hub → link compra → expirar (campo virtual: `enable_efetivo` false, `status_efetivo` Expirado) → encerrar Sucesso | Ciclo completo conforme especificação |
| TC-EVENTO-001b | P0 | E2E | Cancelamento antecipado | Enable true → encerrar Cancelado antes da data → enable inalterado → expiração → enable false, lifecycle Encerrado e status Cancelado mantidos | RN-EVENTO-015 |

## RF-EVENTO-001 — Cadastro de Evento

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-EVENTO-002 | P0 | Positivo | Cadastro com estrutura completa | Cadastrar evento com todos os campos | Evento persistido; lifecycle "Em aberto"; enable `false` (RN-EVENTO-012) |
| TC-EVENTO-002b | P0 | Positivo | Enable default false | Cadastrar evento sem alterar enable | Enable é `false`; evento não visível no Hub |

## RF-EVENTO-002/003 — Edição e Listagem

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-EVENTO-003 | P1 | Positivo | Edição de evento | Alterar campos do evento | Dados atualizados |
| TC-EVENTO-004 | P1 | Positivo | Listagem com lifecycle, status e enable | Listar eventos | Lifecycle, status e enable visíveis na listagem |

## RF-EVENTO-004 — Controle de Status

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-EVENTO-005 | P0 | Positivo | Transição entre status do lifecycle "Em aberto" | Alterar entre Ingressos a venda, Esgotado, Adiado | Status persistido dentro do lifecycle "Em aberto" |
| TC-EVENTO-005b | P0 | Negativo | Alterar para status de outro lifecycle | Tentar atribuir status "Sucesso" a evento "Em aberto" | Operação bloqueada; status incompatível com lifecycle |
| TC-EVENTO-005c | P0 | Positivo | Adiado com nova data obrigatória | Definir status "Adiado" e preencher nova data | Nova data persistida; data de referência atualizada (RN-EVENTO-008) |
| TC-EVENTO-005d | P0 | Negativo | Adiado sem nova data | Definir status "Adiado" sem preencher nova data | Operação bloqueada; campo obrigatório (RN-EVENTO-008) |

## RF-EVENTO-004b — Gestão de Status

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-EVENTO-020 | P0 | Positivo | Cadastro de novo status | Criar status vinculado a lifecycle "Em aberto" | Status criado e disponível para uso |
| TC-EVENTO-021 | P0 | Positivo | Cadastro de status para "Encerrado" | Criar status vinculado a lifecycle "Encerrado" | Status criado e disponível para encerramento |
| TC-EVENTO-022 | P1 | Positivo | Edição de status | Alterar nome de status existente | Dados atualizados |
| TC-EVENTO-023 | P1 | Positivo | Exclusão de status | Excluir status não protegido e sem eventos vinculados | Status removido |
| TC-EVENTO-023b | P0 | Negativo | Exclusão de status em uso | Tentar excluir status vinculado a eventos existentes | Operação bloqueada (RN-EVENTO-013) |
| TC-EVENTO-024 | P0 | Negativo | "Expirado" não cadastrável | Tentar criar status com nome "Expirado" | Operação bloqueada; nome reservado (rótulo virtual, RN-EVENTO-009) |
| TC-EVENTO-024b | P0 | Negativo | Edição de "Adiado" | Tentar editar o status "Adiado" | Operação bloqueada (RN-EVENTO-009) |
| TC-EVENTO-025 | P0 | Negativo | "Expirado" ausente do CRUD | Listar status gerenciáveis | "Expirado" não consta (não é status armazenado, RN-EVENTO-009) |
| TC-EVENTO-025b | P0 | Negativo | Exclusão de "Adiado" | Tentar excluir o status "Adiado" | Operação bloqueada (RN-EVENTO-009) |

## RF-EVENTO-005 — Expiração (campo virtual)

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-EVENTO-006 | P0 | Positivo | Expiração com lifecycle Em aberto | Evento Em aberto com data de referência de ontem | `status_efetivo` "Expirado"; `enable_efetivo` `false`; lifecycle e dados armazenados inalterados (RN-EVENTO-005) |
| TC-EVENTO-006b | P0 | E2E | Expiração oculta no Hub | Evento expirado (campo virtual) | Evento não visível no Hub (`enable_efetivo` false) |
| TC-EVENTO-006c | P0 | Negativo | Evento no dia, ainda visível | Evento com data de referência de hoje e enable true | Evento ainda visível; `expirado` só a partir do dia seguinte |
| TC-EVENTO-006d | P0 | Positivo | Expiração usa nova data após Adiado | Evento Adiado com nova data de ontem | `expirado` calculado pela nova data, não pela data original (RN-EVENTO-008) |
| TC-EVENTO-006e | P0 | Positivo | Expiração de evento Encerrado/Cancelado | Evento Encerrado/Cancelado com enable true antes da expiração | `enable_efetivo` `false`; lifecycle "Encerrado"/status "Cancelado"/enable armazenado inalterados (RN-EVENTO-005/015) |
| TC-EVENTO-006f | P0 | Positivo | Expiração de evento Encerrado/Sucesso | Evento Encerrado/Sucesso com enable true | `enable_efetivo` `false`; lifecycle "Encerrado"/status "Sucesso"/enable armazenado inalterados (RN-EVENTO-005) |
| TC-EVENTO-006g | P1 | Positivo | Expiração é reativa à data | Evento expirado; admin define Adiado + nova data futura | Evento deixa de ser `expirado`; `enable_efetivo` volta ao enable armazenado, sem job |

## RF-EVENTO-006 — Encerramento Manual

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-EVENTO-007 | P0 | Positivo | Encerramento Sucesso na data ou depois | Encerrar evento na data de referência selecionando "Sucesso" e preenchendo observação | Lifecycle "Encerrado"; status "Sucesso"; observação persistida; enable inalterado (RN-EVENTO-007/011) |
| TC-EVENTO-007b | P0 | Negativo | Encerramento sem observação | Tentar encerrar sem preencher observação | Operação bloqueada; campo obrigatório |
| TC-EVENTO-007c | P0 | Negativo | Encerramento sem status | Tentar encerrar sem selecionar status de encerramento | Operação bloqueada; campo obrigatório |
| TC-EVENTO-007d | P0 | Positivo | Encerramento Cancelado antes da data | Encerrar evento como "Cancelado" antes da data de referência | Lifecycle "Encerrado"; status "Cancelado"; enable inalterado (RN-EVENTO-015) |
| TC-EVENTO-007e | P0 | Negativo | Sucesso antes da data de referência | Tentar encerrar como "Sucesso" antes da data de referência | Operação bloqueada (RN-EVENTO-014) |
| TC-EVENTO-007f | P0 | Positivo | Encerramento de evento expirado | Encerrar como "Sucesso" um evento expirado (`status_efetivo` "Expirado", lifecycle Em aberto) | Lifecycle "Encerrado"; status "Sucesso"; enable armazenado inalterado |

## RF-EVENTO-007/008 — Navegação e Priorização

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-EVENTO-008 | P0 | E2E | Link de compra externo | Clicar link no Hub | Abre em nova aba; RN-EVENTO-003/004 |
| TC-EVENTO-009 | P1 | E2E | Priorização de exibição | Definir prioridade em 2 eventos | Evento prioritário destacado no Hub |

## RF-EVENTO-009 — Controle de Visibilidade (Enable)

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-EVENTO-030 | P0 | E2E | Enable true = visível | Setar enable true em evento | Evento visível no Hub (RN-EVENTO-002/006) |
| TC-EVENTO-031 | P0 | E2E | Enable false = oculto | Setar enable false em evento | Evento não visível no Hub |
| TC-EVENTO-032 | P0 | Positivo | Admin altera enable manualmente | Alterar enable de false para true e vice-versa | Valor persistido; visibilidade atualizada |
| TC-EVENTO-033 | P0 | Positivo | Admin seta enable false em cancelado | Encerrar Cancelado (enable true) → admin seta enable false | Enable false; evento oculto no Hub (RN-EVENTO-011) |
| TC-EVENTO-043 | P1 | E2E | Encerrado + enable true = visível | Evento Encerrado/Cancelado com enable true antes da expiração | Evento visível no Hub até a data de referência (oculto por `enable_efetivo` no cálculo virtual) |

## Regras de Negócio

| ID | RN | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|-----|------------|------|---------|--------|-------------------|
| TC-EVENTO-010 | RN-EVENTO-001 | P0 | Negativo | Cadastro só por admin | Usuário não autenticado tenta cadastrar | Operação negada |
| TC-EVENTO-040 | RN-EVENTO-010 | P0 | Positivo | Status dinâmicos por lifecycle | Listar status disponíveis por lifecycle | Status corretos para cada lifecycle |
| TC-EVENTO-041 | RN-EVENTO-011 | P0 | E2E | Cancelado: enable inalterado no encerramento | Encerrar Cancelado com enable true | Enable permanece `true` |
| TC-EVENTO-041b | RN-EVENTO-011 | P0 | E2E | Cancelado: enable false manual | Encerrar Cancelado → admin seta enable false | Enable `false`; oculto no Hub |
| TC-EVENTO-042 | RN-EVENTO-015 | P0 | E2E | Cancelado: expiração zera enable_efetivo | Encerrar Cancelado (enable true) → passar da data de referência | `enable_efetivo` `false` (oculto no Hub); lifecycle Encerrado, status Cancelado e enable armazenado mantidos |

## Checklist de regressão do módulo

- [ ] Cadastro com enable default false e lifecycle "Em aberto" (P0)
- [ ] Controle de enable para visibilidade no Hub (P0)
- [ ] Status dinâmicos vinculados a lifecycle (P0)
- [ ] Proteção do status "Adiado"; "Expirado" reservado/virtual (não cadastrável) (P0)
- [ ] Exclusão de status em uso bloqueada (P0)
- [ ] Adiado exige nova data; expiração usa nova data (P0)
- [ ] Expiração Em aberto: `status_efetivo` Expirado + `enable_efetivo` false (campo virtual, sem mutação) (P0)
- [ ] Expiração Encerrado: lifecycle/status inalterados + enable false (P0)
- [ ] Encerramento Sucesso bloqueado antes da data de referência (P0)
- [ ] Encerramento Cancelado antes da data: enable inalterado (P0)
- [ ] Encerramento manual não altera enable (P0)
- [ ] Admin pode setar enable false manualmente a qualquer momento (P0)
- [ ] Link externo em nova aba (P0)
- [ ] Priorização de exibição (P1)
