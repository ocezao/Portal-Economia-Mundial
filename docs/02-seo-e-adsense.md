# SEO e Google AdSense

## Estratégia SEO

### On-Page SEO

#### Meta Tags Dinâmicas
Cada página pública deve definir `canonical`, OpenGraph e Twitter via `metadata`/`generateMetadata` (Next.js App Router). Rotas internas e rotas finas devem usar `noindex`.

```tsx
// Home
title: "Portal Econômico Mundial - Notícias que movem o mundo"
description: "Portal de notícias especializado em geopolítica, economia global e tecnologia..."

// Artigo
title: "{article.title} - Portal Econômico Mundial"
description: {article.excerpt}
keywords: {article.tags.join(', ')}
```

Boas práticas aplicadas no projeto:
- Canonical por rota (evita duplicação). Ex: paginação usa `?page=` no canonical apenas quando `page > 1`.
- Busca (`/busca`) é `noindex` (página fina de resultados internos), mas mantém OG/Twitter para previews consistentes.
- Rotas internas (admin/app/auth/perfil/etc) são `noindex` via layouts de rota.

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
  "url": "https://seudominio.com",
  "logo": "...",
  "sameAs": ["..."]
}
```

#### Article (Básico)
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

#### Article Avançado (Competitivo)
Para igualar grandes portais (Infomoney, Estadão), adicione:

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Título do Artigo",
  "description": "Resumo/lead do artigo",
  "image": "https://seusite.com/imagem.webp",
  "datePublished": "2026-02-08T10:00:00Z",
  "dateModified": "2026-02-08T12:00:00Z",
  "author": {
    "@type": "Person",
    "name": "Nome do Autor",
    "jobTitle": "Editor de Economia",
    "url": "https://seusite.com/autor/nome-autor",
    "image": "https://seusite.com/foto-autor.webp"
  },
  "reviewedBy": {
    "@type": "Person",
    "name": "Nome do Revisor",
    "jobTitle": "Chefe de Redação"
  },
  "publisher": {
    "@type": "NewsMediaOrganization",
    "name": "Portal Econômico Mundial",
    "logo": "https://seusite.com/logo.webp"
  },
  "articleSection": "Economia",
  "articleBody": "Conteúdo completo do artigo...",
  "wordCount": 1200,
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".article-title", ".article-summary"]
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://seusite.com/noticias/slug-do-artigo"
  }
}
```

**Benefícios dos campos avançados:**
- `reviewedBy`: Mostra "Revisado por" no Google (credibilidade)
- `speakable`: Permite Google Assistant ler o artigo em voz alta
- `articleSection`: Melhora categorização no Google Discover
- `wordCount`: Sinal de qualidade para algoritmo

Observação de coerência:
- Em JSON-LD, URLs e imagens devem ser absolutas (o projeto agora normaliza isso em `src/config/seo.ts`).
- Listagens usam `BreadcrumbList` + `ItemList` (com `item` em `ListItem`) para ficar alinhado ao schema.
- Validar sempre no [Rich Results Test](https://search.google.com/test/rich-results)

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

### Observação importante
Os espaços de anúncio **não devem aparecer vazios**. Inserimos blocos de atenção (briefing, newsletter e enquete) na Home para manter o usuário engajado. Os anúncios devem ser renderizados apenas quando o AdSense estiver ativo.

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
O projeto usa sitemap "portal-grade" com **sitemap index** e partições:
- Index: `/sitemap.xml` (`src/app/sitemap.xml/route.ts`)
- Child sitemaps:
  - `/sitemaps/static.xml` (`src/app/sitemaps/static.xml/route.ts`)
  - `/sitemaps/categories.xml` (`src/app/sitemaps/categories.xml/route.ts`)
  - `/sitemaps/authors.xml` (`src/app/sitemaps/authors.xml/route.ts`)
  - `/sitemaps/news/[page]` (`src/app/sitemaps/news/[page]/route.ts`) (inclui image entries quando houver capa)

### Robots.txt
```
User-agent: *
Allow: /

Sitemap: https://portaleconomicomundial.com/sitemap.xml
```

Implementação real:
- `robots` em Next App Router: `src/app/robots.ts`
- Bloqueia rotas internas e reduz crawl de parâmetros de tracking (`utm_`, `gclid`, `fbclid`, etc).

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
- [ ] `NEXT_PUBLIC_SITE_URL` definido em produção (canonical/sitemap/host corretos)
