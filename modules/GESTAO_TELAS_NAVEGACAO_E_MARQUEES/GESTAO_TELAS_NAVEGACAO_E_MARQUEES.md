# Gestão de Telas, Navegação Interna e Marquees

**Módulo:** Navegação e Estrutura de Telas

## Objetivo

Permitir gerenciamento administrativo da disponibilidade das telas existentes no Hub Karmaleões, bem como a configuração de marquees e comportamentos de navegação associados.

## Fluxo Operacional Macro

### Fluxo principal

1. Cadastrar manualmente as telas existentes no código-fonte do Hub.
2. Habilitar/desabilitar visualização das telas.
3. Configurar marquees vinculados às telas.
4. Configurar itens exibidos nos marquees.
5. Definir comportamento de navegação ao clique.

## Requisitos Funcionais

### Gestão de Telas

#### RF-NAV-001 — Cadastro de Telas

O sistema deve permitir cadastrar manualmente referências administrativas das telas existentes no código-fonte do Hub Karmaleões. O administrador informa a rota/slug da tela para criar o registro.

**Observação**

As telas não são criadas dinamicamente pelo sistema administrativo. A responsabilidade de manter o cadastro atualizado quando novas telas forem adicionadas ao Hub é operacional (processo manual). O cadastro existe apenas para permitir:

- controle de habilitação;
- gerenciamento de navegação;
- gerenciamento de marquees.

#### RF-NAV-002 — Edição de Telas

O sistema deve permitir edição das propriedades administrativas das telas cadastradas.

#### RF-NAV-003 — Habilitação de Telas

O sistema deve permitir habilitar ou desabilitar a visualização das telas no Hub.

**Regra**

Telas desabilitadas não devem ser exibidas para usuários finais.

#### RF-NAV-004 — Listagem de Telas

O sistema deve permitir listar telas cadastradas com seus respectivos status.

**Status possíveis**

- habilitada
- desabilitada

### Gestão de Marquees

#### RF-NAV-005 — Cadastro de Marquees

O sistema deve permitir cadastrar marquees como entidades independentes e associá-los a telas do Hub.

**Observação**

O marquee possui CRUD próprio. A associação entre marquees e telas é um relacionamento N:N gerenciado separadamente.

#### RF-NAV-006 — Reutilização de Marquees

O sistema deve permitir reutilizar um mesmo marquee em múltiplas telas.

#### RF-NAV-007 — Gerenciamento de Layout do Marquee

O sistema deve permitir configurar propriedades visuais do marquee.

**Exemplos**

- cores;
- ícones;
- estilo visual.

#### RF-NAV-008 — Gerenciamento de Conteúdo do Marquee

O sistema deve permitir cadastrar, editar, remover e organizar itens exibidos em cada marquee.

**Observação**

Não haverá limite de itens por marquee.

### Navegação dos Itens

#### RF-NAV-009 — Navegação Interna

O sistema deve permitir configurar navegação interna entre telas do Hub.

**Observação**

A implementação técnica da navegação interna será definida pelo time de desenvolvimento.

#### RF-NAV-010 — Navegação Externa

O sistema deve permitir configurar redirecionamento externo via URL.

**Regra**

Links externos devem abrir em nova aba.

#### RF-NAV-011 — Validação de Navegação

O sistema deve impedir navegação interna para telas desabilitadas.

## Regras de Negócio

| ID | Regra |
|----|-------|
| RN-NAV-001 | As telas cadastradas devem representar exclusivamente telas existentes no código-fonte do Hub. |
| RN-NAV-002 | Telas não poderão ser criadas dinamicamente pelo módulo administrativo. |
| RN-NAV-003 | Telas desabilitadas não devem aparecer na navegação do Hub. |
| RN-NAV-004 | Itens de navegação interna somente poderão apontar para telas habilitadas. |
| RN-NAV-005 | Um item de marquee poderá possuir apenas um destino de navegação por vez. |
| RN-NAV-006 | Um marquee poderá ser reutilizado em múltiplas telas. |
| RN-NAV-007 | Não haverá limite de itens cadastrados em um marquee. |

**Tipos de navegação permitidos (RN-NAV-005)**

- interno
- externo

## Estrutura Conceitual das Entidades

### Tela

Representa uma tela existente no Hub.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Identificador interno | ID único no sistema administrativo |
| Nome | Nome de exibição ou referência |
| Status | habilitada / desabilitada |
| Referência de rota/tela | Vínculo com a tela no código-fonte do Hub |

### Marquee

Representa uma estrutura navegável reutilizável.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Identificador | ID único do marquee |
| Nome | Nome de referência administrativa |
| Propriedades visuais | Cores, ícones, estilo visual |
| Lista de itens | Itens exibidos no marquee |

### Item de Marquee

Representa um item navegável exibido em um marquee.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Título | Texto exibido no item |
| Imagem/ícone | Recurso visual do item |
| Tipo de navegação | interno ou externo |
| Destino interno ou externo | Tela do Hub ou URL |
| Ordenação | Posição na lista de exibição |
