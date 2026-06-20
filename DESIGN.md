# Design System — Plataforma Administrativa Karmaleões

> Identidade visual **minimalista e editorial**: tipografia **serifada**, fundo **cinza claro** e um único
> **acento quente** usado com parcimônia. Este documento é a fonte da verdade visual — tokens, estados e
> componentes. Alinhado à stack ([`CONVENTIONS.md`](./docs/superpowers/plans/CONVENTIONS.md)): **shadcn/ui + Tailwind**.
>
> Os **tokens** (§4) colam direto em `app/globals.css`; o **mapeamento Tailwind** (§5) em `tailwind.config.ts`.

---

## 1. Princípios

1. **Silêncio visual.** O cinza claro é o protagonista. Cor só onde comunica estado ou ação.
2. **Tipografia como identidade.** A serifa carrega a personalidade — pouca decoração, muito contraste tipográfico.
3. **Hierarquia por tipografia e espaço**, não por caixas e sombras pesadas. Bordas de 1px > sombras.
4. **Um acento só.** O quente (terracota) aparece em links, foco e destaques pontuais — nunca em áreas grandes.
5. **Estados sempre explícitos.** Todo elemento interativo tem hover, active, focus-visible e disabled definidos.
6. **Acessível por padrão.** Contraste mínimo AA; foco sempre visível via `:focus-visible`.

---

## 2. Fundamentos — Cor

Escala neutra **parametrizada** num único matiz levemente frio (`hue 220`, baixa saturação). Trocar a
aparência = ajustar o matiz/saturação base. O acento é o único elemento cromático forte.

### Neutros (cinza)

| Token | HSL | Hex aprox. | Uso |
|-------|-----|-----------|-----|
| `gray-50` | `220 14% 98%` | `#F8F9FA` | superfícies elevadas sutis |
| `gray-100` | `220 14% 96%` | `#F3F4F6` | **fundo da página** |
| `gray-200` | `220 14% 93%` | `#EBEDF1` | fundo muted, zebra de tabela |
| `gray-300` | `220 13% 88%` | `#DCDFE4` | **bordas** |
| `gray-400` | `220 12% 80%` | `#C5C9D1` | bordas de ênfase, divisores |
| `gray-500` | `220 10% 64%` | `#979CA8` | ícones secundários, placeholder |
| `gray-600` | `220 9% 46%`  | `#6B7280` | **texto muted** |
| `gray-700` | `220 12% 32%` | `#474D5A` | texto secundário |
| `gray-800` | `220 16% 20%` | `#2A2F3A` | títulos sobre claro |
| `gray-900` | `220 20% 12%` | `#181B23` | **tinta / texto principal** |

### Acento (quente — "leões")

Usado em **links, foco, seleção e destaques**. Não preencher áreas grandes.

| Token | HSL | Hex aprox. | Uso |
|-------|-----|-----------|-----|
| `brand` | `25 55% 42%` | `#A65E33` | acento base (links, ring, ativo) |
| `brand-hover` | `25 56% 36%` | `#8C4E2B` | hover de elementos de marca |
| `brand-active` | `25 58% 30%` | `#733F23` | pressed |
| `brand-subtle` | `25 50% 94%` | `#F6ECE5` | fundo de seleção/realce sutil |
| `brand-foreground` | `0 0% 100%` | `#FFFFFF` | texto sobre `brand` |

### Semânticos (estado) — dessaturados para conviver com o cinza

| Token | HSL | Hex aprox. | `*-subtle` (fundo) |
|-------|-----|-----------|--------------------|
| `success` | `145 45% 34%` | `#317A53` | `145 40% 93%` `#E6F2EB` |
| `warning` | `35 75% 42%`  | `#BC7A18` | `38 80% 92%` `#FBEFD8` |
| `danger`  | `0 62% 45%`   | `#BA3838` | `0 60% 95%` `#F8E7E7` |
| `info`    | `215 50% 44%` | `#3A6BA8` | `215 55% 94%` `#E5EDF7` |
| `neutral` | `220 9% 46%`  | `#6B7280` | `220 14% 93%` `#EBEDF1` |

> Texto sobre fundos `*-subtle` usa o tom forte correspondente (ex.: texto `success` em `success-subtle`).

---

## 3. Fundamentos — Tipografia

**Serifada em toda a interface** — é a identidade. Números em tabelas usam *tabular figures* para alinhar.

- **Família principal (serif):** `"Source Serif 4"` (variável, open-source, ótima legibilidade em tela).
  Fallback: `Georgia, "Times New Roman", serif`.
- **Mono (apenas dados/código/IDs):** `"IBM Plex Mono", ui-monospace, monospace`.
- **Recursos:** `font-feature-settings: "ss01", "cv01"` opcional; **`"tnum" 1`** em colunas numéricas.

```
--font-serif: "Source Serif 4", Georgia, "Times New Roman", serif;
--font-mono:  "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
```

### Escala (base 16px, razão ~1.25)

| Nível | Tamanho | Line-height | Peso | Uso |
|-------|---------|-------------|------|-----|
| Display | `2.5rem` (40px) | 1.15 | 600 | telas de entrada (login), vazios |
| H1 | `2rem` (32px) | 1.2 | 600 | título de página |
| H2 | `1.5rem` (24px) | 1.25 | 600 | seções |
| H3 | `1.25rem` (20px) | 1.3 | 600 | cards, subseções |
| Body-lg | `1.125rem` (18px) | 1.6 | 400 | introduções |
| **Body** | `1rem` (16px) | 1.6 | 400 | **texto padrão** |
| Small | `0.875rem` (14px) | 1.5 | 400 | tabelas, labels, ajuda |
| Caption | `0.75rem` (12px) | 1.4 | 500 | badges, metadados, overline |

- **Títulos:** peso 600, `letter-spacing: -0.01em` (serifa fica mais firme).
- **Caption/overline:** `letter-spacing: 0.04em`, opcional `text-transform: uppercase` para rótulos de seção.
- **Medida de leitura:** máx. `68ch` em blocos de texto.
- **Links:** cor `brand`, sem sublinhado em repouso; **sublinhado no hover** (`text-underline-offset: 2px`).

---

## 4. Tokens (colar em `app/globals.css`)

Formato shadcn (canais `H S% L%`, sem `hsl()`). `--accent` permanece o **hover neutro** do shadcn; o
acento de marca é `--brand` (separado, para não conflitar).

```css
:root {
  /* superfícies */
  --background: 220 14% 96%;     /* página — cinza claro */
  --foreground: 220 20% 12%;     /* tinta */
  --card: 0 0% 100%;             /* cards brancos elevam sobre o cinza */
  --card-foreground: 220 20% 12%;
  --popover: 0 0% 100%;
  --popover-foreground: 220 20% 12%;

  /* ação primária = tinta (minimalista editorial) */
  --primary: 220 20% 14%;
  --primary-foreground: 220 14% 98%;

  /* secundária / muted / hover neutro */
  --secondary: 220 14% 92%;
  --secondary-foreground: 220 20% 18%;
  --muted: 220 14% 93%;
  --muted-foreground: 220 9% 46%;
  --accent: 220 14% 92%;          /* hover/seleção NEUTRA (convenção shadcn) */
  --accent-foreground: 220 20% 18%;

  /* marca (acento quente) */
  --brand: 25 55% 42%;
  --brand-foreground: 0 0% 100%;
  --brand-subtle: 25 50% 94%;

  /* estado */
  --destructive: 0 62% 45%;
  --destructive-foreground: 0 0% 100%;
  --success: 145 45% 34%;
  --warning: 35 75% 42%;
  --info: 215 50% 44%;

  /* contornos */
  --border: 220 13% 88%;
  --input: 220 13% 85%;          /* borda de campo */
  --ring: 25 55% 42%;            /* foco = marca */

  /* forma */
  --radius: 0.375rem;            /* 6px — cantos discretos */
}
```

> **Dark mode:** fora do MVP. Quando entrar, criar bloco `.dark` invertendo a escala (fundo `220 20% 12%`,
> tinta `220 14% 92%`), mantendo `--brand`/semânticos com leve aumento de luminosidade.

### Forma, sombra e espaço

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius` | `6px` | inputs, botões, badges |
| radius card | `8px` | cards, popovers, dialog |
| `shadow-xs` | `0 1px 2px rgb(16 24 40 / 0.04)` | inputs, botões em repouso |
| `shadow-sm` | `0 1px 3px rgb(16 24 40 / 0.06)` | cards |
| `shadow-md` | `0 4px 12px rgb(16 24 40 / 0.08)` | dropdowns, popovers |
| `shadow-lg` | `0 12px 32px rgb(16 24 40 / 0.14)` | dialog/modal |
| espaçamento | escala 4px (Tailwind) | densidade confortável; padding de página `24px`+ |
| borda padrão | `1px solid hsl(var(--border))` | preferir borda a sombra |

---

## 5. Mapeamento Tailwind (`tailwind.config.ts`)

```ts
theme: {
  extend: {
    colors: {
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
      primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
      secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
      muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
      accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
      brand: { DEFAULT: "hsl(var(--brand))", foreground: "hsl(var(--brand-foreground))", subtle: "hsl(var(--brand-subtle))" },
      destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
      success: "hsl(var(--success))",
      warning: "hsl(var(--warning))",
      info: "hsl(var(--info))",
      border: "hsl(var(--border))",
      input: "hsl(var(--input))",
      ring: "hsl(var(--ring))",
    },
    borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
    fontFamily: {
      serif: ["var(--font-serif)"],
      mono: ["var(--font-mono)"],
    },
  },
}
```

> No `app/layout.tsx`, carregar `Source_Serif_4` e `IBM_Plex_Mono` via `next/font/google` expondo as
> CSS vars `--font-serif`/`--font-mono`; aplicar `font-serif` no `<body>`.

---

## 6. Estados de interação (regra geral)

Aplicar de forma consistente a **todo** elemento interativo:

| Estado | Regra |
|--------|-------|
| **Repouso** | cor/borda do token base |
| **Hover** | escurece a superfície ~4% (neutros) ou usa `brand-hover` (marca); cursor `pointer` |
| **Active/Pressed** | escurece mais ~4% (`brand-active` na marca); sem deslocamento de layout |
| **Focus-visible** | anel `2px hsl(var(--ring))` + `offset 2px`; **somente** `:focus-visible` (não em clique de mouse) |
| **Disabled** | `opacity: 0.5`; `cursor: not-allowed`; sem hover; remover sombra |
| **Loading** | desabilita interação, mostra spinner; mantém largura (sem "pulo") |
| **Selecionado** | fundo `brand-subtle` + texto `foreground`; barra/indicador `brand` quando aplicável |

```css
:where(button, a, [role="button"], input, select, textarea):focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

---

## 7. Componentes

### 7.1 Botões

Cantos `--radius`, altura 40px (`h-10`), padding-x 16px, peso 500, sem all-caps.

| Variante | Repouso | Hover | Active | Foco | Disabled |
|----------|---------|-------|--------|------|----------|
| **Primary** | bg `primary`, texto `primary-foreground` | bg +6% escuro | +4% escuro | ring | opacity .5 |
| **Brand** (CTA pontual) | bg `brand`, texto branco | bg `brand-hover` | `brand-active` | ring | opacity .5 |
| **Secondary** | bg `secondary`, texto `secondary-foreground`, borda `border` | bg `accent` | +4% | ring | opacity .5 |
| **Ghost** | transparente, texto `foreground` | bg `accent` | +4% | ring | opacity .5 |
| **Outline** | borda `input`, fundo `card` | bg `accent` | +4% | ring | opacity .5 |
| **Destructive** | bg `destructive`, texto branco | +6% escuro | +4% | ring `destructive` | opacity .5 |
| **Link** | texto `brand`, sem fundo | sublinhado | — | ring | opacity .5 |

- **Hierarquia:** **uma** ação primária (tinta) por contexto; `Brand` só para o CTA mais importante.
- Ícone + texto: gap `8px`; ícone `16–18px`, traço alinhado ao peso do texto.

### 7.2 Campos (input, textarea, select)

- Fundo `card` (branco), borda `1px input`, texto `foreground`, placeholder `gray-500`, altura `h-10`, radius `--radius`.
- **Hover:** borda `gray-400`.
- **Focus:** borda `brand` + ring (2px/offset 2px).
- **Erro:** borda `danger`, mensagem `small` em `danger` abaixo; ícone opcional.
- **Disabled:** fundo `muted`, texto `gray-500`, `cursor: not-allowed`.
- **Label** `small` peso 500 acima do campo; texto de ajuda `caption` em `muted-foreground`.

### 7.3 Card / Superfície

- Fundo `card` (branco) sobre página `background` (cinza) — o contraste de luminosidade cria a elevação.
- Borda `1px border`, radius `8px`, `shadow-sm`. Padding interno `20–24px`.
- **Hover (quando clicável):** `shadow-md` + borda `gray-400`; transição `150ms`.
- Cabeçalho de card: H3 serif + descrição `small muted`.

### 7.4 Tabela / `data-table`

- Cabeçalho: `small`, peso 600, `muted-foreground`, `letter-spacing 0.02em`, borda inferior `border`.
- Linhas: borda inferior `1px border`; **zebra opcional** `gray-200` em linhas pares.
- **Hover de linha:** fundo `accent` (neutro). **Selecionada:** `brand-subtle`.
- Números: `font-mono` ou `tnum`, alinhados à direita.
- Densidade: célula `py-3 px-4`. Ações por linha em `ghost`/ícone, reveladas/realçadas no hover.
- Vazio: estado com texto `muted` centralizado + ação primária.

### 7.5 Badge de status

Pílula `caption` (12px), peso 500, padding `2px 8px`, radius `9999px`, fundo `*-subtle` + texto do tom forte.

| Domínio | Valor → cor |
|---------|-------------|
| **Telas** | habilitada → `success` · desabilitada → `neutral` |
| **Banners** | publicado → `success` · draft → `neutral` |
| **Conteúdos** | publicado → `success` · pendente → `warning` · draft → `neutral` · desabilitado → `neutral` (esmaecido) |
| **Eventos (status_efetivo)** | Ingressos a venda → `success` · Esgotado → `info` · Adiado → `warning` · **Expirado** → `neutral` + texto tachado leve · Sucesso → `success` · Cancelado → `danger` |
| **Eventos (enable_efetivo)** | visível → ponto `success` · oculto → ponto `gray-400` |

### 7.6 Navegação lateral (shell admin)

- Largura ~240px, fundo `gray-50`/`background`, borda direita `1px border`.
- Item: `small`, texto `gray-700`, ícone `18px gray-500`, altura `h-9`, radius `--radius`.
- **Hover:** fundo `accent`, texto `foreground`.
- **Ativo:** fundo `brand-subtle`, texto `foreground`, **barra `3px brand`** à esquerda, ícone `brand`.
- Agrupadores: overline `caption` em `muted-foreground`.

### 7.7 Dialog / Modal & Popover/Dropdown

- **Overlay:** `rgb(16 24 40 / 0.40)`. **Dialog:** `card`, radius `8px`, `shadow-lg`, largura `≤ 560px`, padding `24px`.
- Título H3 serif; corpo `body`; rodapé com ações alinhadas à direita (primária à direita).
- **Popover/Dropdown:** `popover`, borda `border`, radius `8px`, `shadow-md`. Item hover `accent`; destrutivo em `danger`.
- `ConfirmDialog` destrutivo: ação confirmar = botão `Destructive`.

### 7.8 Toast (feedback de Server Actions)

- `card`, borda `border`, `shadow-md`, radius `8px`, faixa/ícone à esquerda pelo tipo.
- Tipos: sucesso `success`, erro `danger`, info `info`, aviso `warning`. Texto `small`. Auto-dismiss ~4s; ação opcional em `link`.

### 7.9 Upload de imagem (`ImageUpload`)

- Dropzone: borda **tracejada** `1px gray-400`, fundo `gray-50`, radius `8px`, texto `muted`.
- **Hover/drag-over:** borda `brand`, fundo `brand-subtle`.
- Preview: thumb com borda `border`; ação remover em `ghost`/ícone. Erro de formato/limite em `danger`.

---

## 8. Movimento

- **Durações:** micro-hover `120ms`; transições de superfície/cor `150ms`; entrada de dialog `200ms`.
- **Easing:** `cubic-bezier(0.2, 0, 0, 1)` (saída suave).
- Transicionar apenas `color, background-color, border-color, box-shadow, opacity, transform` — nunca `all`.
- Respeitar `@media (prefers-reduced-motion: reduce)` → desativar transições não essenciais.

---

## 9. Acessibilidade

- **Contraste:** texto normal ≥ 4.5:1, grande ≥ 3:1. `muted-foreground` (`gray-600`) sobre `card`/`background` cumpre AA para `small`+.
- **Foco:** sempre visível via `:focus-visible` (anel `ring`/2px/offset 2px). Nunca `outline: none` sem substituto.
- **Estado não só por cor:** status acompanham rótulo de texto (badge) — não depender apenas do tom.
- **Alvos de toque:** mínimo `36–40px` de altura para controles.
- **Imagens/ícones** informativos com `alt`/`aria-label`; ícones decorativos `aria-hidden`.

---

## 10. Checklist de aplicação

- [ ] `globals.css` com tokens do §4; `tailwind.config.ts` com mapeamento do §5.
- [ ] `Source Serif 4` + `IBM Plex Mono` via `next/font`; `font-serif` no `<body>`.
- [ ] Página em `background` cinza; conteúdo em cards brancos.
- [ ] Variantes de botão do §7.1 nos componentes `components/ui` (shadcn).
- [ ] `:focus-visible` global (§6) aplicado.
- [ ] Badges de status mapeados por domínio (§7.5) no `data-table` e detalhes.
- [ ] Acento `brand` restrito a links, foco, item ativo e CTA único.
- [ ] Contraste AA verificado nos pares de cor.
