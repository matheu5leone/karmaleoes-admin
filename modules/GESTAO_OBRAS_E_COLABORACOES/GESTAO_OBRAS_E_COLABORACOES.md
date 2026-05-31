# Gestão de Obras e Colaborações

**Módulo:** Gestão de Obras e Colaborações

## Objetivo

Permitir gerenciamento administrativo de músicas, coleções musicais e colaboradores relacionados às obras divulgadas no Hub Karmaleões.

## Fluxo Operacional Macro

### Fluxo principal

1. Administrador cadastra músicas.
2. Administrador cadastra coleções musicais.
3. Administrador cadastra colaboradores.
4. Administrador cadastra tipos de participação (roles).
5. Sistema permite relacionamentos entre músicas, coleções e colaboradores.
6. Usuário visualiza obras no Hub.
7. Usuário é redirecionado para plataformas externas.

## Requisitos Funcionais

### Gestão de Músicas

#### RF-OBRA-001 — Cadastro de Música

O sistema deve permitir cadastro de músicas.

**Estrutura da música**

- nome;
- data de lançamento;
- duração;
- ISRC;
- cover image.

#### RF-OBRA-002 — Edição de Música

O sistema deve permitir edição de músicas cadastradas.

#### RF-OBRA-003 — Listagem de Músicas

O sistema deve permitir listagem das músicas cadastradas.

### Gestão de Coleções

#### RF-OBRA-004 — Cadastro de Coleção Musical

O sistema deve permitir cadastro de coleções musicais.

**Tipos suportados**

- álbum;
- EP.

**Estrutura da coleção**

- nome;
- data de lançamento;
- cover image;
- descrição;
- tipo.

#### RF-OBRA-005 — Relacionamento entre Coleções e Músicas

O sistema deve permitir vincular uma música a uma coleção musical.

**Observação**

O relacionamento é N:1 (uma música pode pertencer a no máximo uma coleção) e deverá ser gerenciado administrativamente.

#### RF-OBRA-006 — Edição de Coleções

O sistema deve permitir edição de coleções cadastradas.

### Gestão de Colaboradores

#### RF-OBRA-007 — Cadastro de Colaborador

O sistema deve permitir cadastro de colaboradores relacionados às obras.

**Estrutura do colaborador**

- nome;
- instagram;
- linkedin;
- descrição.

#### RF-OBRA-008 — Cadastro de Roles

O sistema deve permitir cadastro manual de tipos de participação (roles).

**Objetivo**

Permitir flexibilidade para múltiplos tipos de colaboração.

**Exemplos**

- feat;
- produtor;
- compositor;
- diretor;
- mixing engineer;
- fotógrafo.

#### RF-OBRA-009 — Relacionamento entre Obras e Colaboradores

O sistema deve permitir vincular colaboradores às músicas e coleções.

O relacionamento deverá permitir:

- colaborador;
- role;
- obra relacionada.

### Plataformas Externas

#### RF-OBRA-010 — Cadastro de Links de Plataforma

O sistema deve permitir associar links externos tanto a músicas quanto a coleções de forma independente.

**Observação**

A entidade de link deve possuir um campo discriminador (`musica_id` ou `colecao_id`) para identificar a qual tipo de obra o link pertence.

**Plataformas suportadas inicialmente**

- Spotify;
- Deezer;
- Apple Music;
- Amazon Music;
- YouTube.

#### RF-OBRA-011 — Navegação Externa

O sistema deve permitir redirecionamento para plataformas externas.

**Regra**

Os links devem abrir em nova aba.

### Organização e Exibição

#### RF-OBRA-012 — Ordenação por Lançamento

O sistema deve ordenar obras da mais recente para a mais antiga utilizando a data de lançamento.

## Regras de Negócio

| ID | Regra |
|----|-------|
| RN-OBRA-001 | O Hub não armazenará arquivos de mídia. |
| RN-OBRA-002 | As obras deverão apenas armazenar metadados e links externos. |
| RN-OBRA-003 | Uma música poderá pertencer a no máximo uma coleção. Toda coleção poderá conter múltiplas músicas. |
| RN-OBRA-004 | Uma música poderá existir independentemente de uma coleção. |
| RN-OBRA-005 | Os tipos de colaboração deverão ser gerenciados dinamicamente através da entidade Role. |
| RN-OBRA-006 | Uma obra poderá possuir múltiplos colaboradores. |
| RN-OBRA-007 | Um colaborador poderá participar de múltiplas obras. |
| RN-OBRA-008 | Os redirecionamentos externos deverão abrir em nova aba. |
| RN-OBRA-009 | Não haverá controle de status para obras e coleções no MVP. |

## Estrutura Conceitual das Entidades

### Música

Representa uma obra musical individual.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Identificador | ID único da música |
| Nome | Título da obra |
| Data de lançamento | Data de publicação |
| Duração | Tempo da faixa |
| ISRC | Código internacional de gravação |
| Cover image | Imagem de capa |

### Coleção Musical

Representa agrupamentos musicais.

**Tipos**

- álbum;
- EP.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Identificador | ID único da coleção |
| Nome | Título da coleção |
| Descrição | Detalhamento da coleção |
| Tipo | álbum / EP |
| Cover image | Imagem de capa |
| Data de lançamento | Data de publicação |

### Colaborador

Representa participantes relacionados às obras.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Identificador | ID único do colaborador |
| Nome | Nome do colaborador |
| Instagram | Perfil no Instagram |
| LinkedIn | Perfil no LinkedIn |
| Descrição | Detalhamento ou biografia |

### Role

Representa tipos de participação artística ou técnica.

**Exemplos**

- feat;
- produtor;
- compositor;
- diretor.

### Relação Música x Coleção

Tabela relacional entre músicas e coleções.

**Características**

- vínculo N:1 (uma música pertence a no máximo uma coleção);
- uma música pode existir sem coleção;
- uma coleção pode conter múltiplas músicas.

### Relação Obra x Colaborador

Tabela relacional entre obra, colaborador e role.

**Campos do relacionamento**

| Campo | Descrição |
|-------|-----------|
| Obra | Música ou coleção vinculada |
| Colaborador | Participante da obra |
| Role | Tipo de participação |
