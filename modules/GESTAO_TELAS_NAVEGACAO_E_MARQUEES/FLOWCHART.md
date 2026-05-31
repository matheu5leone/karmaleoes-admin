# Fluxograma — Gestão de Telas, Navegação Interna e Marquees

## Fluxo Principal (Visão Geral)

```mermaid
flowchart TD
    A[Admin acessa módulo de Telas e Navegação] --> B{Ação?}
    B -- Gerenciar Telas --> C[Cadastro/edição/habilitação de telas]
    B -- Gerenciar Marquees --> D[CRUD de marquees]
    B -- Configurar Navegação --> E[Definir navegação dos itens]
    C --> F[Telas disponíveis para associação com marquees e banners]
    D --> F
    E --> F
    F --> G[Hub exibe telas habilitadas com marquees configurados]
```

## Fluxo de Gestão de Telas

```mermaid
flowchart TD
    A[Admin gerencia telas] --> B{Ação?}
    B -- Cadastrar --> C[Informa rota/slug da tela existente no código-fonte]
    C --> D[Tela cadastrada como referência administrativa]
    B -- Editar --> E[Altera propriedades administrativas]
    B -- Habilitar --> F["Status → habilitada"]
    F --> G[Tela visível no Hub]
    B -- Desabilitar --> H["Status → desabilitada"]
    H --> I[Tela oculta no Hub]
    I --> J[Navegação interna para esta tela bloqueada]
    B -- Listar --> K[Exibe telas com status habilitada/desabilitada]
```

## Fluxo de Gestão de Marquees

```mermaid
flowchart TD
    A[Admin gerencia marquees] --> B{Ação?}
    B -- Cadastrar marquee --> C[Informa nome + propriedades visuais]
    C --> D[Marquee criado como entidade independente]
    B -- Associar a telas --> E[Seleciona marquee e tela]
    E --> F["Associação N:N — marquee reutilizável em múltiplas telas"]
    B -- Configurar layout --> G[Define cores, ícones, estilo visual]
    B -- Gerenciar itens --> H[Cadastra/edita/remove/ordena itens do marquee]
    H --> I[Sem limite de itens por marquee]
```

## Fluxo de Configuração de Itens do Marquee

```mermaid
flowchart TD
    A[Admin configura item de marquee] --> B[Informa título + imagem/ícone]
    B --> C{Tipo de navegação?}
    C -- Interna --> D[Seleciona tela de destino]
    D --> E{Tela de destino habilitada?}
    E -- Sim --> F[Navegação interna configurada]
    E -- Não --> G[Configuração bloqueada — tela desabilitada]
    C -- Externa --> H[Informa URL de destino]
    H --> I[Navegação externa configurada — abre em nova aba]
    F --> J[Define posição/ordenação do item]
    I --> J
```

## Fluxo do Usuário no Hub

```mermaid
flowchart TD
    A[Usuário navega pelo Hub] --> B[Visualiza tela habilitada]
    B --> C[Marquees exibidos na tela]
    C --> D[Usuário clica em item do marquee]
    D --> E{Tipo de navegação?}
    E -- Interna --> F[Navega para outra tela do Hub]
    E -- Externa --> G[Redirecionado para URL externa — nova aba]
```

## Regras de Visibilidade

```mermaid
flowchart TD
    A{Tela habilitada?} --> B[Sim]
    A --> C[Não]
    B --> D[Tela exibida no Hub]
    B --> E[Pode receber navegação interna]
    C --> F[Tela oculta]
    C --> G[Navegação interna para ela bloqueada]
    C --> H[Banners da tela não exibidos]
```
