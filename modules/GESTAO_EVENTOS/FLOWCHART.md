# Fluxograma — Gestão de Eventos

## Fluxo Principal (Lifecycle Completo)

```mermaid
flowchart TD
    A[Admin cadastra evento] --> B["Evento criado\n(Lifecycle: Em aberto | Enable: false)"]
    B --> C[Admin habilita Enable = true]
    C --> D[Evento visível no Hub]
    D --> E[Usuário visualiza evento]
    E --> F[Usuário clica no link externo]
    F --> G[Redirecionado para plataforma de compra — nova aba]

    D --> H{"Leitura: passou da data de referência?"}
    H -- Não --> D
    H -- "Sim (dia seguinte+)" --> I["Campo virtual: expirado = true\nenable_efetivo = false → oculto no Hub"]
    I --> J{Lifecycle armazenado?}
    J -- Em aberto --> K["status_efetivo = Expirado\n(dados armazenados inalterados)"]
    J -- Encerrado --> L["status_efetivo = status armazenado\n(dados armazenados inalterados)"]
```

## Fluxo de Encerramento Manual

```mermaid
flowchart TD
    A[Admin deseja encerrar evento] --> B{Lifecycle atual?}
    B -- Já Encerrado --> C[Operação não permitida]
    B -- Em aberto --> D{Status de encerramento?}
    D -- Sucesso --> E{Data de referência atingida?}
    E -- Não --> F[Encerramento como Sucesso rejeitado]
    E -- Sim --> G["Lifecycle → Encerrado\nStatus → Sucesso\nEnable inalterado"]
    D -- Cancelado --> H["Lifecycle → Encerrado\nStatus → Cancelado\nEnable inalterado"]
    G --> I[Admin preenche observação de encerramento]
    H --> I
    I --> J[Evento encerrado]
    J --> K{"Leitura: passou da data de referência?"}
    K -- Sim --> L["enable_efetivo = false\n(campo virtual; armazenado inalterado)"]
```

## Fluxo de Alteração de Status (Lifecycle Em Aberto)

```mermaid
flowchart TD
    A[Admin altera status do evento] --> B{Novo status?}
    B -- Ingressos a venda --> C[Status atualizado]
    B -- Esgotado --> C
    B -- Adiado --> D[Campo 'nova data' obrigatório]
    D --> E{Nova data preenchida?}
    E -- Não --> F[Operação bloqueada]
    E -- Sim --> G["Status → Adiado\nData de referência = nova data"]
```

## Fluxo de Gestão de Status (CRUD)

```mermaid
flowchart TD
    A[Admin gerencia status] --> B{Ação?}
    B -- Cadastrar --> C[Informa nome + Lifecycle vinculado]
    C --> D[Status criado]
    B -- Editar --> E{Status protegido?}
    E -- Sim --> F["Edição bloqueada\n(Adiado)"]
    E -- Não --> G[Status editado]
    B -- Excluir --> H{Status protegido?}
    H -- Sim --> F
    H -- Não --> I{Vinculado a eventos existentes?}
    I -- Sim --> J[Exclusão bloqueada]
    I -- Não --> K[Status excluído]
```

## Controle de Visibilidade (Enable)

```mermaid
flowchart TD
    A[Evento cadastrado] --> B["Enable = false\n(default)"]
    B --> C{Admin altera Enable?}
    C -- true --> D[Evento visível no Hub se não expirado]
    C -- false --> E[Evento oculto no Hub]
    D --> F{"Leitura: expirado (campo virtual)?"}
    F -- Sim --> G["enable_efetivo = false → oculto\n(enable armazenado inalterado)"]
    G --> E
```
