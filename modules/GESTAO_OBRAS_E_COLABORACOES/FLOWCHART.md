# Fluxograma — Gestão de Obras e Colaborações

## Fluxo Principal (Visão Geral)

```mermaid
flowchart TD
    A[Admin acessa módulo de Obras e Colaborações] --> B{Ação?}
    B -- Gerenciar Músicas --> C[CRUD de Músicas]
    B -- Gerenciar Coleções --> D[CRUD de Coleções]
    B -- Gerenciar Colaboradores --> E[CRUD de Colaboradores]
    B -- Gerenciar Roles --> F[CRUD de Roles]
    B -- Gerenciar Links --> G[Associar links de plataformas]
    C --> H[Relacionar músicas a coleções e colaboradores]
    D --> H
    E --> H
    F --> H
    G --> H
    H --> I[Obras visíveis no Hub ordenadas por data de lançamento]
    I --> J[Usuário clica em link externo — nova aba]
```

## Fluxo de Cadastro de Música

```mermaid
flowchart TD
    A[Admin cadastra música] --> B[Informa: nome, data de lançamento, duração, ISRC, cover image]
    B --> C[Música criada]
    C --> D{Vincular a coleção?}
    D -- Sim --> E[Seleciona coleção existente]
    E --> F["Música vinculada (N:1 — máx. 1 coleção)"]
    D -- Não --> G[Música existe independentemente]
```

## Fluxo de Cadastro de Coleção

```mermaid
flowchart TD
    A[Admin cadastra coleção] --> B[Informa: nome, descrição, data de lançamento, cover image]
    B --> C{Tipo?}
    C -- Álbum --> D[Coleção tipo Álbum criada]
    C -- EP --> E[Coleção tipo EP criada]
    D --> F[Pode conter múltiplas músicas]
    E --> F
```

## Fluxo de Colaboradores e Roles

```mermaid
flowchart TD
    A[Admin cadastra colaborador] --> B[Informa: nome, instagram, linkedin, descrição]
    B --> C[Colaborador criado]

    D[Admin cadastra role] --> E[Informa nome do tipo de participação]
    E --> F[Role criado — ex: feat, produtor, compositor]

    C --> G[Vincular colaborador a obra]
    F --> G
    G --> H[Seleciona: obra + colaborador + role]
    H --> I[Relação Obra × Colaborador criada]
```

## Fluxo de Links de Plataformas

```mermaid
flowchart TD
    A[Admin associa link externo] --> B{Tipo de obra?}
    B -- Música --> C[Seleciona música]
    B -- Coleção --> D[Seleciona coleção]
    C --> E[Informa plataforma + URL]
    D --> E
    E --> F{Plataforma?}
    F --> G[Spotify]
    F --> H[Deezer]
    F --> I[Apple Music]
    F --> J[Amazon Music]
    F --> K[YouTube]
    G --> L[Link salvo com discriminador]
    H --> L
    I --> L
    J --> L
    K --> L
```

## Relacionamento Música × Coleção

```mermaid
flowchart TD
    A[Música] --> B{Pertence a coleção?}
    B -- Sim --> C["Vinculada a 1 coleção (N:1)"]
    B -- Não --> D[Existe independentemente]

    E[Coleção] --> F[Pode conter N músicas]
```
