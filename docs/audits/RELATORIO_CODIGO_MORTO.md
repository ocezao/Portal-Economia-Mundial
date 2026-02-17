# RelatÃ³rio de CÃ³digo Morto - Cenario Internacional

**Data:** 2026-02-05  
**Auditor:** Sistema automatizado  
**Status:** ðŸŸ¢ Pronto para remoÃ§Ã£o

---

## ðŸ“Š RESUMO EXECUTIVO

| Categoria | Total | Em Uso | CÃ³digo Morto | % Morto |
|-----------|-------|--------|--------------|---------|
| Componentes UI | 54 | 19 | 35 | **65%** |
| Componentes Economics | 5 | 0 | 5 | **100%** |
| Componentes GeoEcon | 4 | 3 | 1 | 25% |
| Hooks | 15 | 11 | 4 | 27% |
| Services | 13 | 7 | 6 | 46% |
| Configs | 10 | 8 | 2 | 20% |
| **TOTAL** | **101** | **48** | **53** | **52%** |

---

## ðŸ”´ LISTA COMPLETA DE ARQUIVOS PARA REMOVER

### 1. Componentes UI NÃ£o Utilizados (35 arquivos)

```
src/components/ui/
â”œâ”€â”€ accordion.tsx          # Nenhum uso
â”œâ”€â”€ alert.tsx              # Nenhum uso
â”œâ”€â”€ alert-dialog.tsx       # Nenhum uso
â”œâ”€â”€ aspect-ratio.tsx       # Nenhum uso
â”œâ”€â”€ avatar.tsx             # Nenhum uso
â”œâ”€â”€ breadcrumb.tsx         # Nenhum uso
â”œâ”€â”€ button-group.tsx       # Nenhum uso externo
â”œâ”€â”€ calendar.tsx           # Nenhum uso externo
â”œâ”€â”€ carousel.tsx           # Nenhum uso externo
â”œâ”€â”€ chart.tsx              # Nenhum uso
â”œâ”€â”€ collapsible.tsx        # Nenhum uso
â”œâ”€â”€ command.tsx            # Nenhum uso externo
â”œâ”€â”€ context-menu.tsx       # Nenhum uso
â”œâ”€â”€ drawer.tsx             # Nenhum uso
â”œâ”€â”€ empty.tsx              # Nenhum uso
â”œâ”€â”€ field.tsx              # Nenhum uso externo
â”œâ”€â”€ form.tsx               # Nenhum uso externo
â”œâ”€â”€ hover-card.tsx         # Nenhum uso
â”œâ”€â”€ input-group.tsx        # Nenhum uso externo
â”œâ”€â”€ input-otp.tsx          # Nenhum uso
â”œâ”€â”€ item.tsx               # Nenhum uso externo
â”œâ”€â”€ kbd.tsx                # Nenhum uso
â”œâ”€â”€ loading.tsx            # Nenhum uso
â”œâ”€â”€ menubar.tsx            # Nenhum uso
â”œâ”€â”€ navigation-menu.tsx    # Nenhum uso
â”œâ”€â”€ pagination.tsx         # Nenhum uso externo
â”œâ”€â”€ popover.tsx            # Nenhum uso
â”œâ”€â”€ radio-group.tsx        # Nenhum uso
â”œâ”€â”€ resizable.tsx          # Nenhum uso
â”œâ”€â”€ scroll-area.tsx        # Nenhum uso
â”œâ”€â”€ select.tsx             # Nenhum uso
â”œâ”€â”€ sidebar.tsx            # Nenhum uso externo
â”œâ”€â”€ spinner.tsx            # Nenhum uso
â”œâ”€â”€ toggle.tsx             # Nenhum uso externo
â””â”€â”€ toggle-group.tsx       # Nenhum uso externo
```

**Nota:** Alguns componentes sÃ£o usados internamente por outros componentes UI (ex: `toggle` Ã© usado por `toggle-group`), mas nenhum Ã© usado por pÃ¡ginas ou componentes de negÃ³cio.

### 2. Componentes Economics NÃ£o Utilizados (5 arquivos)

```
src/components/economics/
â”œâ”€â”€ CountryComparisonChart.tsx    # NÃ£o importado em lugar nenhum
â”œâ”€â”€ EconomicCalendarWidget.tsx    # NÃ£o importado em lugar nenhum
â”œâ”€â”€ EconomicIndicatorCard.tsx     # NÃ£o importado em lugar nenhum
â”œâ”€â”€ index.ts                      # Apenas re-exporta
â””â”€â”€ MarketDataTable.tsx           # NÃ£o importado em lugar nenhum
```

**AnÃ¡lise:** Todo o diretÃ³rio `economics/` pode ser removido. Os componentes foram criados mas nunca integrados Ã s pÃ¡ginas.

### 3. Componentes GeoEcon NÃ£o Utilizados (1 arquivo)

```
src/components/geoEcon/
â””â”€â”€ EconomicComparator.tsx        # NÃ£o importado em lugar nenhum
```

**Nota:** `EconomicAgenda.tsx`, `RiskThermometer.tsx` e `TensionMap.tsx` sÃ£o usados na Home.

### 4. Hooks NÃ£o Utilizados (4 arquivos)

```
src/hooks/
â”œâ”€â”€ economics/
â”‚   â”œâ”€â”€ useTradingEconomics.ts    # NÃ£o importado
â”‚   â””â”€â”€ useWorldBank.ts           # NÃ£o importado
â”œâ”€â”€ useLocalStorage.ts            # NÃ£o importado
â””â”€â”€ useMarket.ts                  # NÃ£o importado
```

**Nota:** `useLocalStorage.ts` pode ter sido substituÃ­do pelo hook de storage do config.

### 5. Services NÃ£o Utilizados (6 arquivos)

```
src/services/
â”œâ”€â”€ economics/
â”‚   â”œâ”€â”€ index.ts                  # Apenas re-exporta, nÃ£o usado
â”‚   â”œâ”€â”€ tradingEconomicsService.ts # NÃ£o importado
â”‚   â””â”€â”€ worldBankService.ts       # NÃ£o importado
â”œâ”€â”€ comments/
â”‚   â”œâ”€â”€ supabaseService.ts        # NÃ£o importado (usa index.ts)
â”‚   â””â”€â”€ types.ts                  # NÃ£o importado (usa index.ts)
â””â”€â”€ newsService.ts                # NÃ£o importado (usa newsManager.ts)
```

### 6. Configs NÃ£o Utilizadas (2 arquivos)

```
src/config/
â”œâ”€â”€ secureStorage.ts              # NÃ£o importado
â””â”€â”€ theme.css                     # NÃ£o importado
```

**Nota:** `theme.css` Ã© importado em `App.tsx`? Verificar novamente.

---

## ðŸŸ¡ ARQUIVOS QUE PRECISAM DE ATENÃ‡ÃƒO ESPECIAL

### DependÃªncias Internas entre Componentes UI

Alguns componentes que parecem nÃ£o ser usados sÃ£o na verdade dependÃªncias de outros:

| Componente | DependÃªncias Internas | AÃ§Ã£o |
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

## âœ… ARQUIVOS QUE DEVEM SER MANTIDOS

### Componentes UI em Uso (19)
- badge, button, card, checkbox, dialog, dropdown-menu, input, label, progress, skeleton, slider, sonner, switch, tabs, textarea, separator, sheet, tooltip

### Componentes em Uso (16)
- diagnostics/FinnhubTest.tsx
- geoEcon/EconomicAgenda.tsx
- geoEcon/RiskThermometer.tsx
- geoEcon/TensionMap.tsx
- home/HeroSection.tsx
- interactive/CommentSection.tsx
- layout/Footer.tsx, Header.tsx, Layout.tsx, MarketTicker.tsx, ScrollProgress.tsx, ScrollToTop.tsx
- news/ArticleContent.tsx, NewsCard.tsx, ReadingProgress.tsx, RelatedArticles.tsx

### Hooks em Uso (11)
- economics/useFinnhub.ts
- useAuth.ts, useBookmarks.ts, useComments.ts, use-mobile.ts, useReadingHistory.ts, useReadingProgress.ts, useScrollProgress.ts

### Services em Uso (7)

### Configs em Uso (8)
- app.ts, content.ts, geoecon.ts, market.ts, routes.ts, seo.ts, storage.ts, supabaseLimits.ts

---

## ðŸ“ ESTRUTURA DE ARQUIVOS APÃ“S REMOÃ‡ÃƒO

```
src/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ diagnostics/
â”‚   â”‚   â””â”€â”€ FinnhubTest.tsx
â”‚   â”œâ”€â”€ geoEcon/
â”‚   â”‚   â”œâ”€â”€ EconomicAgenda.tsx
â”‚   â”‚   â”œâ”€â”€ RiskThermometer.tsx
â”‚   â”‚   â””â”€â”€ TensionMap.tsx
â”‚   â”œâ”€â”€ home/
â”‚   â”‚   â””â”€â”€ HeroSection.tsx
â”‚   â”œâ”€â”€ interactive/
â”‚   â”‚   â”œâ”€â”€ CommentSection.tsx
â”‚   â”œâ”€â”€ layout/
â”‚   â”‚   â”œâ”€â”€ Footer.tsx
â”‚   â”‚   â”œâ”€â”€ Header.tsx
â”‚   â”‚   â”œâ”€â”€ Layout.tsx
â”‚   â”‚   â”œâ”€â”€ MarketTicker.tsx
â”‚   â”‚   â”œâ”€â”€ ScrollProgress.tsx
â”‚   â”‚   â””â”€â”€ ScrollToTop.tsx
â”‚   â”œâ”€â”€ news/
â”‚   â”‚   â”œâ”€â”€ ArticleContent.tsx
â”‚   â”‚   â”œâ”€â”€ NewsCard.tsx
â”‚   â”‚   â”œâ”€â”€ ReadingProgress.tsx
â”‚   â”‚   â””â”€â”€ RelatedArticles.tsx
â”‚   â””â”€â”€ ui/                    # 19 componentes (reduzido de 54)
â”‚       â”œâ”€â”€ badge.tsx
â”‚       â”œâ”€â”€ button.tsx
â”‚       â”œâ”€â”€ card.tsx
â”‚       â”œâ”€â”€ checkbox.tsx
â”‚       â”œâ”€â”€ dialog.tsx
â”‚       â”œâ”€â”€ dropdown-menu.tsx
â”‚       â”œâ”€â”€ input.tsx
â”‚       â”œâ”€â”€ label.tsx
â”‚       â”œâ”€â”€ progress.tsx
â”‚       â”œâ”€â”€ separator.tsx       # Manter (usado internamente)
â”‚       â”œâ”€â”€ sheet.tsx           # Manter (usado internamente)
â”‚       â”œâ”€â”€ skeleton.tsx
â”‚       â”œâ”€â”€ slider.tsx
â”‚       â”œâ”€â”€ sonner.tsx
â”‚       â”œâ”€â”€ switch.tsx
â”‚       â”œâ”€â”€ tabs.tsx
â”‚       â”œâ”€â”€ textarea.tsx
â”‚       â”œâ”€â”€ tooltip.tsx         # Manter (usado internamente)
â”‚       â””â”€â”€ ... (outros usados)
â”œâ”€â”€ config/
â”‚   â”œâ”€â”€ app.ts
â”‚   â”œâ”€â”€ content.ts
â”‚   â”œâ”€â”€ geoecon.ts
â”‚   â”œâ”€â”€ market.ts
â”‚   â”œâ”€â”€ routes.ts
â”‚   â”œâ”€â”€ seo.ts
â”‚   â”œâ”€â”€ storage.ts
â”‚   â””â”€â”€ supabaseLimits.ts
â”œâ”€â”€ contexts/
â”‚   â””â”€â”€ AuthContext.tsx
â”œâ”€â”€ hooks/
â”‚   â”œâ”€â”€ economics/
â”‚   â”‚   â””â”€â”€ useFinnhub.ts
â”‚   â”œâ”€â”€ useAuth.ts
â”‚   â”œâ”€â”€ useBookmarks.ts
â”‚   â”œâ”€â”€ useComments.ts
â”‚   â”œâ”€â”€ use-mobile.ts
â”‚   â”œâ”€â”€ useReadingHistory.ts
â”‚   â”œâ”€â”€ useReadingProgress.ts
â”‚   â”œâ”€â”€ useScrollProgress.ts
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ image.ts
â”‚   â”œâ”€â”€ logger.ts
â”‚   â”œâ”€â”€ supabaseClient.ts
â”‚   â””â”€â”€ utils.ts
â”œâ”€â”€ pages/
â”‚   â””â”€â”€ ... (26 pÃ¡ginas - todas mantidas)
â”œâ”€â”€ services/
â”‚   â”œâ”€â”€ comments/
â”‚   â”‚   â””â”€â”€ index.ts
â”‚   â”œâ”€â”€ economics/
â”‚   â”‚   â””â”€â”€ finnhubService.ts
â”‚   â”œâ”€â”€ adminUsers.ts
â”‚   â”œâ”€â”€ aiNews.ts
â”‚   â”œâ”€â”€ contactService.ts
â”‚   â””â”€â”€ newsManager.ts
â””â”€â”€ types/
    â””â”€â”€ index.ts
```

---

## ðŸŽ¯ PLANO DE AÃ‡ÃƒO RECOMENDADO

### Fase 1: RemoÃ§Ãµes Seguras (Imediato)
```bash
# Componentes economics (diretÃ³rio completo)
rm -rf src/components/economics/

# Hook e service nÃ£o usados
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

### Fase 2: RemoÃ§Ã£o de Componentes UI (Avaliar)
```bash
# Componentes UI definitivamente nÃ£o usados (sem dependÃªncias)
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

### Fase 3: Componentes UI com DependÃªncias (Cuidado)
```bash
# Remover em grupo devido a dependÃªncias internas
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

## âš ï¸ CONSIDERAÃ‡Ã•ES IMPORTANTES

1. **shadcn/ui:** Os componentes UI sÃ£o do shadcn/ui. Se no futuro precisar de algum componente removido, pode reinstalar com `npx shadcn add [componente]`

2. **TypeScript:** ApÃ³s remoÃ§Ãµes, verificar se hÃ¡ erros de tipo em arquivos que importavam os componentes removidos

3. **Build:** Sempre executar `npm run build` apÃ³s remoÃ§Ãµes para garantir que nÃ£o hÃ¡ erros

4. **DependÃªncias npm:** Verificar se alguma dependÃªncia do package.json sÃ³ era usada pelos componentes removidos

---

## ðŸ“Š IMPACTO ESPERADO

| MÃ©trica | Antes | Depois | ReduÃ§Ã£o |
|---------|-------|--------|---------|
| Arquivos de cÃ³digo | ~150 | ~97 | **35%** |
| Linhas de cÃ³digo (est.) | ~25.000 | ~15.000 | **40%** |
| Tamanho do bundle | ~X MB | ~X MB | Estimado 15-20% |
| Tempo de build | ~X s | ~X s | Estimado 10-15% |

---

**Data de criaÃ§Ã£o:** 2026-02-05  
**PrÃ³xima revisÃ£o:** ApÃ³s implementaÃ§Ã£o das remoÃ§Ãµes

