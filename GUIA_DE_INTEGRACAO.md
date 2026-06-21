# Guia de Integração — Hub ↔ Painel Administrativo Karmaleões

> **Para quem:** desenvolvedor(a) que vai integrar o **Hub público** com os dados configurados no **Admin**.
> **Status:** documento **vivo**, preenchido conforme os módulos são entregues. Hoje cobre até o **Plano 04**.
> O guia passo a passo final (com exemplos de código) será consolidado ao término do desenvolvimento.
>
> Convenção: organizado **por plano/módulo**, igual à documentação interna. O Admin é a fonte de configuração;
> o Hub **consome** (leitura) o subconjunto publicado.

---

## 0. Fundamentos da integração

- **Banco:** Supabase Postgres (mesmo projeto do Admin). O Hub lê via `supabase-js` (ou REST/GraphQL do
  PostgREST). Imagens são servidas por **URL pública** dos buckets de Storage (o campo já guarda a URL).
- **Mídia:** o Hub **não hospeda** mídia (vídeo/áudio/streaming) — usa metadados + links externos.
- **Links externos:** sempre abrir em **nova aba** (`target="_blank" rel="noopener noreferrer"`).
- **Fuso horário:** regras de data (ex.: expiração de eventos) usam **America/Sao_Paulo**.

### ⚠️ Acesso de leitura (RLS) — pendência transversal

Hoje as tabelas têm **RLS restrita a administradores autenticados** e o papel **`anon` teve o `select`
revogado**. Ou seja, **o Hub (anônimo) ainda NÃO consegue ler** esses dados. Antes da integração será
necessário **expor o subconjunto público** (apenas o que é "publicado/visível") por uma destas vias, a definir:

- políticas de `select` para `anon`/`authenticated` **somente nas linhas publicadas**, ou
- **views públicas** dedicadas (ex.: `hub_banners`, `hub_eventos`) que já filtram o que é visível, ou
- uma camada de API no próprio Hub usando a **service key** no servidor.

Esta decisão de exposição é um **item de integração em aberto** (não implementado no Admin ainda).

---

## Plano 01 — Autenticação & Sessão
**Integração com o Hub:** **nenhuma.** É um módulo interno do Admin (login de operadores, 2FA, sessão única).
O Hub público não consome autenticação do Admin.

---

## Plano 02 — Telas, Navegação & Marquees

**O que o Hub consome**

| Entidade | Uso no Hub |
|----------|-----------|
| `tela` (`nome`, `rota`, `status`) | Define quais telas/rotas estão **ativas**. `status='desabilitada'` → tela **não aparece** na navegação (RN-NAV-003). |
| `marquee` (`nome`, `props_visuais`) | Componente navegável reutilizável. `props_visuais` (jsonb) traz `cor_fundo`, `cor_texto`. |
| `marquee_tela` (N:N) | Em **quais telas** cada marquee aparece. |
| `marquee_item` (`titulo`, `imagem`, `tipo_nav`, `tela_destino_id`, `url_externa`, `ordem`) | Itens do marquee, **ordenados por `ordem`**. |

**Regras de exibição**
- Renderizar marquees apenas nas telas **habilitadas** às quais estão associados.
- Item `tipo_nav='interno'`: navegar para `tela_destino_id` — que **sempre** será uma tela habilitada (o Admin
  só permite apontar para habilitadas). Se a tela for desabilitada depois, o Hub deve tratar (ver lacuna abaixo).
- Item `tipo_nav='externo'`: abrir `url_externa` em **nova aba**.
- `imagem` do item: URL pública (bucket `marquees`).

**Lacuna (responsabilidade do Hub):** o que ocorre quando alguém **acessa diretamente a URL de uma tela
desabilitada** (digitando/colando) **não está especificado**. O Admin só fornece o `status`; o Hub decide o
comportamento (ex.: `404`, redirect para a home, ou página "indisponível"). A definir na spec do Hub.

---

## Plano 03 — Banners por Tela

**O que o Hub consome**

| Entidade | Uso no Hub |
|----------|-----------|
| `banner` (`nome`, `imagem`) | Asset reutilizável. `imagem` = URL pública (bucket `banners`). |
| `banner_tela` (`banner_id`, `tela_id`, `status`) | Associação com status **por tela** (`draft`/`publicado`). |

**Regras de exibição**
- Em cada tela, exibir o banner cuja associação está **`publicado`** — há **no máximo 1 publicado por tela**
  (garantido por índice único).
- **Não exibir** banner em tela **desabilitada**, mesmo com associação `publicado` (RN-BANNER-007).
- Associações `draft` **não** aparecem.

---

## Plano 04 — Eventos

**O que o Hub consome — use a VIEW, não a tabela**

| Origem | Uso no Hub |
|--------|-----------|
| **`eventos_view`** | Sempre ler **a view** (não a tabela `evento`). Ela já entrega os **campos virtuais** de visibilidade/estado. |

**Campos virtuais da `eventos_view`** (calculados na leitura, sem job):
- `data_referencia`: `nova_data` se o status for `Adiado`; senão `data`.
- `expirado`: `true` a partir do **dia seguinte** à `data_referencia` (fuso **America/Sao_Paulo**).
- `status_efetivo`: `"Expirado"` quando `expirado` e lifecycle `Em aberto`; caso contrário, o status armazenado.
- `enable_efetivo`: `enable` **E NÃO** `expirado` — **é o que rege a visibilidade no Hub**.

**Regras de exibição**
- Exibir somente eventos com **`enable_efetivo = true`**.
- Mostrar o **`status_efetivo`** (pode ser "Expirado", "Esgotado", "Adiado", "Sucesso", "Cancelado"…).
- **Ordenar por `prioridade`** (desc) — eventos estratégicos primeiro.
- Compra de ingressos: `link_externo` em **nova aba**. O Hub **não vende** ingressos (RN-EVENTO-003/004).
- Nada de job/cron: a expiração é reativa; basta reler a view.

---

## Pendências de integração (consolidado)

| # | Item | Responsável | Status |
|---|------|-------------|--------|
| 1 | Exposição de leitura pública (RLS/views/`anon`) do subconjunto publicado | Admin (a implementar) | **em aberto** |
| 2 | Comportamento de acesso direto a URL de tela **desabilitada** | Hub (spec a definir) | **em aberto** |
| 3 | Guia passo a passo final com exemplos de código (`supabase-js`, queries) | ambos | ao fim do projeto |

> Próximos planos (05 Conteúdos, 06 Obras) serão adicionados a este guia quando entregues.
