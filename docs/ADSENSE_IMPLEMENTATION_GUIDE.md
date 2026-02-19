# Guia de Implementação - AdSense Otimizado

> Como adicionar os novos blocos de anúncios nas páginas

## 📋 Componentes Criados

### 1. AdAboveFold
**Arquivo:** `src/components/ads/AdAboveFold.tsx`
**Uso:** Topo da home, abaixo do header

```tsx
import { AdAboveFold } from '@/components/ads/AdAboveFold';

// Adicione em src/app/(site)/HomePageClient.tsx
// Logo após o Header ou no início do main

return (
  <>
    <Header />
    <AdAboveFold />  {/* Anúncio acima da dobra */}
    <main>
      {/* resto do conteúdo */}
    </main>
  </>
);
```

### 2. AdSidebar
**Arquivo:** `src/components/ads/AdSidebar.tsx`
**Uso:** Barra lateral direita (desktop only)

```tsx
import { AdSidebar } from '@/components/ads/AdSidebar';

// Adicione em src/app/(site)/HomePageClient.tsx
// Dentro do layout com grid

<div className="flex gap-6">
  <main className="flex-1">
    {/* conteúdo principal */}
  </main>
  <AdSidebar />  {/* Aparece apenas em lg+ */}
</div>
```

### 3. AdFeed
**Arquivo:** `src/components/ads/AdFeed.tsx`
**Uso:** Entre artigos na listagem

```tsx
import { AdFeed } from '@/components/ads/AdFeed';

// Adicione a cada 3-4 artigos na listagem
// Exemplo em src/app/(site)/HomePageClient.tsx

{articles.map((article, index) => (
  <>
    <ArticleCard key={article.id} article={article} />
    {(index + 1) % 3 === 0 && <AdFeed className="my-6" />}
  </>
))}
```

### 4. AdMobileSticky
**Arquivo:** `src/components/ads/AdMobileSticky.tsx`
**Uso:** Fixo no rodapé (mobile only)

```tsx
import { AdMobileSticky } from '@/components/ads/AdMobileSticky';

// Adicione em src/app/(site)/layout.tsx
// No final, antes do fechamento do body

return (
  <>
    {/* conteúdo */}
    <CookieBanner />
    <AdMobileSticky />  {/* Apenas mobile */}
  </>
);
```

## 🔧 Configuração .env

Adicione no seu `.env.local` na VPS:

```bash
# AdSense Client ID
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-6096980902806551

# Slots existentes
NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE=1577639969

# Novos slots para maximizar receita
NEXT_PUBLIC_ADSENSE_SLOT_HOME_ABOVE_FOLD=5551113379
NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR=5551113379
NEXT_PUBLIC_ADSENSE_SLOT_FEED_INLINE=9394590232
NEXT_PUBLIC_ADSENSE_SLOT_MOBILE_STICKY=2330053669
NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_INLINE=1577639969
NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_BOTTOM=1577639969
```

## 📊 Posições Recomendadas

### HomePageClient.tsx
```tsx
// Estrutura sugerida:
<>
  <Header />
  <AdAboveFold />                    {/* Banner topo */}
  <div className="flex gap-6 max-w-[1280px] mx-auto">
    <main className="flex-1">
      <BreakingNews />
      <FeaturedArticles />
      
      {/* Lista de artigos com anúncios entre eles */}
      {latest.map((article, idx) => (
        <>
          <ArticleCard article={article} />
          {(idx + 1) % 3 === 0 && <AdFeed className="my-6" />}
        </>
      ))}
    </main>
    
    <aside className="hidden lg:block">
      <AdSidebar />                    {/* Sidebar sticky */}
      <TrendingSidebar />
    </aside>
  </div>
  <Footer />
  <AdMobileSticky />                  {/* Rodapé mobile */}
</>
```

## ⚠️ Dicas Importantes

1. **Não sobrecarregue:** Máximo 3-4 anúncios visíveis ao mesmo tempo
2. **Respeite o CLS:** Os componentes têm dimensões fixas para evitar layout shift
3. **LGPD:** Todos respeitam o consentimento do usuário
4. **Mobile:** AdMobileSticky só aparece em telas < 1024px
5. **Performance:** Lazy loading ativado por padrão

## 📈 Expectativa de Receita

Com estas posições, você pode esperar:
- **RPM (receita por 1000 views):** $2-5 (nicho notícias)
- **CTR médio:** 1-3%
- **Aumento estimado:** +60-80% em relação ao layout anterior

## 🚀 Deploy

Após modificar os arquivos:

```bash
git add .
git commit -m "feat: adicionar novos blocos de anúncios AdSense"
git push origin main

# Na VPS
cd /var/www/pem
git pull origin main
docker compose build web
docker compose up -d web
```
