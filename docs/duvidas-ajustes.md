# Dúvidas antes do plano de ajustes

Cada item traz **o que existe hoje** (verificado no código, não suposto), a **dúvida** e o
**default que assumo** se você não responder. Responda só as que importam — as com default
razoável podem ser ignoradas.

Numerei as perguntas em sequência (Q1…) para você responder por número.

---

## 1. Senha sem emoji

**Hoje:** `criarUsuarioSchema` (`lib/validation/usuarios.ts`) valida **só** `min(8)`. Nada além disso.

- **Q1.** Bloquear **apenas emoji** ou restringir a um conjunto permitido (ASCII imprimível: letras,
  dígitos, pontuação)? Detectar emoji é traiçoeiro — há sequências ZWJ, tons de pele e símbolos que
  "parecem" texto. A lista de permitidos é mais simples e não deixa buraco.
- **Q2.** Aproveitar para exigir mais alguma coisa (maiúscula, número, símbolo, tamanho maior)? O
  Supabase Auth tem política própria de senha no dashboard — se você definir regras lá, a validação
  do app precisa espelhar, senão o usuário passa no cliente e o servidor recusa.
- **Q3.** A regra vale só na criação de usuário ou também no fluxo de alteração (item 3)?

**Default:** permitir apenas ASCII imprimível, mínimo 8, aplicado nos dois fluxos.

---

## 2. Máscara `11 9 4520-4308`

**Hoje:** `telefone` é `z.string().trim().optional()` — sem máscara, sem validação, salvo como texto cru.

- **Q4.** Confirmando: esse item é do **telefone**, certo? Está escrito "senha com máscara", mas o
  exemplo é um celular. Se for senha mesmo, me explica o que seria a máscara.
- **Q5.** O formato exato: `11 9 4520-4308` tem espaço depois do DDD **e** depois do 9. O padrão
  brasileiro mais comum é `(11) 94520-4308`. Qual dos dois você quer?
- **Q6.** Guardar no banco **mascarado** ou **só dígitos** (`11945204308`)? Só dígitos é melhor para
  buscar e comparar; a máscara fica só na exibição. Hoje há registros salvos em formato livre — se
  mudarmos, quer que eu normalize os existentes?
- **Q7.** Aceitar fixo (10 dígitos) além de celular (11 dígitos)?

**Default:** máscara `(11) 94520-4308` na tela, só dígitos no banco, celular e fixo aceitos.

---

## 3. Fluxo de alteração de senha

**Hoje:** **não existe.** Confirmei: a tela de primeiro acesso só faz QR + código, e a senha
temporária do seed **nunca é forçada a trocar**. Existe `/recuperar-senha` (por e-mail).

- **Q8.** Onde fica? Uma página "Minha conta", ou dentro de `/usuarios` na própria linha?
- **Q9.** Exigir a **senha atual** para confirmar? (Recomendo: sem isso, quem pegar uma sessão aberta
  troca a senha e toma a conta.)
- **Q10.** **Forçar a troca no primeiro acesso**, junto do 2FA? Hoje a senha do seed vale para sempre —
  é o furo mais relevante para a entrega.
- **Q11.** Depois de trocar, derrubar as outras sessões?

**Default:** página "Minha conta", exige senha atual, troca obrigatória no 1º acesso, encerra as demais sessões.

---

## 4. Telefone sem emoji

**Hoje:** sem validação nenhuma.

- **Q12.** Com a máscara do item 2, emoji fica impossível de digitar — o item 4 é resolvido de
  brinde. Você quer **além disso** validar/limpar os registros **já existentes** no banco?

**Default:** a máscara resolve; não mexo no que já está salvo.

---

## 5. Feedback de espera no logoff

**Hoje:** `<form action={logout}>` com botão simples — sem estado de carregamento.

- **Q13.** Spinner no próprio botão ("Saindo…", desabilitado) basta, ou você quer um overlay
  cobrindo a tela?

**Default:** spinner no botão.

---

## 6. Só a primeira conta é protegida

**Hoje:** `protectedIds = [primeiroAdmin, usuárioAtual]` — protege **o raiz e você mesmo**. No servidor,
`alternarStatus` recusa desativar o raiz e recusa auto-desativação.

- **Q14.** Tirar a **autoproteção** significa permitir que um admin **se desative sozinho** e fique
  trancado do lado de fora (só outro admin reativa). É isso mesmo?
- **Q15.** "Nunca cria contas protegidas" — hoje nenhuma conta nova nasce protegida, então isso já
  vale. Você quis dizer outra coisa? Por exemplo, o raiz não poder ser **excluído** (e não só desativado)?

**Default:** só o admin raiz é protegido; autoproteção removida; a guarda de servidor continua para o raiz.

---

## 7. Auditoria filtrável e ordenável

**Hoje:** `/historico` é uma **timeline agrupada por dia**, com filtro de entidade e ação. Não é
tabela e a `DataTable` do projeto **não tem ordenação por coluna** (verifiquei).

- **Q16.** Trocar a timeline por **tabela**, ou manter as duas com um alternador?
- **Q17.** Quais colunas exatamente? Minha sugestão: `Data/hora`, `Autor`, `Ação`, `Entidade`,
  `Registro`, `Alterações`.
- **Q18.** Ordenação **no cliente** (simples, mas exige carregar tudo) ou **no servidor** (paginada,
  aguenta crescer)? Hoje são 76 linhas e a página carrega no máximo 200 — no cliente funciona agora,
  mas quebra quando virar milhares.

**Default:** vira tabela com as 6 colunas, ordenação clicável em todas, no servidor com paginação.

---

## 8. Nome do usuário ativado/inativado

**Hoje:** a auditoria grava `registro_id` = UUID do usuário afetado e `diff = {"status":"ativo"}`.
O nome **não** é gravado — dá para resolver o UUID contra `admin_user` na hora de exibir.

- **Q19.** E quando o usuário foi **excluído**? A linha some e o UUID fica órfão. Mostro o UUID cru,
  "(removido)", ou você prefere que a auditoria passe a **gravar o e-mail junto** no `diff` a partir
  de agora (resolve o futuro, não o passado)?
- **Q20.** Vale para **todas** as entidades (resolver nome de evento, música, tela…) ou só usuários?

**Default:** resolvo o nome de todas as entidades quando existir; "(removido)" quando não existir; e
passo a gravar o rótulo no `diff` daqui pra frente.

---

## 9. Timestamp inteiro

**Hoje:** agrupado por dia, exibe só `HH:MM`.

- **Q21.** Formato `03/09/2026 01:42:27`? Fuso de São Paulo?

**Default:** `dd/MM/yyyy HH:mm:ss` em America/Sao_Paulo.

---

## 10. "Mostrar linha do banco de dados no audit_log"

Este é o item que **menos entendi** — pode ser três coisas bem diferentes:

- **Q22.** Qual delas?
  - **(a)** mostrar o `registro_id` (o UUID da linha afetada);
  - **(b)** mostrar o **conteúdo da linha** como estava;
  - **(c)** ter um **link** que abre o registro na tela dele.

⚠️ Se for **(b)**, tem um limite duro: o `diff` guarda **só o valor novo** do que mudou (ex.:
`{"status":"habilitada"}`), não a linha inteira nem o valor anterior. E em exclusão a linha não
existe mais. Dá para passar a gravar o **antes e depois completos** daqui pra frente, mas os 76
registros atuais não têm como ser reconstruídos.

**Default:** (a) + (c), e passo a gravar antes/depois nas escritas novas.

---

## 11. Fixar sidebar

**Hoje:** `<aside className="hidden w-60 ... md:flex">` — sem `sticky`, sem `fixed`.

- **Q23.** **Fixa ocupando a altura toda** com rolagem própria (o conteúdo rola do lado), ou
  **sticky** (acompanha até o topo)?

**Default:** fixa em altura total, com rolagem independente.

---

## 12. "Nova tela" e "Filtrar" na mesma linha

**Hoje:** o botão fica num `div` acima; o campo de filtro é renderizado **dentro** da `DataTable`.
Por isso ficam em linhas separadas — é preciso mexer na `DataTable` para permitir uma ação ao lado do filtro.

- **Q24.** Aplico em **todas as listagens** (usuários, eventos, conteúdos, obras, banners…) ou só em Telas?

**Default:** em todas, via um slot de ação na `DataTable`.

---

## 13. Sidebar: Telas → Rotas, Banners, Marquees

Aqui preciso de bastante ajuda — hoje o menu é **plano**: Usuários, Telas, Marquees, Banners,
Eventos, Conteúdos, Obras, Histórico.

- **Q25.** "Telas" vira um **grupo** com os filhos Rotas, Banners e Marquees?
- **Q26.** O que é **"Rotas"**? Hoje a entidade `tela` já tem `nome` **e** `rota` na mesma tabela e na
  mesma tela. É uma página nova, ou é a `/telas` atual renomeada para "Rotas" dentro do grupo "Telas"?
- **Q27.** Eventos, Conteúdos, Obras, Usuários e Histórico ficam soltos fora do grupo?

**Sem default** — não arrisco adivinhar a arquitetura de navegação.

---

## 14. Placeholder `/ex`

**Hoje:** `placeholder="/eventos"` no campo Rota.

- **Q28.** Literalmente `/ex`? (Achei `/eventos` mais informativo, mas é sua chamada.)

**Default:** `/ex`, como você pediu.

---

## 15. Grid nos vínculos de marquee e tela

**Hoje:** lista vertical de checkboxes (`space-y-2`), uma tela por linha.

- **Q29.** Quantas colunas? 2 no desktop e 1 no celular, ou grade fluida que se ajusta à largura?

**Default:** grade fluida, mínimo 180px por item.

---

## 16 e 17. Menu hambúrguer e mobile

**Hoje:** a sidebar é `hidden md:flex` — **no celular não existe navegação nenhuma**. O app está
efetivamente quebrado abaixo de 768px.

- **Q30.** Gaveta lateral que desliza (overlay escurecendo o fundo) é o esperado?
- **Q31.** "Modular para mobile" — as **tabelas** são o problema mais difícil: 6 colunas não cabem em
  375px. Prefere **cards empilhados** no celular, ou tabela com rolagem horizontal?
- **Q32.** Alguma tela é prioridade? O board de constelação em Obras e o kanban de eventos exigem
  tratamento próprio (arrastar não funciona bem em toque).

**Default:** gaveta com overlay; tabelas viram cards abaixo de 768px; board e kanban caem para lista no celular.

---

## 18. "Título" → "Texto" no item de marquee

**Hoje:** rótulo `Título` (`label="Título"`), coluna do banco `marquee_item.titulo`.

- **Q33.** Trocar **só o rótulo** na tela, ou renomear também a **coluna do banco** para `texto`?
  Renomear a coluna exige migration e toca o DER que combinamos seguir.

**Default:** só o rótulo.

---

## 19. Tirar "Ordem" do formulário

**Hoje:** campo numérico `Ordem` no modal do item. Os valores atuais denunciam digitação manual.

- **Q34.** Tirando o campo, **como a ordem passa a ser definida?**
  - **(a)** automático — item novo vai para o fim;
  - **(b)** automático + **arrastar para reordenar** na lista;
  - **(c)** botões de subir/descer.
- **Q35.** Vale também para **Conteúdos**, que tem o mesmo campo `ordem`?

**Default:** (b) — novo vai para o fim e a lista permite arrastar.

---

## 20. "Dashboard daily telas > marquees > itens"

Item mais ambíguo da lista. Não sei o que "daily" significa aqui.

- **Q36.** "Daily" é:
  - **(a)** métricas **por dia** (quantas telas/marquees/itens foram criados ou alterados)?
  - **(b)** um **resumo diário** de estado (quantos existem hoje)?
  - **(c)** outra coisa?
- **Q37.** "telas > marquees > itens" é uma **árvore hierárquica** navegável (tela → marquees dela →
  itens de cada um), ou três **cartões de contagem** lado a lado?
- **Q38.** Isso vira a **home** do painel? Hoje `/` só redireciona para `/usuarios` — não existe home.

**Sem default** — preciso da sua definição.

---

## 21. Usuários entre Obras e Histórico

**Hoje:** Usuários é o **primeiro** item do menu; Histórico é o último.

- Sem dúvida. Ordem final: Telas, Marquees, Banners, Eventos, Conteúdos, Obras, **Usuários**, Histórico —
  ajustada conforme a resposta do Q25/Q27.

---

## 22. Cron de 5 em 5 dias

**Isso já existe.** O `vercel.json` tem `{"path": "/api/keep-alive", "schedule": "0 0 */5 * *"}`.

Mas achei dois problemas:

1. **Não dá para saber se está rodando.** A função `keep_alive()` é `stable` e faz só `select now()` —
   não grava nada, então não deixa rastro.
2. **No plano Hobby a Vercel limita crons** e não garante o horário exato; agendamentos mais finos que
   diário podem não ser respeitados como escritos.

- **Q39.** Quer que eu faça o keep-alive **gravar um registro** (data/hora da última execução) para
  ficar auditável, e exiba isso em algum lugar?
- **Q40.** Prefere manter na Vercel ou mover para o **pg_cron do próprio Supabase**, que não depende do
  plano da Vercel?

**Default:** passa a gravar a execução; mantenho na Vercel e verifico na prática se dispara.

---

## Uma pergunta geral

- **Q41.** Ordem de entrega: prefere **tudo num lote** (como no redesign heráldico) ou em fases —
  por exemplo (1) segurança e senha, (2) auditoria, (3) navegação e mobile, (4) dashboard?
  Com 22 itens, fases deixam você validar antes de acumular mudança demais.
