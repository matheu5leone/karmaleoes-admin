# Fluxograma — Gestão de Conteúdos Digitais

## Fluxo Principal (Cadastro à Publicação)

```mermaid
flowchart TD
    A[Admin acessa módulo de Conteúdos Digitais] --> B[Cadastra novo conteúdo]
    B --> C[Informa: título, descrição, thumbnail, link externo, plataforma, data]
    C --> D[Seleciona tipo: vídeo / playlist / notícia / entrevista / podcast]
    D --> E[Seleciona ou cria categoria temática]
    E --> F["Conteúdo criado com status inicial (draft)"]
    F --> G{Admin publica?}
    G -- Sim --> H["Status → publicado"]
    H --> I[Conteúdo visível no Hub]
    G -- Não --> J[Conteúdo permanece em draft — não visível]
```

## Fluxo de Controle de Status

```mermaid
flowchart TD
    A[Conteúdo existente] --> B{Ação do Admin?}
    B -- Publicar --> C["Status → publicado"]
    C --> D[Visível no Hub]
    B -- Manter pendente --> E["Status → pendente"]
    E --> F[Não visível — aguarda ação]
    B -- Desabilitar --> G["Status → desabilitado"]
    G --> H[Não visível no Hub]
    B -- Voltar para draft --> I["Status → draft"]
    I --> J[Não visível no Hub]
```

## Fluxo de Destaque e Ordenação

```mermaid
flowchart TD
    A[Admin gerencia exibição] --> B{Ação?}
    B -- Definir destaque --> C[Marca conteúdo como destaque]
    C --> D[Conteúdo priorizado visualmente no Hub]
    B -- Ordenar manualmente --> E[Define posição na listagem]
    E --> F[Hub exibe conforme ordem definida]
```

## Fluxo do Usuário no Hub

```mermaid
flowchart TD
    A[Usuário navega pelo Hub] --> B[Visualiza conteúdos publicados]
    B --> C[Seleciona conteúdo]
    C --> D[Clica no link externo]
    D --> E[Redirecionado para plataforma externa — nova aba]
```

## Gestão de Categorias

```mermaid
flowchart TD
    A[Admin gerencia categorias] --> B{Ação?}
    B -- Criar --> C[Nova categoria temática criada]
    B -- Editar --> D[Categoria atualizada]
    B -- Associar --> E[Vincula categoria ao conteúdo]
```

## Visibilidade no Hub

```mermaid
flowchart TD
    A{Status do conteúdo?} --> B[draft]
    A --> C[publicado]
    A --> D[pendente]
    A --> E[desabilitado]
    B --> F[NÃO exibido]
    C --> G[EXIBIDO no Hub]
    D --> F
    E --> F
```
