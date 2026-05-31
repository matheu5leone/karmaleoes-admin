# Gestão de Eventos

**Módulo:** Gestão de Eventos

## Objetivo

Permitir gerenciamento administrativo de eventos divulgados no Hub Karmaleões, incluindo cadastro, atualização, controle de lifecycle e status dinâmicos, visibilidade via campo Enable e priorização de exibição.

## Fluxo Operacional Macro

### Fluxo principal

1. Evento é cadastrado manualmente no sistema (lifecycle "Em aberto", enable `false`).
2. Administrador habilita o evento (enable `true`) para torná-lo visível no Hub.
3. Usuários visualizam informações do evento.
4. Usuários são redirecionados para plataforma externa de compra.
5. Evento expira automaticamente no dia seguinte à data de referência para expiração (Enable `false`; status "Expirado" se lifecycle ainda for "Em aberto").
6. Administrador realiza encerramento manual do evento (lifecycle "Encerrado"), conforme regras de data e status.

### Fluxos alternativos

**Cancelamento antecipado (antes da data de referência)**

1. Evento visível no Hub (enable `true`).
2. Administrador encerra como "Cancelado" (lifecycle "Encerrado", status "Cancelado"; Enable inalterado).
3. Administrador pode setar Enable `false` manualmente a qualquer momento.
4. Na data de expiração, o sistema seta Enable `false` automaticamente, mantendo lifecycle "Encerrado" e status "Cancelado".

**Encerramento como Sucesso (na data de referência ou depois)**

1. Administrador encerra como "Sucesso" (lifecycle "Encerrado"; Enable inalterado).
2. Na data de expiração, o sistema seta Enable `false` automaticamente, mantendo lifecycle "Encerrado" e status "Sucesso".

## Requisitos Funcionais

### RF-EVENTO-001 — Cadastro de Evento

O sistema deve permitir cadastro manual de eventos administrativos.

**Estrutura do evento**

- nome;
- descrição;
- categoria/tipo;
- data;
- horário;
- local;
- organizador;
- link externo de compra;
- lifecycle;
- status;
- enable;
- nova data (obrigatório quando o status for "Adiado");
- observação de encerramento (obrigatória ao encerrar).

### RF-EVENTO-002 — Edição de Evento

O sistema deve permitir edição de eventos cadastrados.

### RF-EVENTO-003 — Listagem de Eventos

O sistema deve permitir listar eventos cadastrados com seus respectivos lifecycle, status e enable.

### RF-EVENTO-004 — Controle de Status

O sistema deve permitir alteração manual do status do evento dentre os status vinculados ao lifecycle atual.

**Status iniciais pré-cadastrados (lifecycle "Em aberto")**

- Ingressos a venda;
- Esgotado;
- Adiado.

**Status iniciais pré-cadastrados (lifecycle "Encerrado")**

- Sucesso;
- Cancelado.

**Status protegidos**

| Status | Atribuição | Definição protegida |
|--------|------------|---------------------|
| Adiado | Manual (exige `nova data`) | Sim |
| Expirado | Exclusivamente pelo sistema (expiração automática) | Sim |

**Observação**

Ao alterar o status para "Adiado", o preenchimento do campo "nova data" é obrigatório. A data de referência para expiração passa a ser `nova data`.

### RF-EVENTO-004b — Gestão de Status

O sistema deve permitir cadastro, edição e exclusão de status vinculados a um LifeCycle.

**Restrições**

- Os status "Expirado" e "Adiado" não podem ser editados nem excluídos (definição protegida).
- Status vinculados a eventos existentes não podem ser excluídos.

### RF-EVENTO-005 — Expiração Automática

O sistema deve expirar automaticamente eventos no dia seguinte à **data de referência para expiração**.

**Data de referência para expiração**

- Padrão: campo `data`.
- Se status for "Adiado" e `nova data` estiver preenchida: campo `nova data`.

**Momento de execução**

No primeiro instante do dia calendário seguinte à data de referência. O fuso horário será definido pelo time de desenvolvimento.

**Comportamento da expiração automática**

A job de expiração **sempre** seta Enable para `false`, independentemente do lifecycle:

| Situação no momento da expiração | LifeCycle | Status | Enable |
|-----------------------------------|-----------|--------|--------|
| Lifecycle "Em aberto" | Permanece "Em aberto" | Alterado para "Expirado" | `false` |
| Lifecycle "Encerrado" | Permanece "Encerrado" | Permanece inalterado | `false` |

### RF-EVENTO-006 — Encerramento Manual

O sistema deve permitir encerramento manual de eventos pelos administradores. Encerrar um evento consiste em transicionar o lifecycle de "Em aberto" para "Encerrado".

**Regras de encerramento**

Ao encerrar, o administrador deve obrigatoriamente:

- selecionar o status dentre os status do lifecycle "Encerrado" (Sucesso ou Cancelado);
- preencher uma observação de encerramento.

**Restrições por data de referência**

| Status de encerramento | Permitido quando |
|------------------------|------------------|
| Cancelado | A qualquer momento enquanto lifecycle for "Em aberto" (incluindo antes da data de referência) |
| Sucesso | Somente na data de referência ou depois |

**Comportamento do Enable no encerramento**

O encerramento manual **não altera** o Enable. O administrador pode setar Enable manualmente a qualquer momento, inclusive após encerramento.

**Observações**

- O campo status do evento é atualizado para o status selecionado no encerramento. Não há campo separado de "status de encerramento".
- Eventos com status "Expirado" (lifecycle "Em aberto") podem ser encerrados manualmente.
- Encerramento como Sucesso antes da data de referência deve ser rejeitado.

### RF-EVENTO-007 — Navegação Externa

O sistema deve permitir redirecionamento para plataformas externas de compra.

**Regra**

Links externos devem abrir em nova aba.

### RF-EVENTO-008 — Priorização de Exibição

O sistema deve permitir definir prioridade de exibição para eventos no Hub.

**Objetivo**

Destacar eventos estratégicos ou principais.

### RF-EVENTO-009 — Controle de Visibilidade (Enable)

O sistema deve permitir habilitar ou desabilitar a visualização do evento no Hub através do campo Enable.

**Regras**

- O campo Enable controla exclusivamente se o evento é visível no Hub, independentemente do lifecycle ou status.
- Default ao cadastrar: `false`.
- O administrador pode alterar manualmente o valor do Enable a qualquer momento.
- A expiração automática seta Enable para `false`.
- O encerramento manual não altera o Enable.

## Regras de Negócio

| ID | Regra |
|----|-------|
| RN-EVENTO-001 | Eventos serão cadastrados exclusivamente por administradores do sistema. |
| RN-EVENTO-002 | Eventos somente serão visíveis no Hub quando o campo Enable estiver como `true`. |
| RN-EVENTO-003 | O Hub não realizará venda de ingressos diretamente. |
| RN-EVENTO-004 | Toda compra deverá ocorrer em plataforma externa. |
| RN-EVENTO-005 | A expiração automática ocorre no dia seguinte à data de referência para expiração. Se lifecycle "Em aberto": status "Expirado", lifecycle permanece "Em aberto". Se lifecycle "Encerrado": lifecycle e status permanecem inalterados. Em ambos os casos, Enable é setado para `false`. |
| RN-EVENTO-006 | A visibilidade no Hub é controlada exclusivamente pelo campo Enable. |
| RN-EVENTO-007 | O encerramento de um evento consiste em transicionar o lifecycle de "Em aberto" para "Encerrado", com observação e seleção de status do lifecycle "Encerrado" obrigatórios. |
| RN-EVENTO-008 | Ao alterar o status para "Adiado", o preenchimento do campo "nova data" é obrigatório. A data de referência para expiração passa a ser `nova data`. |
| RN-EVENTO-009 | Os status "Expirado" e "Adiado" são protegidos: não podem ser editados nem excluídos. |
| RN-EVENTO-010 | Os status são dinâmicos e gerenciáveis pelo admin, vinculados a um LifeCycle ("Em aberto" ou "Encerrado"). |
| RN-EVENTO-011 | O encerramento manual não altera o Enable. Apenas a expiração automática seta Enable para `false`. O administrador pode alterar Enable manualmente a qualquer momento. |
| RN-EVENTO-012 | O campo Enable tem default `false` ao cadastrar um evento. |
| RN-EVENTO-013 | Status vinculados a eventos existentes não podem ser excluídos. |
| RN-EVENTO-014 | Encerramento como Sucesso somente é permitido na data de referência para expiração ou depois. |
| RN-EVENTO-015 | Encerramento como Cancelado antes da data de referência: lifecycle "Encerrado", status "Cancelado", Enable inalterado. Na expiração automática, Enable é setado para `false`; lifecycle e status permanecem inalterados. |

## Estrutura Conceitual das Entidades

### Evento

Representa um evento divulgado no Hub.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Identificador | ID único do evento |
| Nome | Nome do evento |
| Descrição | Detalhamento do evento |
| Categoria | Tipo ou categoria do evento |
| Data | Data de ocorrência original |
| Horário | Horário de início |
| Local | Local de realização |
| Organizador | Responsável pelo evento |
| Link externo | URL da plataforma de compra |
| LifeCycle | Em aberto / Encerrado |
| Status | Referência à entidade Status de Evento |
| Enable | true / false (controle de visibilidade no Hub, default false) |
| Prioridade de exibição | Ordem ou destaque no Hub |
| Nova data | Nova data do evento (obrigatório quando status for "Adiado") |
| Data de referência para expiração | Derivada: `data` ou `nova data` (se Adiado) |
| Observação de encerramento | Texto obrigatório preenchido no encerramento |
| Data de criação | Registro de criação |
| Data de atualização | Última modificação |

### Status de Evento

Representa os status dinâmicos que podem ser atribuídos a eventos.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Identificador | ID único do status |
| Nome | Nome do status |
| LifeCycle vinculado | Em aberto / Encerrado |
| Protegido | Booleano (`true` para "Expirado" e "Adiado"; impede edição e exclusão da definição) |

**Status iniciais pré-cadastrados**

| Status | LifeCycle | Atribuição | Protegido |
|--------|-----------|------------|-----------|
| Ingressos a venda | Em aberto | Manual | Não |
| Esgotado | Em aberto | Manual | Não |
| Adiado | Em aberto | Manual | Sim |
| Expirado | Em aberto | Sistema (expiração) | Sim |
| Sucesso | Encerrado | Manual (encerramento) | Não |
| Cancelado | Encerrado | Manual (encerramento) | Não |
