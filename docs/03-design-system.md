# Design System - Portal Econômico Mundial

## Filosofia de Design

O design do PEM segue princípios de **jornalismo digital sério**:

- Clareza e legibilidade
- Hierarquia visual forte
- Uso estratégico de cor
- Minimalismo funcional

## Paleta de Cores

### Cores Principais

```css
--color-bg: #000000;        /* Fundo ticker */
--color-surface: #ffffff;    /* Fundo principal */
--color-text: #111111;       /* Texto principal */
--color-muted: #6b6b6b;      /* Texto secundário */
--color-accent: #c40000;     /* Destaque/urgente */
--color-border: #e5e5e5;     /* Bordas */
```

### Cores Derivadas

```css
--color-text-inverse: #ffffff;
--color-surface-hover: #f5f5f5;
--color-accent-hover: #a00000;
--color-accent-light: #ffcccc;
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-error: #ef4444;
```

### Uso de Cores

| Cor | Uso |
|-----|-----|
| Preto (#000) | Ticker de mercado, footer |
| Branco (#fff) | Fundo principal, cards |
| Cinza escuro (#111) | Texto principal, títulos |
| Cinza médio (#6b6b) | Texto secundário, metadados |
| Vermelho (#c40000) | Destaques, breaking news, CTA |

## Tipografia

### Fontes

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-headline: 'Playfair Display', Georgia, serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Escala Tipográfica

| Token | Tamanho | Uso |
|-------|---------|-----|
| text-xs | 0.75rem | Tags, labels |
| text-sm | 0.875rem | Metadados, captions |
| text-base | 1rem | Corpo de texto |
| text-lg | 1.125rem | Lead paragraphs |
| text-xl | 1.25rem | Subtítulos |
| text-2xl | 1.5rem | H3 |
| text-3xl | 1.875rem | H2 |
| text-4xl | 2.25rem | H1 mobile |
| text-5xl | 3rem | H1 desktop |

### Pesos

- **300 (Light)**: Textos longos
- **400 (Regular)**: Corpo de texto
- **500 (Medium)**: Ênfase leve
- **600 (Semibold)**: Subtítulos
- **700 (Bold)**: Títulos
- **900 (Black)**: Logo, display

## Espaçamento

### Sistema de 8px

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

## Componentes

### Botões

#### Primário
```
Background: #c40000
Text: #ffffff
Hover: #a00000
Padding: 0.5rem 1rem
Border-radius: 0.25rem
```

#### Secundário
```
Background: transparent
Border: 1px solid #111111
Text: #111111
Hover: bg #111111, text #ffffff
```

### Cards

```
Background: #ffffff
Border: 1px solid #e5e5e5
Border-radius: 0.5rem
Shadow: none (flat design)
Hover: translateY(-2px), shadow-md
```

### Inputs

```
Background: #ffffff
Border: 1px solid #e5e5e5
Border-radius: 0.25rem
Focus: ring-2 ring-[#c40000]
Placeholder: #6b6b6b
```

## Grid Editorial

### Layout Principal

```
max-width: 1280px
content-width: 768px
padding: 16px (mobile), 24px (desktop)
```

### Grid de Notícias

- **Desktop**: 3 colunas
- **Tablet**: 2 colunas
- **Mobile**: 1 coluna
- **Gap**: 24px

## Animações

### Durações

```css
--duration-fast: 150ms;    /* Hover states */
--duration-normal: 300ms;  /* Transitions */
--duration-slow: 500ms;    /* Page transitions */
```

### Easing

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

### Padrões

| Elemento | Animação |
|----------|----------|
| Cards | translateY(-2px) + shadow |
| Botões | background-color |
| Links | color transition |
| Ticker | translateX (scroll infinito) |

## Responsividade

### Breakpoints

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

### Mobile First

- Base: Mobile
- sm: Tablets pequenos
- md: Tablets
- lg: Desktop
- xl: Desktop grande

## Acessibilidade

### Contraste

- Texto principal: 7:1 (WCAG AAA)
- Texto grande: 4.5:1 (WCAG AA)
- UI components: 3:1 (WCAG AA)

### Focus States

```css
.focus-ring:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Assets

### Imagens

- Formato: WebP (com fallback)
- Lazy loading: Sim
- Aspect ratios: 16:9 (hero), 4:3 (cards), 1:1 (thumbs)

### Ícones

- Biblioteca: Lucide React
- Tamanho padrão: 24px
- Stroke width: 2
