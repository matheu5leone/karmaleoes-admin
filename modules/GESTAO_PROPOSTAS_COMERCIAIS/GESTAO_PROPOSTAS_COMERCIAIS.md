# Gestão de Propostas Comerciais

**Módulo:** Gestão de Propostas Comerciais

## Objetivo

Permitir visualização administrativa de propostas comerciais recebidas exclusivamente pelo formulário do Hub Karmaleões. O acompanhamento de negociações e a elaboração de contratos serão realizados em ferramentas externas.

## Fluxo Operacional Macro

### Fluxo principal

1. Interessado preenche formulário comercial no Hub.
2. Sistema armazena proposta automaticamente.
3. Administradores visualizam propostas no módulo administrativo.
4. Administradores analisam informações.
5. Administradores utilizam ferramentas externas para negociação e contratos.

## Requisitos Funcionais

### RF-PROP-001 — Recebimento Automático de Propostas

O sistema deve receber e armazenar automaticamente propostas comerciais enviadas através do formulário do Hub.

### RF-PROP-002 — Estrutura da Proposta

Cada proposta deverá possuir:

- nome do solicitante;
- estado;
- cidade;
- empresa;
- CNPJ (opcional);
- e-mail;
- telefone;
- mensagem;
- tipo da proposta;
- data/hora da proposta.

### RF-PROP-003 — Listagem de Propostas

O sistema deve permitir listagem das propostas comerciais recebidas.

### RF-PROP-004 — Visualização de Proposta

O sistema deve permitir visualização dos detalhes de uma proposta recebida.

### RF-PROP-005 — Consentimento de Dados

O formulário do Hub deve solicitar consentimento para armazenamento dos dados enviados.

## Regras de Negócio

| ID | Regra |
|----|-------|
| RN-PROP-001 | As propostas comerciais serão originadas exclusivamente pelo formulário do Hub. |
| RN-PROP-002 | O sistema não permitirá cadastro manual de propostas. |
| RN-PROP-003 | O sistema não realizará gestão de negociações, status ou pipeline comercial. |
| RN-PROP-004 | A negociação e a elaboração de contratos ocorrerão em ferramentas externas. |
| RN-PROP-005 | O sistema não realizará envio automático de e-mails ou notificações. |
| RN-PROP-006 | O sistema não realizará gestão documental ou contratual. |
| RN-PROP-007 | Os dados coletados terão finalidade exclusivamente administrativa e operacional. |
| RN-PROP-008 | O consentimento deverá ser solicitado antes do envio do formulário comercial. |
| RN-PROP-009 | As propostas recebidas são somente leitura no módulo administrativo. |
| RN-PROP-010 | Tipos de proposta comercial são enum fixo definido no formulário do Hub; o admin apenas visualiza, sem CRUD de tipos no MVP. |

## Estrutura Conceitual das Entidades

### Proposta Comercial

Representa um interesse comercial enviado ao Hub.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Identificador | ID único da proposta |
| Nome do solicitante | Nome de quem enviou a proposta |
| Estado | Estado ou unidade federativa |
| Cidade | Cidade do solicitante |
| Empresa | Razão social ou nome empresarial |
| CNPJ | Cadastro nacional da empresa (opcional) |
| E-mail | Contato por e-mail |
| Telefone | Contato telefônico |
| Mensagem | Texto da proposta |
| Tipo de proposta | Categoria comercial |
| Data/hora da proposta | Momento do envio |
| Data de criação | Registro no sistema |

### Tipo de Proposta

Representa categorias comerciais das propostas.

**Exemplos**

- contratação de show;
- parceria;
- publicidade;
- patrocínio;
- collab;
- projeto.
