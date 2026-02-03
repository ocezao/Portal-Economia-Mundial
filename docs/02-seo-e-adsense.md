# SEO e Google AdSense

## Estratégia SEO

### On-Page SEO

#### Meta Tags Dinâmicas
Cada página possui meta tags únicas:

```tsx
// Home
title: "Portal Econômico Mundial - Notícias que movem o mundo"
description: "Portal de notícias especializado em geopolítica, economia global e tecnologia..."

// Artigo
title: "{article.title} - Portal Econômico Mundial"
description: {article.excerpt}
keywords: {article.tags.join(', ')}
```

#### Open Graph
- `og:title`: Título da página
- `og:description`: Descrição
- `og:image`: Imagem de capa (1200x630)
- `og:type`: website | article
- `og:locale`: pt_BR

#### Twitter Cards
- `twitter:card`: summary_large_image
- `twitter:site`: @portalpem

### JSON-LD Structured Data

#### Organization
```json
{
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  "name": "Portal Econômico Mundial",
  "url": "https://portaleconomicomundial.com",
  "logo": "...",
  "sameAs": ["..."]
}
```

#### Article
```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "...",
  "datePublished": "...",
  "dateModified": "...",
  "author": { "@type": "Person", "name": "..." },
  "publisher": { "..." }
}
```

### Otimizações Técnicas

#### Performance
- Imagens em WebP
- Lazy loading
- Preload de fontes críticas
- Compressão de assets

#### Mobile
- Design responsivo
- Touch targets adequados
- Viewport configurado

#### Acessibilidade
- Skip links
- ARIA labels
- Contraste adequado
- Navegação por teclado

## Google AdSense

### Posições Recomendadas

#### 1. Header (Above the Fold)
```tsx
<aside className="ad-container header-ad">
  {/* AdSense code */}
</aside>
```

#### 2. In-Article
```tsx
<article>
  <p>...</p>
  <aside className="ad-container in-article-ad">
    {/* AdSense code */}
  </aside>
  <p>...</p>
</article>
```

#### 3. Sidebar
```tsx
<aside className="sidebar">
  <section className="ad-container sidebar-ad">
    {/* AdSense code */}
  </section>
</aside>
```

### Implementação

1. **Criar conta AdSense**
2. **Adicionar script no index.html**
3. **Criar componente AdUnit**

```tsx
// components/ads/AdUnit.tsx
export function AdUnit({ slot, format }: AdUnitProps) {
  useEffect(() => {
    if (window.adsbygoogle) {
      window.adsbygoogle.push({});
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client="ca-pub-XXXXXXXX"
      data-ad-slot={slot}
      data-ad-format={format}
    />
  );
}
```

### Políticas do AdSense

✅ **Permitido**
- Até 3 anúncios por página
- Anúncios em artigos
- Anúncios em sidebar

❌ **Proibido**
- Anúncios que imitam conteúdo
- Cliques incentivados
- Conteúdo sensacionalista excessivo

## Sitemap e Robots

### Sitemap.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://portaleconomicomundial.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Artigos gerados dinamicamente -->
</urlset>
```

### Robots.txt
```
User-agent: *
Allow: /

Sitemap: https://portaleconomicomundial.com/sitemap.xml
```

## Métricas de Acompanhamento

### Google Analytics 4
- Page views
- Tempo na página
- Bounce rate
- Scroll depth

### Search Console
- Impressões
- CTR
- Posições médias
- Palavras-chave

## Checklist de SEO

- [ ] Title único por página
- [ ] Meta description (150-160 chars)
- [ ] H1 único por página
- [ ] Imagens com alt text
- [ ] URLs amigáveis
- [ ] Internal linking
- [ ] Mobile-friendly
- [ ] PageSpeed > 90
- [ ] HTTPS
- [ ] Sitemap.xml
- [ ] Robots.txt
- [ ] JSON-LD
