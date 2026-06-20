# Autenticação, Login e Controle de Sessão

**Módulo:** Autenticação e Controle de Sessão

## Objetivo

Permitir autenticação segura de usuários administrativos responsáveis pela gestão das bases do sistema Hub Karmaleões.

## Requisitos Funcionais

### RF-LOGIN-001 — Autenticação de Usuário

O sistema deve permitir autenticação utilizando:

- E-mail
- Senha
- Código de autenticação em 2 fatores (2FA)

### RF-LOGIN-002 — Autenticação em 2 Fatores

O sistema deve exigir validação secundária via aplicativo autenticador após validação correta de e-mail e senha.

**Observações**

- Compatível com aplicativos autenticadores padrão TOTP.
- Exemplos:
  - Google Authenticator
  - Microsoft Authenticator
  - Authy

### RF-LOGIN-003 — Recuperação de Senha

O sistema deve permitir redefinição de senha **por e-mail**, usando o fluxo nativo do Supabase Auth (link/código de redefinição enviado ao e-mail cadastrado do usuário).

**Fluxo esperado**

1. Usuário informa e-mail.
2. Sistema envia link/código de redefinição por e-mail.
3. Usuário acessa o link / valida o código.
4. Usuário redefine senha.

### RF-LOGIN-004 — Sessão Única

O sistema deve permitir apenas uma sessão ativa simultânea por usuário.

**Regra**

Ao autenticar em novo dispositivo ou navegador, a sessão anterior deve ser invalidada automaticamente.

### RF-LOGIN-005 — Controle de Usuários

O sistema deve possuir funcionalidade administrativa para:

- cadastrar usuários;
- editar usuários;
- ativar/desativar usuários.

**Campos por operação**

| Operação | Campos |
|----------|--------|
| Cadastrar | E-mail, senha temporária (telefone opcional) |
| Editar | Telefone |
| Ativar/desativar | Status (ativo / inativo) |

**Observações**

- E-mail é o identificador de login (único, imutável após a criação do usuário).
- Telefone é **opcional** (contato). A recuperação de senha é por e-mail; não há SMS.
- Neste momento não haverá níveis de permissão diferenciados. Todos os usuários autenticados possuirão acesso total à plataforma administrativa.

### RF-LOGIN-006 — Auditoria

O sistema deve registrar logs de auditoria para operações administrativas de escrita (create, update, delete) nos módulos administrativos.

**Escopo**

- Módulo 1: gestão de usuários.
- Módulos 2–6: alterações em entidades configuráveis.

Operações de leitura não exigem auditoria no MVP. Detalhes transversais em [VISAO_GERAL.md](../../VISAO_GERAL.md).

O log deve registrar:

| Campo | Descrição |
|-------|-----------|
| Usuário responsável | Identificação de quem executou a ação |
| Data/hora | Momento da operação |
| Ação executada | Tipo de operação realizada |
| Entidade afetada | Recurso ou módulo impactado |
| Identificador do registro alterado | ID do registro modificado |

### RF-LOGIN-007 — Configuração Inicial do 2FA

O sistema deve permitir a configuração do autenticador TOTP no primeiro acesso do usuário.

**Fluxo esperado**

1. Admin cadastra o usuário (e-mail + senha temporária; telefone opcional).
2. No primeiro login, após validar e-mail e senha temporária, o sistema exibe o QR code para configuração do TOTP.
3. Usuário configura o aplicativo autenticador e valida com o primeiro código gerado.
4. A partir desse momento, o 2FA é exigido em todo login subsequente.

## Regras de Negócio

| ID | Regra |
|----|-------|
| RN-LOGIN-001 | Somente usuários previamente cadastrados poderão acessar o sistema. |
| RN-LOGIN-002 | Todos os usuários autenticados terão acesso integral aos módulos administrativos. |
| RN-LOGIN-003 | Usuários não poderão possuir múltiplas sessões simultaneamente. |
| RN-LOGIN-004 | Usuários desativados não poderão autenticar no sistema. |
| RN-LOGIN-005 | Sessões inativas por período definido devem ser expiradas automaticamente, redirecionando o usuário para a tela de login. O tempo de inatividade será definido pelo time de desenvolvimento. |
| RN-LOGIN-006 | O primeiro usuário administrativo será criado via seed ou migration na implantação. Não haverá tela de auto-registro no MVP. |
| RN-LOGIN-007 | E-mail de usuários administrativos deve ser único no sistema. |

## Estrutura Conceitual das Entidades

### Usuário Administrativo

Representa um operador com acesso à plataforma administrativa.

**Possíveis propriedades**

| Propriedade | Descrição |
|-------------|-----------|
| Identificador | ID único do usuário |
| E-mail | Identificador de login (obrigatório, único, imutável após criação) |
| Telefone | Contato (opcional) — recuperação de senha é por e-mail |
| Senha | Credencial de autenticação (temporária no cadastro) |
| Status | ativo / inativo |
| 2FA configurado | Booleano interno; `false` até conclusão do primeiro acesso (RF-LOGIN-007) |
| Data de criação | Registro de criação |
| Data de atualização | Última modificação |
