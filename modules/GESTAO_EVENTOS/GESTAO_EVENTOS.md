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
5. A partir do dia seguinte à data de referência para expiração, o evento é considerado **expirado por campo virtual** (calculado na leitura): `enable` efetivo `false`; status efetivo "Expirado" se lifecycle ainda for "Em aberto". Não há job; nenhum dado armazenado é mutado.
6. Administrador realiza encerramento manual do evento (lifecycle "Encerrado"), conforme regras de data e status.

### Fluxos alternativos

**Cancelamento antecipado (antes da data de referência)**

1. Evento visível no Hub (enable `true`).
2. Administrador encerra como "Cancelado" (lifecycle "Encerrado", status "Cancelado"; Enable inalterado).
3. Administrador pode setar Enable `false` manualmente a qualquer momento.
4. A partir da data de referência, o `enable` efetivo passa a `false` por campo virtual (o `enable` armazenado e o status "Cancelado" permanecem inalterados).

**Encerramento como Sucesso (na data de referência ou depois)**

1. Administrador encerra como "Sucesso" (lifecycle "Encerrado"; Enable inalterado).
2. A partir da data de referência, o `enable` efetivo passa a `false` por campo virtual (o `enable` armazenado e o status "Sucesso" permanecem inalterados).

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

**"Expirado" (rótulo virtual reservado)**

"Expirado" **não** é um status armazenado: é um rótulo calculado (`status_efetivo`, ver RF-EVENTO-005). Não pode ser atribuído manualmente nem cadastrado como status; o nome é reservado.

**Observação**

Ao alterar o status para "Adiado", o preenchimento do campo "nova data" é obrigatório. A data de referência para expiração passa a ser `nova data`.

### RF-EVENTO-004b — Gestão de Status

O sistema deve permitir cadastro, edição e exclusão de status vinculados a um LifeCycle.

**Restrições**

- O status "Adiado" não pode ser editado nem excluído (definição protegida).
- "Expirado" não é um status armazenado (rótulo virtual reservado): não aparece no CRUD e não pode ser criado.
- Status vinculados a eventos existentes não podem ser excluídos.

### RF-EVENTO-005 — Expiração (campo virtual)

O sistema deve considerar um evento **expirado** a partir do dia seguinte à **data de referência para expiração**. A expiração é **calculada na leitura por campos virtuais** (computados no backend), **não** por job agendado; nenhum dado armazenado é mutado.

**Data de referência para expiração**

- Padrão: campo `data`.
- Se status for "Adiado" e `nova data` estiver preenchida: campo `nova data`.

**Campos virtuais derivados**

| Campo virtual | Regra de cálculo |
|---------------|------------------|
| `expirado` | `true` quando a data atual ultrapassa a data de referência (dia seguinte em diante). |
| `status_efetivo` | "Expirado" quando `expirado` **e** lifecycle "Em aberto"; caso contrário, o status armazenado. |
| `enable_efetivo` | `enable` armazenado **E NÃO** `expirado`. É o valor que rege a visibilidade no Hub. |

**Comportamento por situação**

| Situação (após a data de referência) | LifeCycle | `status_efetivo` | `enable_efetivo` |
|--------------------------------------|-----------|------------------|------------------|
| Lifecycle "Em aberto" | Permanece "Em aberto" | "Expirado" | `false` |
| Lifecycle "Encerrado" | Permanece "Encerrado" | Status armazenado (Sucesso/Cancelado) | `false` |

**Observações**

- O `enable` **armazenado** nunca é alterado pelo sistema; apenas o `enable_efetivo` reflete a expiração.
- Como é reativo à data de referência, alterar a data (ex.: status "Adiado" com `nova data` futura) faz o evento deixar de ser expirado automaticamente.
- A data corrente e o fuso horário de comparação serão definidos pelo time de desenvolvimento.

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

- O campo Enable (armazenado) controla a intenção do admin de exibir o evento no Hub, independentemente do lifecycle ou status.
- Default ao cadastrar: `false`.
- O administrador pode alterar manualmente o valor do Enable a qualquer momento.
- A visibilidade real no Hub usa o `enable_efetivo` = `enable` armazenado **E NÃO** `expirado` (RF-EVENTO-005). Quando expirado, o `enable_efetivo` é `false` sem alterar o `enable` armazenado.
- O encerramento manual não altera o Enable.

## Regras de Negócio

| ID | Regra |
|----|-------|
| RN-EVENTO-001 | Eventos serão cadastrados exclusivamente por administradores do sistema. |
| RN-EVENTO-002 | Eventos somente serão visíveis no Hub quando o `enable_efetivo` for `true` (ou seja, `enable` armazenado `true` e evento não expirado). |
| RN-EVENTO-003 | O Hub não realizará venda de ingressos diretamente. |
| RN-EVENTO-004 | Toda compra deverá ocorrer em plataforma externa. |
| RN-EVENTO-005 | A expiração é calculada por campo virtual a partir do dia seguinte à data de referência (sem job, sem mutação de dados). Se lifecycle "Em aberto": `status_efetivo` = "Expirado", lifecycle permanece "Em aberto". Se lifecycle "Encerrado": lifecycle e status permanecem inalterados. Em ambos os casos, `enable_efetivo` = `false`. |
| RN-EVENTO-006 | A visibilidade no Hub é controlada exclusivamente pelo `enable_efetivo` (deriva de `enable` armazenado e da expiração calculada). |
| RN-EVENTO-007 | O encerramento de um evento consiste em transicionar o lifecycle de "Em aberto" para "Encerrado", com observação e seleção de status do lifecycle "Encerrado" obrigatórios. |
| RN-EVENTO-008 | Ao alterar o status para "Adiado", o preenchimento do campo "nova data" é obrigatório. A data de referência para expiração passa a ser `nova data`. |
| RN-EVENTO-009 | O status "Adiado" é protegido: não pode ser editado nem excluído. "Expirado" é rótulo virtual reservado (não armazenado, não cadastrável). |
| RN-EVENTO-010 | Os status são dinâmicos e gerenciáveis pelo admin, vinculados a um LifeCycle ("Em aberto" ou "Encerrado"). |
| RN-EVENTO-011 | O encerramento manual não altera o Enable armazenado. Nenhuma rotina do sistema altera o `enable` armazenado; a expiração apenas zera o `enable_efetivo` (campo virtual). O administrador pode alterar Enable manualmente a qualquer momento. |
| RN-EVENTO-012 | O campo Enable tem default `false` ao cadastrar um evento. |
| RN-EVENTO-013 | Status vinculados a eventos existentes não podem ser excluídos. |
| RN-EVENTO-014 | Encerramento como Sucesso somente é permitido na data de referência para expiração ou depois. |
| RN-EVENTO-015 | Encerramento como Cancelado antes da data de referência: lifecycle "Encerrado", status "Cancelado", Enable inalterado. A partir da data de referência, o `enable_efetivo` passa a `false` por campo virtual; lifecycle, status e `enable` armazenado permanecem inalterados. |

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
| Enable | true / false (armazenado; intenção do admin, default false) |
| Prioridade de exibição | Ordem ou destaque no Hub |
| Nova data | Nova data do evento (obrigatório quando status for "Adiado") |
| Observação de encerramento | Texto obrigatório preenchido no encerramento |
| Data de criação | Registro de criação |
| Data de atualização | Última modificação |

**Campos virtuais (calculados na leitura — não persistidos, ver RF-EVENTO-005)**

| Campo | Descrição |
|-------|-----------|
| Data de referência para expiração | Derivada: `data` ou `nova data` (se Adiado) |
| `expirado` | `true` a partir do dia seguinte à data de referência |
| `status_efetivo` | "Expirado" se `expirado` e lifecycle "Em aberto"; senão o status armazenado |
| `enable_efetivo` | `enable` armazenado **E NÃO** `expirado` (rege a visibilidade no Hub) |

### Status de Evento

Representa os status dinâmicos que podem ser atribuídos a eventos.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Identificador | ID único do status |
| Nome | Nome do status |
| LifeCycle vinculado | Em aberto / Encerrado |
| Protegido | Booleano (`true` para "Adiado"; impede edição e exclusão da definição) |

**Status iniciais pré-cadastrados**

| Status | LifeCycle | Atribuição | Protegido |
|--------|-----------|------------|-----------|
| Ingressos a venda | Em aberto | Manual | Não |
| Esgotado | Em aberto | Manual | Não |
| Adiado | Em aberto | Manual | Sim |
| Sucesso | Encerrado | Manual (encerramento) | Não |
| Cancelado | Encerrado | Manual (encerramento) | Não |

> "Expirado" **não** consta como status armazenado: é um rótulo virtual (`status_efetivo`) calculado na leitura (RF-EVENTO-005). O nome é reservado e não pode ser cadastrado.
