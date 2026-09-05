# Plano de ajustes

Base: os 22 itens levantados, com as respostas dadas em [duvidas-ajustes.md](./duvidas-ajustes.md).

**Fora do escopo (você tirou):** sidebar com grupos expansíveis (item 13) e dashboard (item 20).

Entrega em **4 fases**, para validar antes de acumular mudança demais.

---

## Fase 1 — Credenciais e conta

### 1.1 Máscara de celular `11 9 4520-4308`
Formato exato pedido: `NN N NNNN-NNNN` (espaço após DDD, espaço após o 9, hífen antes dos 4 últimos).

- Componente `PhoneInput` que aplica a máscara enquanto digita e recusa qualquer caractere não numérico —
  **o que também resolve o item 4** (emoji no telefone fica impossível de digitar).
- No banco: **só dígitos** (`11945204308`); a máscara é de exibição. Facilita busca e comparação.
- Migration para normalizar os registros já existentes (hoje estão em formato livre).
- Usar em `NovoUsuario` e na edição inline da tabela (`app/(admin)/usuarios/_components.tsx`).

### 1.2 Senha sem emoji
`lib/validation/usuarios.ts` hoje valida só `min(8)`.

- Restringir a **ASCII imprimível** (letras, dígitos, pontuação) — mais seguro que caçar emoji, que tem
  sequências ZWJ e tons de pele fáceis de escapar.
- Mensagem de erro específica no campo, no padrão de feedback por campo que já existe.

### 1.3 Fluxo de alteração de senha
Hoje **não existe**, e a senha temporária do seed **nunca é forçada a trocar** — é o furo mais
relevante para a entrega.

- Página **"Minha conta"** com troca de senha, exigindo a **senha atual** (sem isso, quem pegar uma
  sessão aberta toma a conta).
- **Troca obrigatória no primeiro acesso**, junto do enroll de 2FA.
- Ao trocar, encerra as demais sessões (Redis).

### 1.4 Só a primeira conta é protegida
Hoje `protectedIds = [primeiroAdmin, usuárioAtual]` — protege o raiz **e** você mesmo.

- Remove a autoproteção: passa a proteger **apenas o admin raiz**.
- A guarda de servidor em `alternarStatus` continua recusando desativar o raiz.
- ⚠️ Efeito colateral aceito: um admin passa a poder se desativar sozinho e ficar trancado do lado de
  fora (só outro admin reativa).

### 1.5 Feedback de espera no logoff
`<form action={logout}>` hoje não tem estado de carregamento → botão vira "Saindo…" com spinner e desabilita.

---

## Fase 2 — Auditoria como wrapper do Supabase

Objetivo: o super usuário inspeciona tudo sem abrir o Supabase.

### 2.1 Enriquecer o que é gravado
**Constatação:** só 6 de 16 linhas têm `diff`. Sem enriquecer a gravação, a tabela nasce vazia de conteúdo.

- `lib/audit.ts` passa a registrar, além do que já grava: **tabela**, **operação**, **filtro** e
  **antes/depois** completos.
- Atualizar as chamadas de `audit()` em todos os módulos (usuários, telas, marquees, banners,
  eventos, conteúdos, obras) para passarem o estado anterior.
- ⚠️ Vale **daqui pra frente**. As 16 linhas atuais não têm como ser reconstruídas — aparecem como
  "sem detalhe".

### 2.2 Tabela ordenável
Hoje `/historico` é timeline e a `DataTable` **não tem ordenação** (verificado).

- Adicionar ordenação por coluna à `DataTable` (clique no cabeçalho, `aria-sort`), reaproveitável nas
  demais listagens.
- `/historico` vira tabela com: **Data/hora · Autor · Ação · Entidade · Registro (ID) · Alterações**.
- Ordenação e paginação **no servidor** — hoje são 16 linhas, mas isso cresce sem teto.
- Filtros por entidade, ação, autor e intervalo de datas.

### 2.3 Colunas personalizadas
- Coluna **Alterações** mantém a seta `antes → depois` que você gostou.
- Coluna **Registro** mostra o UUID (monospace, copiável) e resolve o **nome/e-mail** da entidade
  quando a linha ainda existe — atende o item 8 (nome do usuário ativado/inativado).
- Quando o registro foi excluído, mostra `(removido)` em vez do UUID órfão.
- **Timestamp inteiro** `dd/MM/yyyy HH:mm:ss` em America/Sao_Paulo (item 9).

### 2.4 O "+" com a operação
- Cada linha ganha um botão **`+`** que expande e mostra:
  - o **SQL equivalente**, reconstruído do que foi gravado — ex.:
    `update public.tela set status = 'habilitada' where id = '2baf4b75-…';`
  - o **antes/depois** completo em JSON.
- ⚠️ É a instrução **equivalente**, gerada a partir do registro — não uma query capturada. O app
  escreve via PostgREST, então não existe SQL em lugar nenhum para capturar de verdade.

---

## Fase 3 — Navegação e mobile

### 3.1 Sidebar fixa (item 11)
Fixa em altura total, com rolagem própria; o conteúdo rola ao lado.

### 3.2 Ordem do menu (item 21)
Usuários passa a ficar **entre Obras e Histórico**:
`Telas · Marquees · Banners · Eventos · Conteúdos · Obras · Usuários · Histórico`

Menu segue **plano**, como você pediu.

### 3.3 Menu hambúrguer e mobile (itens 16 e 17)
**Hoje a sidebar é `hidden md:flex` — abaixo de 768px não existe navegação nenhuma.** O app está
quebrado no celular.

- Gaveta lateral com overlay, fechando no Escape e ao tocar fora.
- **Tabelas viram cards empilhados** abaixo de 768px — 6 colunas não cabem em 375px.
- Board de constelação (Obras) e kanban de eventos caem para **lista** no celular: arrastar não
  funciona bem em toque.

### 3.4 Ação e filtro na mesma linha (item 12)
Hoje o botão fica num `div` acima e o filtro é renderizado **dentro** da `DataTable`.

- `DataTable` ganha um slot de ação ao lado do filtro.
- Aplicado em **todas** as listagens, para não ficar inconsistente.

---

## Fase 4 — Ajustes de formulário e infra

### 4.1 Marquee: "Título" → "Texto" (item 18)
Troca **apenas o rótulo** na interface. A coluna `marquee_item.titulo` permanece — renomear exigiria
migration e mexeria no DER que combinamos seguir.

### 4.2 Tirar "Ordem" do formulário (item 19)
- Campo numérico sai do modal; item novo entra **no fim** automaticamente.
- A lista passa a permitir **arrastar para reordenar**, persistindo em lote.
- Mesmo tratamento em **Conteúdos**, que tem o mesmo campo.

### 4.3 Grid nos vínculos (item 15)
"Telas associadas" no editor de marquee sai da lista vertical para **grade fluida** (mínimo ~180px
por item), 1 coluna no celular.

### 4.4 Placeholder `/ex` (item 14)
Campo Rota em Nova tela.

### 4.5 Cron com contador (item 22)
O cron de 5 dias **já existe** no `vercel.json`, mas a função `keep_alive()` só faz `select now()` —
**não grava nada**, então não há como saber se dispara.

- Nova tabela `keep_alive_log` (id, executado_em).
- A rota `/api/keep-alive` passa a fazer **INSERT** a cada execução — é escrita de verdade no banco,
  que é o que segura o free tier, e a contagem de linhas vira o histórico de execuções.
- Exibir a última execução em algum ponto do painel (a definir na Fase 2, junto do histórico).
- ⚠️ No plano Hobby a Vercel limita crons e não garante horário exato. Se não dispararem como
  esperado, a alternativa é o **pg_cron do próprio Supabase**, independente da Vercel.

---

## Verificação

- `pnpm typecheck`, `pnpm lint` e **`pnpm build`** limpos a cada fase (o build de produção já quebrou
  uma vez nesta sessão — não repetir).
- **Fase 1:** criar usuário com emoji na senha e no telefone (deve recusar); trocar a própria senha e
  confirmar que as outras sessões caem; confirmar que só o raiz aparece protegido.
- **Fase 2:** fazer uma alteração real em cada módulo e conferir no `/historico` se o antes/depois e o
  SQL equivalente aparecem corretos; validar ordenação e filtros; confirmar por SQL que só o raiz lê.
- **Fase 3:** medir no navegador em 375px, 768px e 1280px; verificar que nada rola na horizontal e que
  a gaveta abre/fecha.
- **Fase 4:** reordenar por arraste e conferir a persistência no banco; disparar o keep-alive
  manualmente e confirmar a linha nova em `keep_alive_log`.
