# Visão Geral

Especificação funcional de desenvolvimento da plataforma administrativa centralizada para gerenciamento do ecossistema Karmaleões.

## Jornadas

1. [Autenticação, Login e Controle de Sessão](./modules/AUTENTICACAO_LOGIN_CONTROLE_SESSAO/AUTENTICACAO_LOGIN_CONTROLE_SESSAO.md)
2. [Gestão de Telas, Navegação Interna e Marquees](./modules/GESTAO_TELAS_NAVEGACAO_E_MARQUEES/GESTAO_TELAS_NAVEGACAO_E_MARQUEES.md)
3. [Gestão de Banners por tela](./modules/GESTAO_BANNERS_POR_TELA/GESTAO_BANNERS_POR_TELA.md)
4. [Gestão de Eventos](./modules/GESTAO_EVENTOS/GESTAO_EVENTOS.md)
5. [Gestão de Conteúdos Digitais](./modules/GESTAO_CONTEUDOS_DIGITAIS/GESTAO_CONTEUDOS_DIGITAIS.md)
6. [Gestão de Obras e Colaborações](./modules/GESTAO_OBRAS_E_COLABORACOES/GESTAO_OBRAS_E_COLABORACOES.md)
7. [Gestão de Propostas Comerciais](./modules/GESTAO_PROPOSTAS_COMERCIAIS/GESTAO_PROPOSTAS_COMERCIAIS.md)
8. [Gestão de Fãs (CRM Inicial)](./modules/GESTAO_FAS_CRM_INICIAL/GESTAO_FAS_CRM_INICIAL.md)

## Fronteira Admin ↔ Hub

| Superfície | Responsabilidade |
|------------|------------------|
| **Plataforma administrativa** | Autenticação, CRUD de conteúdos, configuração de telas/navegação/banners, visualização de propostas e fãs |
| **Hub Karmaleões (público)** | Exibição de conteúdos configurados, links externos, formulário de cadastro de fãs, formulário de propostas comerciais |

**Origem dos dados**

| Dado | Origem | Admin |
|------|--------|-------|
| Eventos, conteúdos, obras, telas, banners | Cadastro manual no admin | CRUD completo |
| Propostas comerciais | Formulário do Hub | Somente leitura |
| Fãs | Formulário do Hub | Somente leitura e filtros |

**Formulários públicos no Hub (MVP)**

- Cadastro de fãs (consentimentos + CPF)
- Proposta comercial (consentimento de armazenamento)

## Padrões transversais

### Autenticação e acesso

- Todo acesso à plataforma administrativa exige autenticação (e-mail + senha + 2FA).
- Não há níveis de permissão no MVP: usuários autenticados têm acesso integral a todos os módulos.
- O primeiro usuário administrativo é criado via seed ou migration na implantação (RN-LOGIN-006).

### Auditoria

Conforme RF-LOGIN-006, toda operação administrativa de escrita deve gerar log de auditoria:

- **Módulo 1:** gestão de usuários
- **Módulos 2–8:** create, update e delete de entidades configuráveis

Campos do log: usuário responsável, data/hora, ação, entidade afetada, identificador do registro.

Operações de leitura (listagens, visualizações, filtros) não exigem auditoria no MVP.

### Visibilidade no Hub

Cada módulo usa o mecanismo adequado ao seu ciclo de vida. A visibilidade no Hub depende exclusivamente do mecanismo do módulo, não de regras globais cruzadas.

| Módulo | Mecanismo | Valores | Oculto no Hub quando |
|--------|-----------|---------|----------------------|
| Telas | Status da tela | habilitada / desabilitada | desabilitada |
| Banners | Status da associação Banner × Tela | draft / publicado | draft ou tela desabilitada |
| Eventos | `enable_efetivo` (campo virtual) | enable armazenado e não expirado | enable false ou expirado |
| Conteúdos digitais | Status | draft / publicado / pendente / desabilitado | draft, pendente ou desabilitado |
| Obras e coleções | — | Sem controle no MVP | Sempre visível após cadastro |

### Links externos

Todos os links externos configurados nos módulos administrativos devem abrir em **nova aba** no Hub:

- Navegação de marquees (RF-NAV-010)
- Eventos — compra de ingressos (RF-EVENTO-007)
- Conteúdos digitais (RF-CONT-007)
- Obras — plataformas de streaming (RF-OBRA-011)

### Mídia e assets

- O Hub **não hospeda** arquivos de mídia (vídeos, áudio, streaming).
- Conteúdos digitais e obras armazenam metadados + links para plataformas externas.
- Imagens administrativas (banners, thumbnails, capas) são enviadas/gestas na plataforma admin; detalhes de upload, formatos e limites serão definidos pelo time de desenvolvimento.

### Hospedagem de dados sensíveis

- CPF de fãs é identificador crítico; validação de dígitos verificadores aplicável onde especificado. Usuários administrativos são identificados por e-mail.
- Consentimentos de fãs são registrados como campos booleanos independentes.
- Propostas e fãs: dados coletados via Hub com finalidade administrativa e operacional.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Hub** | Aplicação pública Karmaleões consumida pelo fã/usuário final |
| **Admin** | Plataforma administrativa centralizada descrita nesta especificação |
| **Enable** | Campo booleano de visibilidade de eventos no Hub (independente de lifecycle e status) |
| **LifeCycle** | Estado de alto nível do evento: Em aberto ou Encerrado |
| **Status** | Estado operacional do evento, vinculado a um LifeCycle |
| **Data de referência para expiração** | Data usada para calcular a expiração de eventos via campo virtual (`data` ou `nova data` se Adiado) |
| **Habilitada / desabilitada** | Controle de visibilidade de telas no Hub |
| **draft / publicado** | Ciclo de publicação de banners (por associação) e conteúdos digitais |
| **pendente** | Status editorial de conteúdo aguardando revisão antes de publicar |
| **Marquee** | Componente navegável reutilizável associado a telas |
| **Asset** | Recurso reutilizável sem estado de publicação próprio (ex.: banner antes da associação) |

## Semântica de status — Conteúdos digitais

| Status | Uso recomendado |
|--------|-----------------|
| **draft** | Rascunho interno, conteúdo incompleto |
| **pendente** | Conteúdo em revisão editorial antes de publicar |
| **publicado** | Visível no Hub |
| **desabilitado** | Conteúdo retirado temporariamente da exibição |

## Convenções remanescentes (MVP)

| Tópico | Decisão |
|--------|---------|
| Tipos de proposta comercial | Enum fixo definido no formulário do Hub; admin apenas visualiza |
| Categorias de conteúdo digital | Gerenciáveis pelo admin; CRUD dedicado será detalhado na implementação |
| Expiração de eventos (campo virtual) e timeout de sessão por inatividade | Dia calendário / data corrente e timeout definidos pelo time de desenvolvimento |
| Formato de telefone e e-mail | Validação de formato a cargo do time de desenvolvimento |

## Mapa de dependências entre módulos

```
Autenticação (1)
    └── protege acesso aos módulos 2–8

Telas (2)
    ├── Banners (3) associam-se a telas
    └── Marquees (2) associam-se a telas

Conteúdos (5) ⊥ Obras (6)   ← independentes (RN-CONT-008)

Hub (público)
    ├── recebe propostas → Propostas (7)
    └── recebe fãs → Fãs (8)
```
