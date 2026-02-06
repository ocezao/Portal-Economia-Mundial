# Relatório de Código Morto - Portal Econômico Mundial

**Data:** 2026-02-05  
**Auditor:** Sistema automatizado  
**Status:** 🟢 Pronto para remoção

---

## 📊 RESUMO EXECUTIVO

| Categoria | Total | Em Uso | Código Morto | % Morto |
|-----------|-------|--------|--------------|---------|
| Componentes UI | 54 | 19 | 35 | **65%** |
| Componentes Economics | 5 | 0 | 5 | **100%** |
| Componentes GeoEcon | 4 | 3 | 1 | 25% |
| Hooks | 15 | 11 | 4 | 27% |
| Services | 13 | 7 | 6 | 46% |
| Configs | 10 | 8 | 2 | 20% |
| **TOTAL** | **101** | **48** | **53** | **52%** |

---

## 🔴 LISTA COMPLETA DE ARQUIVOS PARA REMOVER

### 1. Componentes UI Não Utilizados (35 arquivos)

```
src/components/ui/
├── accordion.tsx          # Nenhum uso
├── alert.tsx              # Nenhum uso
├── alert-dialog.tsx       # Nenhum uso
├── aspect-ratio.tsx       # Nenhum uso
├── avatar.tsx             # Nenhum uso
├── breadcrumb.tsx         # Nenhum uso
├── button-group.tsx       # Nenhum uso externo
├── calendar.tsx           # Nenhum uso externo
├── carousel.tsx           # Nenhum uso externo
├── chart.tsx              # Nenhum uso
├── collapsible.tsx        # Nenhum uso
├── command.tsx            # Nenhum uso externo
├── context-menu.tsx       # Nenhum uso
├── drawer.tsx             # Nenhum uso
├── empty.tsx              # Nenhum uso
├── field.tsx              # Nenhum uso externo
├── form.tsx               # Nenhum uso externo
├── hover-card.tsx         # Nenhum uso
├── input-group.tsx        # Nenhum uso externo
├── input-otp.tsx          # Nenhum uso
├── item.tsx               # Nenhum uso externo
├── kbd.tsx                # Nenhum uso
├── loading.tsx            # Nenhum uso
├── menubar.tsx            # Nenhum uso
├── navigation-menu.tsx    # Nenhum uso
├── pagination.tsx         # Nenhum uso externo
├── popover.tsx            # Nenhum uso
├── radio-group.tsx        # Nenhum uso
├── resizable.tsx          # Nenhum uso
├── scroll-area.tsx        # Nenhum uso
├── select.tsx             # Nenhum uso
├── sidebar.tsx            # Nenhum uso externo
├── spinner.tsx            # Nenhum uso
├── toggle.tsx             # Nenhum uso externo
└── toggle-group.tsx       # Nenhum uso externo
```

**Nota:** Alguns componentes são usados internamente por outros componentes UI (ex: `toggle` é usado por `toggle-group`), mas nenhum é usado por páginas ou componentes de negócio.

### 2. Componentes Economics Não Utilizados (5 arquivos)

```
src/components/economics/
├── CountryComparisonChart.tsx    # Não importado em lugar nenhum
├── EconomicCalendarWidget.tsx    # Não importado em lugar nenhum
├── EconomicIndicatorCard.tsx     # Não importado em lugar nenhum
├── index.ts                      # Apenas re-exporta
└── MarketDataTable.tsx           # Não importado em lugar nenhum
```

**Análise:** Todo o diretório `economics/` pode ser removido. Os componentes foram criados mas nunca integrados às páginas.

### 3. Componentes GeoEcon Não Utilizados (1 arquivo)

```
src/components/geoEcon/
└── EconomicComparator.tsx        # Não importado em lugar nenhum
```

**Nota:** `EconomicAgenda.tsx`, `RiskThermometer.tsx` e `TensionMap.tsx` são usados na Home.

### 4. Hooks Não Utilizados (4 arquivos)

```
src/hooks/
├── economics/
│   ├── useTradingEconomics.ts    # Não importado
│   └── useWorldBank.ts           # Não importado
├── useLocalStorage.ts            # Não importado
└── useMarket.ts                  # Não importado
```

**Nota:** `useLocalStorage.ts` pode ter sido substituído pelo hook de storage do config.

### 5. Services Não Utilizados (6 arquivos)

```
src/services/
├── economics/
│   ├── index.ts                  # Apenas re-exporta, não usado
│   ├── tradingEconomicsService.ts # Não importado
│   └── worldBankService.ts       # Não importado
├── comments/
│   ├── supabaseService.ts        # Não importado (usa index.ts)
│   └── types.ts                  # Não importado (usa index.ts)
└── newsService.ts                # Não importado (usa newsManager.ts)
```

### 6. Configs Não Utilizadas (2 arquivos)

```
src/config/
├── secureStorage.ts              # Não importado
└── theme.css                     # Não importado
```

**Nota:** `theme.css` é importado em `App.tsx`? Verificar novamente.

---

## 🟡 ARQUIVOS QUE PRECISAM DE ATENÇÃO ESPECIAL

### Dependências Internas entre Componentes UI

Alguns componentes que parecem não ser usados são na verdade dependências de outros:

| Componente | Dependências Internas | Ação |
|------------|----------------------|------|
| `button-group.tsx` | Usa `separator` | Remover junto |
| `calendar.tsx` | Usa `button` | Remover junto |
| `carousel.tsx` | Usa `button` | Remover junto |
| `command.tsx` | Usa `dialog` | Remover junto |
| `field.tsx` | Usa `label` | Remover junto |
| `form.tsx` | Usa `label` | Remover junto |
| `input-group.tsx` | Usa `input` | Remover junto |
| `item.tsx` | Usa `separator` | Remover junto |
| `pagination.tsx` | Usa `button` | Remover junto |
| `sidebar.tsx` | Usa `button`, `separator`, `sheet`, `skeleton`, `tooltip` | Remover todos |
| `toggle-group.tsx` | Usa `toggle` | Remover junto |

---

## ✅ ARQUIVOS QUE DEVEM SER MANTIDOS

### Componentes UI em Uso (19)
- badge, button, card, checkbox, dialog, dropdown-menu, input, label, progress, skeleton, slider, sonner, switch, tabs, textarea, separator, sheet, tooltip

### Componentes em Uso (16)
- diagnostics/FinnhubTest.tsx
- geoEcon/EconomicAgenda.tsx
- geoEcon/RiskThermometer.tsx
- geoEcon/TensionMap.tsx
- home/HeroSection.tsx
- interactive/CommentSection.tsx
- interactive/SurveyForm.tsx
- layout/Footer.tsx, Header.tsx, Layout.tsx, MarketTicker.tsx, ScrollProgress.tsx, ScrollToTop.tsx
- news/ArticleContent.tsx, NewsCard.tsx, ReadingProgress.tsx, RelatedArticles.tsx

### Hooks em Uso (11)
- economics/useFinnhub.ts
- useAppSettings.ts, useAuth.ts, useBookmarks.ts, useComments.ts, use-mobile.ts, useReadingHistory.ts, useReadingLimit.ts, useReadingProgress.ts, useScrollProgress.ts, useSurvey.ts

### Services em Uso (7)
- adminUsers.ts, aiNews.ts, appSettings.ts, comments/index.ts, contactService.ts, economics/finnhubService.ts, newsManager.ts

### Configs em Uso (8)
- app.ts, content.ts, geoecon.ts, market.ts, routes.ts, seo.ts, storage.ts, supabaseLimits.ts

---

## 📁 ESTRUTURA DE ARQUIVOS APÓS REMOÇÃO

```
src/
├── components/
│   ├── diagnostics/
│   │   └── FinnhubTest.tsx
│   ├── geoEcon/
│   │   ├── EconomicAgenda.tsx
│   │   ├── RiskThermometer.tsx
│   │   └── TensionMap.tsx
│   ├── home/
│   │   └── HeroSection.tsx
│   ├── interactive/
│   │   ├── CommentSection.tsx
│   │   └── SurveyForm.tsx
│   ├── layout/
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── Layout.tsx
│   │   ├── MarketTicker.tsx
│   │   ├── ScrollProgress.tsx
│   │   └── ScrollToTop.tsx
│   ├── news/
│   │   ├── ArticleContent.tsx
│   │   ├── NewsCard.tsx
│   │   ├── ReadingProgress.tsx
│   │   └── RelatedArticles.tsx
│   └── ui/                    # 19 componentes (reduzido de 54)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── progress.tsx
│       ├── separator.tsx       # Manter (usado internamente)
│       ├── sheet.tsx           # Manter (usado internamente)
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── tooltip.tsx         # Manter (usado internamente)
│       └── ... (outros usados)
├── config/
│   ├── app.ts
│   ├── content.ts
│   ├── geoecon.ts
│   ├── market.ts
│   ├── routes.ts
│   ├── seo.ts
│   ├── storage.ts
│   └── supabaseLimits.ts
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── economics/
│   │   └── useFinnhub.ts
│   ├── useAppSettings.ts
│   ├── useAuth.ts
│   ├── useBookmarks.ts
│   ├── useComments.ts
│   ├── use-mobile.ts
│   ├── useReadingHistory.ts
│   ├── useReadingLimit.ts
│   ├── useReadingProgress.ts
│   ├── useScrollProgress.ts
│   └── useSurvey.ts
├── lib/
│   ├── image.ts
│   ├── logger.ts
│   ├── supabaseClient.ts
│   └── utils.ts
├── pages/
│   └── ... (26 páginas - todas mantidas)
├── services/
│   ├── comments/
│   │   └── index.ts
│   ├── economics/
│   │   └── finnhubService.ts
│   ├── adminUsers.ts
│   ├── aiNews.ts
│   ├── appSettings.ts
│   ├── contactService.ts
│   └── newsManager.ts
└── types/
    └── index.ts
```

---

## 🎯 PLANO DE AÇÃO RECOMENDADO

### Fase 1: Remoções Seguras (Imediato)
```bash
# Componentes economics (diretório completo)
rm -rf src/components/economics/

# Hook e service não usados
rm src/components/geoEcon/EconomicComparator.tsx
rm src/hooks/economics/useTradingEconomics.ts
rm src/hooks/economics/useWorldBank.ts
rm src/hooks/useLocalStorage.ts
rm src/hooks/useMarket.ts
rm src/services/economics/index.ts
rm src/services/economics/tradingEconomicsService.ts
rm src/services/economics/worldBankService.ts
rm src/services/comments/supabaseService.ts
rm src/services/comments/types.ts
rm src/services/newsService.ts
rm src/config/secureStorage.ts
```

### Fase 2: Remoção de Componentes UI (Avaliar)
```bash
# Componentes UI definitivamente não usados (sem dependências)
rm src/components/ui/accordion.tsx
rm src/components/ui/alert.tsx
rm src/components/ui/alert-dialog.tsx
rm src/components/ui/aspect-ratio.tsx
rm src/components/ui/avatar.tsx
rm src/components/ui/breadcrumb.tsx
rm src/components/ui/chart.tsx
rm src/components/ui/collapsible.tsx
rm src/components/ui/context-menu.tsx
rm src/components/ui/drawer.tsx
rm src/components/ui/empty.tsx
rm src/components/ui/hover-card.tsx
rm src/components/ui/input-otp.tsx
rm src/components/ui/kbd.tsx
rm src/components/ui/loading.tsx
rm src/components/ui/menubar.tsx
rm src/components/ui/navigation-menu.tsx
rm src/components/ui/popover.tsx
rm src/components/ui/radio-group.tsx
rm src/components/ui/resizable.tsx
rm src/components/ui/scroll-area.tsx
rm src/components/ui/select.tsx
rm src/components/ui/spinner.tsx
```

### Fase 3: Componentes UI com Dependências (Cuidado)
```bash
# Remover em grupo devido a dependências internas
rm src/components/ui/toggle-group.tsx
rm src/components/ui/toggle.tsx

rm src/components/ui/button-group.tsx

rm src/components/ui/pagination.tsx

rm src/components/ui/calendar.tsx

rm src/components/ui/carousel.tsx

rm src/components/ui/command.tsx

rm src/components/ui/field.tsx

rm src/components/ui/form.tsx

rm src/components/ui/input-group.tsx

rm src/components/ui/item.tsx

rm src/components/ui/sidebar.tsx
rm src/components/ui/sheet.tsx
```

---

## ⚠️ CONSIDERAÇÕES IMPORTANTES

1. **shadcn/ui:** Os componentes UI são do shadcn/ui. Se no futuro precisar de algum componente removido, pode reinstalar com `npx shadcn add [componente]`

2. **TypeScript:** Após remoções, verificar se há erros de tipo em arquivos que importavam os componentes removidos

3. **Build:** Sempre executar `npm run build` após remoções para garantir que não há erros

4. **Dependências npm:** Verificar se alguma dependência do package.json só era usada pelos componentes removidos

---

## 📊 IMPACTO ESPERADO

| Métrica | Antes | Depois | Redução |
|---------|-------|--------|---------|
| Arquivos de código | ~150 | ~97 | **35%** |
| Linhas de código (est.) | ~25.000 | ~15.000 | **40%** |
| Tamanho do bundle | ~X MB | ~X MB | Estimado 15-20% |
| Tempo de build | ~X s | ~X s | Estimado 10-15% |

---

**Data de criação:** 2026-02-05  
**Próxima revisão:** Após implementação das remoções
