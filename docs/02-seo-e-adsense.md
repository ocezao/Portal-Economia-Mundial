# SEO e Google AdSense

## EstratÃ©gia SEO

### On-Page SEO

#### Meta Tags DinÃ¢micas
Cada pÃ¡gina pÃºblica deve definir `canonical`, OpenGraph e Twitter via `metadata`/`generateMetadata` (Next.js App Router). Rotas internas e rotas finas devem usar `noindex`.

```tsx
// Home
title: "Cenario Internacional - NotÃ­cias que movem o mundo"
description: "Portal de notÃ­cias especializado em geopolÃ­tica, economia global e tecnologia..."

// Artigo
title: "{article.title} - Cenario Internacional"
description: {article.excerpt}
keywords: {article.tags.join(', ')}
```

Boas prÃ¡ticas aplicadas no projeto:
- Canonical por rota (evita duplicaÃ§Ã£o). Ex: paginaÃ§Ã£o usa `?page=` no canonical apenas quando `page > 1`.
- Busca (`/busca`) Ã© `noindex` (pÃ¡gina fina de resultados internos), mas mantÃ©m OG/Twitter para previews consistentes.
- Rotas internas (admin/app/auth/perfil/etc) sÃ£o `noindex` via layouts de rota.

#### Open Graph
- `og:title`: TÃ­tulo da pÃ¡gina
- `og:description`: DescriÃ§Ã£o
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
  "name": "Cenario Internacional",
  "url": "https://seudominio.com",
  "logo": "...",
  "sameAs": ["..."]
}
```

#### Article (BÃ¡sico)
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

#### Article AvanÃ§ado (Competitivo)
Para igualar grandes portais (Infomoney, EstadÃ£o), adicione:

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "TÃ­tulo do Artigo",
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
    "jobTitle": "Chefe de RedaÃ§Ã£o"
  },
  "publisher": {
    "@type": "NewsMediaOrganization",
    "name": "Cenario Internacional",
    "logo": "https://seusite.com/logo.webp"
  },
  "articleSection": "Economia",
  "articleBody": "ConteÃºdo completo do artigo...",
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

**BenefÃ­cios dos campos avanÃ§ados:**
- `reviewedBy`: Mostra "Revisado por" no Google (credibilidade)
- `speakable`: Permite Google Assistant ler o artigo em voz alta
- `articleSection`: Melhora categorizaÃ§Ã£o no Google Discover
- `wordCount`: Sinal de qualidade para algoritmo

#### PÃ¡gina de Autor (Person + ProfilePage)
O projeto tem pÃ¡ginas de autor em `/autor/[slug]` com dois JSON-LD:
- `Person`: identidade, funÃ§Ã£o, educaÃ§Ã£o, prÃªmios, redes sociais, worksFor e sinais de expertise.
- `ProfilePage`: sinal explÃ­cito de pÃ¡gina de perfil + artigos recentes (melhora E-E-A-T).

ImplementaÃ§Ã£o:
- FunÃ§Ãµes: `src/config/authors.ts` (`generateAuthorJsonLd`, `generateAuthorProfilePageJsonLd`)
- PÃ¡gina: `src/app/autor/[slug]/page.tsx` (injeta ambos via componente `JsonLd`)

ObservaÃ§Ã£o de coerÃªncia:
- Em JSON-LD, URLs e imagens devem ser absolutas (o projeto agora normaliza isso em `src/config/seo.ts`).
- Listagens usam `BreadcrumbList` + `ItemList` (com `item` em `ListItem`) para ficar alinhado ao schema.
- Validar sempre no [Rich Results Test](https://search.google.com/test/rich-results)

### OtimizaÃ§Ãµes TÃ©cnicas

#### Performance
- Imagens em WebP
- Lazy loading
- Preload de fontes crÃ­ticas
- CompressÃ£o de assets

#### Mobile
- Design responsivo
- Touch targets adequados
- Viewport configurado

#### Acessibilidade
- Skip links
- ARIA labels
- Contraste adequado
- NavegaÃ§Ã£o por teclado

## Google AdSense

### PosiÃ§Ãµes Recomendadas

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

### ObservaÃ§Ã£o importante
Os espaÃ§os de anÃºncio **nÃ£o devem aparecer vazios**. Inserimos blocos de atenÃ§Ã£o (briefing, newsletter e enquete) na Home para manter o usuÃ¡rio engajado. Os anÃºncios devem ser renderizados apenas quando o AdSense estiver ativo.

### ImplementaÃ§Ã£o

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

### PolÃ­ticas do AdSense

âœ… **Permitido**
- AtÃ© 3 anÃºncios por pÃ¡gina
- AnÃºncios em artigos
- AnÃºncios em sidebar

âŒ **Proibido**
- AnÃºncios que imitam conteÃºdo
- Cliques incentivados
- ConteÃºdo sensacionalista excessivo

## Sitemap e Robots

### Sitemap.xml
O projeto usa sitemap "portal-grade" com **sitemap index** e partiÃ§Ãµes:
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

ImplementaÃ§Ã£o real:
- `robots` em Next App Router: `src/app/robots.ts`
- Bloqueia rotas internas e reduz crawl de parÃ¢metros de tracking (`utm_`, `gclid`, `fbclid`, etc).

## MÃ©tricas de Acompanhamento

### Google Analytics 4
- Page views
- Tempo na pÃ¡gina
- Bounce rate
- Scroll depth

### Search Console
- ImpressÃµes
- CTR
- PosiÃ§Ãµes mÃ©dias
- Palavras-chave

## Checklist de SEO

- [ ] Title Ãºnico por pÃ¡gina
- [ ] Meta description (150-160 chars)
- [ ] H1 Ãºnico por pÃ¡gina
- [ ] Imagens com alt text
- [ ] URLs amigÃ¡veis
- [ ] Internal linking
- [ ] Mobile-friendly
- [ ] PageSpeed > 90
- [ ] HTTPS
- [ ] Sitemap.xml
- [ ] Robots.txt
- [ ] JSON-LD
- [ ] `NEXT_PUBLIC_SITE_URL` definido em produÃ§Ã£o (canonical/sitemap/host corretos)
