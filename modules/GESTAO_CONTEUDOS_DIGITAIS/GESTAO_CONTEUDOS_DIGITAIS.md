# Gestão de Conteúdos Digitais

**Módulo:** Gestão de Conteúdos Digitais

## Objetivo

Permitir gerenciamento administrativo de conteúdos digitais externos exibidos no Hub Karmaleões através de curadoria manual realizada pelos administradores.

## Fluxo Operacional Macro

### Fluxo principal

1. Administrador cadastra conteúdo digital.
2. Conteúdo é categorizado.
3. Conteúdo recebe status operacional.
4. Conteúdo é publicado no Hub.
5. Usuário acessa conteúdo.
6. Usuário é redirecionado para plataforma externa em nova aba.

## Requisitos Funcionais

### RF-CONT-001 — Cadastro de Conteúdo Digital

O sistema deve permitir cadastro manual de conteúdos digitais.

**Tipos de conteúdo suportados**

- vídeos;
- playlists;
- notícias;
- entrevistas;
- podcasts.

### RF-CONT-002 — Estrutura do Conteúdo

Cada conteúdo deverá possuir:

- título;
- descrição;
- thumbnail;
- categoria;
- link externo;
- plataforma;
- data;
- status.

### RF-CONT-003 — Edição de Conteúdo

O sistema deve permitir edição de conteúdos cadastrados.

### RF-CONT-004 — Listagem de Conteúdos

O sistema deve permitir listar conteúdos digitais cadastrados.

### RF-CONT-005 — Controle de Status

O sistema deve permitir gerenciamento de status dos conteúdos.

**Status possíveis**

- draft;
- publicado;
- pendente;
- desabilitado.

**Observação**

O campo `Tipo` representa o formato fixo do conteúdo (enum: vídeo, playlist, notícia, entrevista, podcast). O campo `Categoria` representa agrupamentos temáticos gerenciáveis pelo admin (ex: "Bastidores", "Lançamentos", "Exclusivos").

### RF-CONT-006 — Destaque de Conteúdo

O sistema deve permitir definir conteúdos em destaque.

**Objetivo**

Permitir priorização visual de conteúdos estratégicos.

### RF-CONT-007 — Navegação Externa

O sistema deve permitir redirecionamento para plataformas externas de conteúdo.

**Regra**

Todos os links externos devem abrir em nova aba.

### RF-CONT-008 — Organização por Categorias

O sistema deve permitir categorização dos conteúdos digitais.

### RF-CONT-009 — Ordenação Manual

O sistema deve permitir ordenação manual dos conteúdos exibidos no Hub.

## Regras de Negócio

| ID | Regra |
|----|-------|
| RN-CONT-001 | Todos os conteúdos serão cadastrados manualmente pelos administradores. |
| RN-CONT-002 | O Hub não realizará hospedagem de mídia. |
| RN-CONT-003 | Os conteúdos deverão apenas referenciar plataformas externas. |
| RN-CONT-004 | Conteúdos desabilitados não deverão ser exibidos no Hub. |
| RN-CONT-005 | Conteúdos em draft não deverão ser exibidos no Hub. |
| RN-CONT-006 | Conteúdos em status "pendente" não serão exibidos no Hub até que o administrador altere o status para "publicado". |
| RN-CONT-007 | A navegação de conteúdos externos deverá abrir em nova aba. |
| RN-CONT-008 | Os conteúdos digitais serão independentes do módulo de Obras & Colaborações. |

## Estrutura Conceitual das Entidades

### Conteúdo Digital

Representa um conteúdo externo divulgado no Hub.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Identificador | ID único do conteúdo |
| Título | Nome do conteúdo |
| Descrição | Detalhamento do conteúdo |
| Thumbnail | Imagem de capa ou preview |
| Categoria | Agrupamento classificatório |
| Tipo | vídeo / playlist / notícia / entrevista / podcast |
| Plataforma | Origem externa do conteúdo |
| Link externo | URL da plataforma |
| Status | draft / publicado / pendente / desabilitado |
| Destaque | Indica priorização visual |
| Ordem de exibição | Posição na listagem do Hub |
| Data do conteúdo | Data de referência do conteúdo |
| Data de criação | Registro de criação |
| Data de atualização | Última modificação |

### Categoria de Conteúdo

Representa agrupamentos classificatórios dos conteúdos digitais.

**Observação**

A Categoria representa agrupamentos temáticos, distintos do campo Tipo (formato do conteúdo). São gerenciáveis pelo admin.

**Exemplos**

- Bastidores;
- Lançamentos;
- Exclusivos;
- Ao vivo;
- Destaques da semana.
