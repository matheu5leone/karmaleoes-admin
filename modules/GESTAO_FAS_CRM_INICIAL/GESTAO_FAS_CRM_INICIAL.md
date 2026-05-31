# Gestão de Fãs (CRM Inicial)

**Módulo:** Gestão de Fãs (CRM Inicial)

## Objetivo

Permitir coleta, armazenamento e gerenciamento inicial de dados de fãs do Hub Karmaleões para fins de mailing, análise de público e campanhas futuras.

## Fluxo Operacional Macro

### Fluxo principal

1. Usuário preenche formulário no Hub.
2. Usuário concede consentimentos (armazenamento obrigatório; comunicações e marketing opcionais).
3. Sistema valida duplicidade de cadastro.
4. Sistema armazena dados do fã.
5. Administradores visualizam base consolidada no módulo administrativo.
6. Administradores utilizam informações para análises e campanhas futuras.

## Requisitos Funcionais

### RF-FAN-001 — Cadastro de Fãs

O sistema deve permitir cadastro de fãs através de formulário público no Hub.

### RF-FAN-002 — Estrutura do Cadastro

Cada fã deverá possuir:

- nome;
- CPF;
- telefone;
- e-mail;
- data de nascimento;
- localização:
  - estado;
  - cidade;
- consentimento_armazenamento;
- consentimento_comunicacoes;
- consentimento_marketing;
- data de cadastro.

### RF-FAN-003 — Consentimento de Dados

O formulário deverá solicitar consentimento explícito para:

- armazenamento de dados (obrigatório);
- recebimento de comunicações (opcional);
- ações de marketing (opcional).

**Regra**

O cadastro só será concluído se `consentimento_armazenamento` for `true`. Os consentimentos de comunicações e marketing são opt-in independentes e opcionais.

### RF-FAN-004 — Validação de Duplicidade

O sistema deve impedir múltiplos cadastros utilizando o CPF como identificador principal.

**Regras**

- CPF é campo obrigatório.
- O sistema deve validar os dígitos verificadores do CPF.
- A deduplicação será realizada pelo CPF.
- CPF já cadastrado: exibir mensagem informativa; não criar novo registro.

### RF-FAN-005 — Listagem de Fãs

O sistema deve permitir visualização da base consolidada de fãs no módulo administrativo.

### RF-FAN-006 — Segmentação por Localização

O sistema deve permitir filtragem de fãs por:

- estado;
- cidade.

## Regras de Negócio

| ID | Regra |
|----|-------|
| RN-FAN-001 | Os fãs serão cadastrados inicialmente exclusivamente através do formulário do Hub. |
| RN-FAN-002 | O CPF será utilizado como identificador principal para prevenção de duplicidade, com validação de dígitos verificadores. |
| RN-FAN-003 | O cadastro exige consentimento explícito para armazenamento de dados (`consentimento_armazenamento = true`). Consentimentos de comunicações e marketing são opt-in independentes e opcionais. |
| RN-FAN-004 | Os dados armazenados terão finalidade administrativa, analítica e para campanhas futuras. |
| RN-FAN-005 | O sistema não realizará automações de CRM no MVP. |
| RN-FAN-006 | O sistema não enviará comunicações automáticas no MVP. |
| RN-FAN-007 | O sistema não realizará rastreamento de origem de cadastro no MVP. |
| RN-FAN-008 | Não haverá controle de status de fãs no MVP. |
| RN-FAN-009 | CPF já cadastrado: exibir mensagem informativa; não criar novo registro nem atualizar o existente silenciosamente. |

**Finalidades dos dados (RN-FAN-004)**

- administrativa;
- analítica;
- campanhas futuras.

## Estrutura Conceitual das Entidades

### Fã

Representa um usuário interessado no Hub Karmaleões.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Identificador | ID único do fã |
| Nome | Nome do fã |
| CPF | Identificador principal (obrigatório, com validação de dígitos) |
| Telefone | Contato telefônico |
| E-mail | Contato por e-mail |
| Data de nascimento | Data de nascimento |
| Estado | Estado ou unidade federativa |
| Cidade | Cidade do fã |
| Consentimento armazenamento | Booleano (obrigatório `true` para cadastrar) |
| Consentimento comunicações | Booleano (opt-in opcional) |
| Consentimento marketing | Booleano (opt-in opcional) |
| Data de cadastro | Momento do registro |
