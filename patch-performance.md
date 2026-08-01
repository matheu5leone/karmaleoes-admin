# Patch de Performance e Melhorias — Painel Administrativo Karmaleões

> **Projeto:** Karmaleões — Admin & Hub
> **Escopo deste patch:** otimização de performance da navegação/login + 8 melhorias de CRUD
> **Status:** entregue e versionado (branch `main`)

---

## 1. Sumário executivo

Este patch resolve o principal problema relatado — **lentidão ao trocar de página (~6–8s por clique)** — e entrega **8 melhorias no CRUD** do painel.

O diagnóstico de performance foi feito com **medições reais**, não suposições. Ele mostrou que a lentidão vinha de **três fontes distintas**, sendo que a principal (o middleware de autenticação) foi corrigida diretamente no código. As demais são características de ambiente (compilação em modo desenvolvimento e o plano gratuito do banco), documentadas com recomendações.

---

## 2. Performance

### 2.1 Diagnóstico (medições reais)

| Medição | Tempo | Leitura |
|---|---|---|
| Página já compilada (quente) | **~170 ms** | O app em si é rápido |
| Middleware (redirect sem sessão) | **~30 ms** | Guarda de rota é leve |
| Autenticação no Supabase (`getUser`/2FA) | **~700 ms – 1,0 s por chamada** | Custo de rede/servidor |
| Query de dados no Supabase | **~700 ms por chamada** | Apesar de a query executar em **2 ms** dentro do banco |
| Compilação de rota (1ª visita, modo dev) | **1 – 4 s** | Só existe em desenvolvimento |

**Conclusão:** os "6–8 segundos" **não eram uma query errada nem código lento** — eram a soma de:

1. **Middleware de autenticação** que, a cada navegação, fazia **4–5 chamadas de rede em sequência** (validação de usuário, 2FA, status de admin e sessão no Redis). **→ corrigido.**
2. **Compilação do Next.js em modo desenvolvimento** (1–4 s na primeira visita de cada tela). Só afeta o ambiente local; **não existe em produção**.
3. **Latência por requisição do Supabase (~700 ms)**, característica do **plano gratuito** (o banco executa em 2 ms; o overhead é do servidor gerenciado). Afeta produção e é endereçável por infraestrutura.

### 2.2 Correções entregues

| Mudança | O que faz | Impacto |
|---|---|---|
| **Gate de autenticação no middleware** | Após uma validação completa, emite um cookie assinado de curta duração (~60 s). Enquanto válido, a navegação é liberada **sem nenhuma chamada de rede**. As checagens restantes passaram a rodar **em paralelo** e o acesso ao Redis foi unificado em um único round-trip. | **Elimina o gargalo de ~6 s**: navegações passam de segundos para praticamente instantâneas. |
| **Feedback imediato de navegação** | Barra de progresso no topo + spinner no item clicado, exibidos **no instante do clique** (via `useLinkStatus`). | O usuário vê que o sistema respondeu na hora, mesmo durante qualquer espera. |
| **Otimização do 2FA** | O fator TOTP passou a ser resolvido no passo de senha; a verificação do código faz só o mínimo. | Corrige o **"código inválido" intermitente em produção** — era o código de 30 s expirando por causa da lentidão do fluxo (não era o domínio nem o autenticador). |
| **Atualização de segurança do Next.js** | `15.5.4` → `15.5.20`. | A Vercel bloqueava o deploy da versão anterior por vulnerabilidade conhecida; desbloqueado. |
| **Turbopack + query paralela** | Compilador de desenvolvimento mais rápido; consolidação de uma consulta na tela de marquee. | Ambiente de desenvolvimento mais ágil; uma requisição a menos (~700 ms) na tela de marquee. |

### 2.3 Recomendações de infraestrutura (dependem do cliente)

Estas não são código — reduzem os **~700 ms por requisição** e os **cold starts** em produção:

- **Fluid Compute** na Vercel (reduz cold start) — confirmar que está ativo.
- **Co-localizar a região** das funções da Vercel com a região do Supabase.
- **Compute do Supabase:** o overhead de ~700 ms por requisição é do **plano gratuito**. Subir o plano de compute derruba esse número de forma significativa, beneficiando **toda** a navegação e também o login/2FA.

---

## 3. Melhorias de CRUD (8 itens)

| # | Solicitação | Entregue |
|---|---|---|
| 1 | Duração de música em número inteiro | Coluna migrada para **inteiro (segundos)**; o formulário mantém a digitação amigável em `mm:ss` (ex.: `3:45`), convertendo automaticamente. |
| 2 | Seletor de cor no marquee | **Color picker** (seletor visual + hex) com atalhos para os presets **`#F3F4F6`** (claro) e **`#18191F`** (escuro), na criação e na edição. |
| 3 | Confirmação ao excluir itens | **Já contemplado** em todo o painel: toda exclusão passa por um modal de confirmação padronizado. |
| 4 | Bloquear desativação do 1º admin | O botão "Desativar" some para o **administrador raiz (mais antigo)** e para o **próprio usuário logado**; a regra também é garantida no servidor (não dá para burlar). |
| 5 | Coluna de ciclo de vida em Eventos | Nova coluna **"Lifecycle"** na listagem, entre **Data** e **Status**. |
| 6 | Categoria de Conteúdo no modal | O cadastro de categorias foi **movido para dentro do modal** de "Novo conteúdo" (criar, selecionar e excluir sem sair da tela); a página separada de categorias foi **removida**. |
| 7 | Validação de links de plataforma | O campo de plataforma virou **lista suspensa** (Spotify, YouTube, YouTube Music, Apple Music, Deezer, SoundCloud, Amazon Music, Tidal) e a URL é **validada pelo domínio** correspondente. |
| 8 | Seção dedicada de categorias de Evento | **Já contemplado:** existe uma seção própria de CRUD de categorias de evento, acessível a partir da tela de Eventos. |

> **Observação:** os itens **3** e **8** já estavam implementados no sistema; foram **verificados e confirmados** em vez de refeitos.

---

## 4. Banco de dados

Alterações de schema versionadas em `supabase/migrations/`:

- **`0014_musica_duracao_integer.sql`** — converte a duração das músicas de texto (`mm:ss`) para **inteiro em segundos**, preservando os dados existentes (item **#1**).

Todas as alterações são **aditivas e seguras**; os dados existentes foram convertidos sem perda.

---

## 5. Como validar (roteiro rápido)

1. **Navegação:** clicar entre as telas do menu — a resposta é imediata (barra de progresso no clique).
2. **Obras → Nova música:** digitar duração como `3:45`; salva corretamente.
3. **Obras → Gerenciar (música/coleção):** plataforma em lista suspensa; colar uma URL de domínio errado → o sistema recusa.
4. **Conteúdos → Novo conteúdo → Categoria "Gerenciar":** criar/excluir categoria dentro do modal.
5. **Marquees → Novo/Editar:** seletor de cor com os dois presets.
6. **Usuários:** o 1º admin e o próprio usuário aparecem como "protegido" (sem botão Desativar).
7. **Eventos:** conferir a nova coluna "Lifecycle".

---

## 6. Rastreabilidade (commits)

**Performance**

| Commit | Descrição |
|---|---|
| `c3cae5a` | Gate de autenticação no middleware (fast-path assinado) |
| `7c9ac85` | Feedback imediato de navegação (barra + spinner) |
| `c6dcd49` | Atualização de segurança do Next.js (15.5.20) |
| `dbf3b05` | Otimização do 2FA (fora do caminho crítico) |
| `7d3da60` | Turbopack no dev + query paralela no marquee |

**CRUD**

| Commit | Item(ns) |
|---|---|
| `17c439c` | #1 — duração em inteiro |
| `8bb558f` | #2 — color picker |
| `73eff91` | #4 — proteção de admin · #5 — coluna lifecycle |
| `dfc16f5` | #7 — dropdown + validação de links |
| `6d8c3e4` | #6 — categoria no modal (página removida) |

---

_Documento gerado para apresentação ao cliente. Repositório: `matheu5leone/karmaleoes-admin` (branch `main`)._
