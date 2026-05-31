# Gestão de Banners por tela

**Módulo:** Gestão de Banners

## Objetivo

Permitir gerenciamento administrativo dos banners exibidos nas telas do Hub Karmaleões.

## Fluxo Operacional Macro

### Fluxo principal

1. Cadastrar banner (nome e imagem).
2. Associar banner a uma ou mais telas (vínculo inicia em status `draft`).
3. Publicar banner por tela (alterar status da associação).
4. Controlar banner ativo por tela (substituição automática na mesma tela).

## Requisitos Funcionais

### RF-BANNER-001 — Cadastro de Banner

O sistema deve permitir cadastro de banners administrativos.

**Estrutura do banner**

- nome (label interno, não exibido no Hub);
- imagem.

**Observação**

O banner é um asset reutilizável. O controle de publicação ocorre na associação Banner × Tela, não na entidade Banner.

### RF-BANNER-002 — Associação de Banner às Telas

O sistema deve permitir associar um banner a uma ou mais telas habilitadas do Hub.

**Comportamento ao associar**

- cada vínculo Banner × Tela é criado com status `draft`;
- apenas telas habilitadas podem receber novas associações.

### RF-BANNER-003 — Edição de Banner

O sistema deve permitir editar banners cadastrados (nome e imagem).

**Observação**

Alterações no banner refletem em todas as telas onde o asset estiver associado, independentemente do status de cada vínculo.

### RF-BANNER-004 — Publicação de Banner

O sistema deve permitir alterar o status de publicação **da associação Banner × Tela**.

**Status possíveis (por associação)**

- draft
- publicado

**Observação**

A publicação é independente por tela. Um mesmo banner pode estar `publicado` em uma tela e `draft` em outra.

### RF-BANNER-005 — Controle de Banner Ativo

O sistema deve garantir que apenas uma associação com status `publicado` esteja ativa por tela simultaneamente.

**Regra**

Ao publicar uma associação em uma tela que já possui banner ativo, a associação anterior **da mesma tela** será automaticamente revertida para status `draft`. Associações do mesmo banner em outras telas não são afetadas.

### RF-BANNER-006 — Listagem de Banners

O sistema deve permitir listar banners cadastrados com:

- imagem;
- telas associadas;
- status de cada associação (por tela).

## Regras de Negócio

| ID | Regra |
|----|-------|
| RN-BANNER-001 | Um banner poderá ser associado a múltiplas telas. |
| RN-BANNER-002 | Uma tela poderá possuir apenas uma associação com status `publicado` simultaneamente. |
| RN-BANNER-003 | Associações em status `draft` não devem exibir o banner no Hub. |
| RN-BANNER-004 | A ativação e publicação dos banners será realizada manualmente, por associação/tela. |
| RN-BANNER-005 | Banners não possuirão ordenação, versionamento ou agendamento automático. |
| RN-BANNER-006 | Ao publicar uma associação em uma tela com banner ativo, a associação `publicado` anterior **da mesma tela** será revertida automaticamente para `draft`. Demais telas permanecem inalteradas. |
| RN-BANNER-007 | Banners não devem ser exibidos em telas desabilitadas, mesmo que a associação esteja com status `publicado`. |
| RN-BANNER-008 | Novas associações somente poderão ser criadas com telas habilitadas. |

**Escopo excluído (RN-BANNER-005)**

- ordenação;
- versionamento;
- agendamento automático.

## Estrutura Conceitual das Entidades

### Banner

Representa um asset visual reutilizável, independente de telas.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Identificador | ID único do banner |
| Nome | Label interno para identificação administrativa |
| Imagem | Recurso visual do banner |
| Data de criação | Registro de criação |
| Data de atualização | Última modificação |

### Associação Banner x Tela

Representa o vínculo entre banners e telas do Hub, incluindo o controle de publicação por tela.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Identificador | ID único da associação |
| Banner | Referência ao banner |
| Tela | Referência à tela |
| Status | draft / publicado (controle por tela) |
| Data de criação | Registro de criação |
| Data de atualização | Última modificação |

**Regras**

- múltiplas telas por banner;
- apenas uma associação `publicado` por tela;
- publicação independente entre telas;
- substituição automática restrita à tela afetada.
