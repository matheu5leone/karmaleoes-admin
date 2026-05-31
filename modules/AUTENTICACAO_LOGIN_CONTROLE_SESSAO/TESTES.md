# Roteiro de Testes — Autenticação, Login e Controle de Sessão

**Especificação:** [AUTENTICACAO_LOGIN_CONTROLE_SESSAO.md](./AUTENTICACAO_LOGIN_CONTROLE_SESSAO.md)

## Escopo

Validar autenticação administrativa (e-mail, senha, 2FA), configuração inicial do 2FA, recuperação de senha, sessão única com expiração por inatividade, gestão de usuários (com telefone obrigatório), bootstrap e auditoria conforme RF-LOGIN-001 a 007 e RN-LOGIN-001 a 007.

## Legenda

| Prioridade | Significado |
|------------|-------------|
| P0 | Bloqueante para release |
| P1 | Funcionalidade essencial |
| P2 | Complementar |

| Tipo | Significado |
|------|-------------|
| Positivo | Fluxo válido esperado |
| Negativo | Validação de rejeição/erro |
| Integração | Admin + Hub ou serviços externos (SMS, TOTP) |

---

## RF-LOGIN-001 — Autenticação de Usuário

| ID | Prioridade | Tipo | Cenário | Pré-condições | Passos | Resultado esperado |
|----|------------|------|---------|---------------|--------|-------------------|
| TC-LOGIN-001 | P0 | Positivo | Login com credenciais válidas | Usuário cadastrado e ativo | Informar e-mail e senha corretos; prosseguir para 2FA | Sistema aceita credenciais e solicita segundo fator |
| TC-LOGIN-002 | P0 | Negativo | e-mail inexistente | e-mail não cadastrado | Informar e-mail e senha | Acesso negado; mensagem adequada |
| TC-LOGIN-003 | P0 | Negativo | Senha incorreta | Usuário cadastrado | Informar e-mail válido e senha inválida | Acesso negado; sem revelar qual campo falhou (se política de segurança) |
| TC-LOGIN-004 | P1 | Negativo | Campos obrigatórios vazios | Tela de login | Submeter formulário sem e-mail ou senha | Validação impede envio |

## RF-LOGIN-002 — Autenticação em 2 Fatores

| ID | Prioridade | Tipo | Cenário | Pré-condições | Passos | Resultado esperado |
|----|------------|------|---------|---------------|--------|-------------------|
| TC-LOGIN-005 | P0 | Positivo | 2FA com código TOTP válido | e-mail/senha validados; app configurado | Informar código TOTP correto | Sessão autenticada; acesso ao admin |
| TC-LOGIN-006 | P0 | Negativo | Código TOTP inválido | e-mail/senha validados | Informar código incorreto ou expirado | Acesso negado |
| TC-LOGIN-007 | P1 | Integração | Compatibilidade TOTP | Contas em Google/Microsoft/Authy | Validar com pelo menos um app autenticador | Códigos aceitos conforme padrão TOTP |

## RF-LOGIN-003 — Recuperação de Senha

| ID | Prioridade | Tipo | Cenário | Pré-condições | Passos | Resultado esperado |
|----|------------|------|---------|---------------|--------|-------------------|
| TC-LOGIN-008 | P0 | Positivo | Fluxo completo de recuperação | Usuário com telefone cadastrado | 1) Informar e-mail 2) Receber SMS 3) Validar código 4) Redefinir senha | Senha alterada; login possível com nova senha |
| TC-LOGIN-009 | P1 | Negativo | Código SMS inválido | Código enviado | Informar código errado | Redefinição bloqueada |
| TC-LOGIN-010 | P1 | Negativo | e-mail sem telefone cadastrado | Usuário sem número | Solicitar recuperação | Fluxo interrompido com orientação adequada |

## RF-LOGIN-004 — Sessão Única

| ID | Prioridade | Tipo | Cenário | Pré-condições | Passos | Resultado esperado |
|----|------------|------|---------|---------------|--------|-------------------|
| TC-LOGIN-011 | P0 | Positivo | Invalidação ao novo login | Sessão ativa no navegador A | Autenticar no navegador B | Sessão A invalidada; apenas B permanece ativo |
| TC-LOGIN-012 | P0 | Negativo | Impedir múltiplas sessões | Sessão ativa | Tentar manter duas sessões simultâneas | RN-LOGIN-003 respeitada |

## RF-LOGIN-005 — Controle de Usuários

| ID | Prioridade | Tipo | Cenário | Pré-condições | Passos | Resultado esperado |
|----|------------|------|---------|---------------|--------|-------------------|
| TC-LOGIN-013 | P0 | Positivo | Cadastro de usuário | Admin autenticado | Cadastrar com e-mail, telefone e senha temporária | Usuário criado e apto a autenticar |
| TC-LOGIN-013b | P0 | Negativo | Cadastro sem telefone | Admin autenticado | Tentar cadastrar sem telefone | Operação bloqueada; campo obrigatório |
| TC-LOGIN-013c | P0 | Negativo | e-mail duplicado | e-mail já cadastrado | Tentar cadastrar com mesmo e-mail | Operação bloqueada (RN-LOGIN-007) |
| TC-LOGIN-014 | P0 | Positivo | Edição de telefone | Usuário existente | Alterar telefone | Alteração persistida |
| TC-LOGIN-014b | P1 | Negativo | Edição de e-mail | Usuário existente | Tentar alterar e-mail | Operação bloqueada; e-mail imutável |
| TC-LOGIN-015 | P0 | Positivo | Desativar usuário | Usuário ativo | Desativar usuário | RN-LOGIN-004: login bloqueado |
| TC-LOGIN-016 | P1 | Positivo | Reativar usuário | Usuário desativado | Ativar novamente | Login permitido |
| TC-LOGIN-017 | P1 | Positivo | Acesso integral sem perfis | Dois usuários ativos | Autenticar e acessar módulos admin | RN-LOGIN-002: ambos com acesso total |

## RF-LOGIN-006 — Auditoria

| ID | Prioridade | Tipo | Cenário | Pré-condições | Passos | Resultado esperado |
|----|------------|------|---------|---------------|--------|-------------------|
| TC-LOGIN-018 | P0 | Positivo | Registro de operação administrativa | Admin autenticado | Executar ação (ex.: editar usuário) | Log com usuário, data/hora, ação, entidade e ID do registro |
| TC-LOGIN-019 | P1 | Positivo | Rastreabilidade de alterações | Logs existentes | Consultar histórico da entidade | Registros correlacionáveis ao responsável |

## RF-LOGIN-007 — Configuração Inicial do 2FA

| ID | Prioridade | Tipo | Cenário | Pré-condições | Passos | Resultado esperado |
|----|------------|------|---------|---------------|--------|-------------------|
| TC-LOGIN-022 | P0 | Positivo | Primeiro login com senha temporária | Usuário recém-cadastrado (e-mail + telefone + senha temp.) | 1) Login com e-mail + senha temporária 2) Sistema exibe QR code 3) Configurar app 4) Validar primeiro código | 2FA configurado; logins seguintes exigem TOTP |
| TC-LOGIN-023 | P0 | Negativo | Código inválido na configuração | QR code exibido | Informar código errado na configuração | Configuração não concluída |

## Regras de Negócio

| ID | Prioridade | Tipo | Cenário | Passos | Resultado esperado |
|----|------------|------|---------|--------|-------------------|
| TC-LOGIN-020 | P0 | Negativo | RN-LOGIN-001 — Usuário não cadastrado | Tentar login sem cadastro prévio | Acesso negado |
| TC-LOGIN-021 | P0 | Negativo | RN-LOGIN-004 — Usuário desativado | Login com usuário inativo | Autenticação bloqueada |
| TC-LOGIN-024 | P0 | Positivo | RN-LOGIN-005 — Expiração por inatividade | Manter sessão inativa pelo período definido | Sessão expirada; redirecionamento para login |
| TC-LOGIN-025 | P1 | Positivo | RN-LOGIN-006 — Bootstrap | Verificar implantação inicial | Primeiro usuário criado via seed/migration; sem tela de auto-registro |

## Checklist de regressão do módulo

- [ ] Fluxo login + 2FA (P0)
- [ ] Configuração inicial do 2FA no primeiro acesso (P0)
- [ ] Cadastro de usuário com e-mail + telefone + senha temporária (P0)
- [ ] Recuperação de senha via SMS (P0)
- [ ] Sessão única entre dispositivos (P0)
- [ ] Expiração de sessão por inatividade (P0)
- [ ] CRUD e ativação de usuários (P0)
- [ ] e-mail único e imutável (P0)
- [ ] Auditoria de ações administrativas (P0)
