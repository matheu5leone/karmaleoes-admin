# Design System — Plataforma Administrativa Karmaleões

> Identidade **heraldic craftsmanship**: pergaminho envelhecido, tincturas heráldicas e ornamento
> artesanal com moderação. Este documento é a fonte da verdade visual — tokens, regras e componentes.
> Stack: **Tailwind + shadcn/ui** ([`CONVENTIONS.md`](./docs/superpowers/plans/CONVENTIONS.md)).
>
> Os **tokens** (§4) vivem em `app/globals.css`; o **mapeamento** em `tailwind.config.ts`.

---

## 1. Princípios

1. **A página é pergaminho.** O bege envelhecido é o substrato, não um fundo neutro qualquer.
   Superfícies são folhas sobre a mesa, com filete de 1px — não caixas flutuantes com sombra.
2. **Regra da tinctura.** Herdada da heráldica (Llwyd, 1568): *metal não vai sobre metal, nem cor
   sobre cor*. Campo de **metal** (pergaminho, argent, or) recebe carga de **cor** (sable, gules,
   azure, vert); campo de **cor** recebe carga de **metal**. É uma regra de contraste — e é por isso
   que o texto sobre o botão de ouro é tinta escura, nunca clara.
3. **Ornamento tem função.** Filete, capitular e florão marcam hierarquia e início de leitura. Nada
   de decoração que não organize a página.
4. **A hachura carrega significado.** O sistema de Petra Sancta (1638) codifica cada tinctura por um
   padrão de linhas. Aqui ele distingue status **sem depender de cor** (WCAG 1.4.1).
5. **Angular, não arredondado.** `--radius: 2px`. Heráldica é feita de escudos e filetes, não de
   cantos macios.
6. **Acessível por padrão.** Todo par de texto/fundo passa em **WCAG AA** nos dois temas — validado
   por script, não no olho.

---

## 2. Cor — tincturas

Escala neutra quente (pergaminho, hue ~38–42) no lugar do cinza frio. Os semânticos são tincturas.

| Papel | Tinctura | Token | Claro | Escuro |
|---|---|---|---|---|
| fundo da página | pergaminho | `--background` | `40 42% 88%` | `28 18% 11%` |
| superfície | argent | `--card` | `42 50% 93%` | `28 16% 15%` |
| tinta | sable | `--foreground` | `28 30% 16%` | `40 30% 88%` |
| marca (texto/link) | **or** | `--brand` | `38 66% 30%` | `42 75% 62%` |
| marca (preenchimento) | **or** (folha) | `--brand-fill` | `42 72% 54%` | `42 78% 60%` |
| destrutivo | **gules** | `--destructive` | `2 62% 42%` | `2 72% 70%` |
| sucesso | **vert** | `--success` | `140 38% 30%` | `140 40% 55%` |
| informação | **azure** | `--info` | `212 48% 38%` | `210 55% 66%` |
| aviso | **tenné** | `--warning` | `26 70% 35%` | `30 70% 60%` |
| realce | **purpure** | `--purpure` | `300 28% 34%` | `300 35% 68%` |

O tema escuro é o **scriptorium noturno**: couro e tinta à luz de vela, com o ouro mais luminoso.

**Aliases no Tailwind** (mesmos tokens, nome heráldico): `text-or`, `bg-or-fill`, `bg-gules`,
`text-azure`, `border-argent`, `text-vert`, `text-tenne`, `text-purpure`, `text-sable`.

---

## 3. Tipografia

Old-style em toda a interface — a serifa do séc. XVI é a identidade.

- **Texto/UI:** **EB Garamond** (`--font-serif`) — revival humanista do Garamond.
- **Títulos:** **Cormorant Garamond** (`--font-display`) — alto contraste; aplicado automaticamente
  em `h1/h2/h3` e disponível como `font-display`.
- **Dados:** **IBM Plex Mono** (`--font-mono`) em IDs, rotas e ISRC.
- **Blackletter:** deliberadamente **ausente** como fonte. Gótica cansa mesmo em título; o único
  lugar onde ela apareceria — o monograma do selo — é **SVG desenhado**.

---

## 4. Ornamentos — `components/heraldry/`

| Componente | Uso |
|---|---|
| `Seal` | Sigilo da casa (roundel + leão rampante + monograma K). Sidebar e login. |
| `ShieldBadge` | Badge de status. `escudo` desenha o contorno de escudo; sem ele, retangular. |
| `Rule` | Filete duplo com losango — divisória de seção. |
| `Flourishes` | Cantoneiras de florão para cards e diálogos. |
| `PageHeading` | Título + filete + intro com capitular. |

**Hachura (Petra Sancta):** classes `.hatch` + `.hatch-<tinctura>` em `globals.css`.

| Tinctura | Padrão |
|---|---|
| or | pontos |
| argent | campo liso (sem padrão) |
| gules | linhas verticais |
| azure | linhas horizontais |
| sable | grade cruzada |
| vert | diagonal ↘ |
| purpure | diagonal ↙ |
| tenné | diagonal larga + pontos |

**Capitular:** `.dropcap` rubrica a primeira letra em gules, como na rubricação dos manuscritos.

**Grão de pergaminho:** `body::after` com ruído `feTurbulence` inline (data-URI, sem custo de rede),
`pointer-events: none`. Opacidade `--paper-opacity`: `0.32` no claro, `0.16` no escuro.

---

## 5. Componentes

- **Botões** — `brand` usa **or (folha)** com tinta escura (regra da tinctura). `destructive` é gules.
- **Campos** — filete de 1px, cantos de 2px; foco com anel em `--ring` (or).
- **Tabela** (`data-table`) — **livro-razão**: cabeçalho rubricado em versalete espaçado, filete
  duplo abaixo, linhas alternadas e realce em `brand-subtle` no hover.
- **Diálogos** — folha de pergaminho com `Flourishes` nos cantos.
- **Sidebar** — painel armorial: selo + nome da casa, `Rule` abaixo.

---

## 6. Acessibilidade

- Contraste **AA** garantido nos dois temas (validado por script sobre todos os pares).
- Status **nunca depende só de cor**: a hachura é o segundo canal.
- Foco sempre visível (`:focus-visible` com anel em or, `outline-offset: 2px`).
- Animações respeitam `prefers-reduced-motion`.
