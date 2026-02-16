# 🏆 Guia: Tornando o CIN um Modelo para Google AdSense

## 📊 Diagnóstico Atual do Projeto

### ✅ Pontos Fortes (Já Implementados)

| Aspecto | Status | Detalhes |
|---------|--------|----------|
| **SEO Técnico** | ⭐⭐⭐⭐⭐ | Meta tags dinâmicas, JSON-LD completo, sitemap |
| **Performance** | ⭐⭐⭐⭐ | Next.js App Router, lazy loading, otimizações |
| **Conteúdo** | ⭐⭐⭐⭐⭐ | Estrutura jornalística profissional |
| **Analytics** | ⭐⭐⭐⭐⭐ | First-party, LGPD-compliant, sem Google Analytics |
| **Acessibilidade** | ⭐⭐⭐⭐ | Semântica HTML, ARIA labels, contraste |
| **Segurança** | ⭐⭐⭐⭐ | Sanitização, XSS protection, headers |

### ⚠️ Áreas de Melhoria para AdSense

| Aspecto | Prioridade | Impacto AdSense |
|---------|------------|-----------------|
| Core Web Vitals | 🔴 Alta | Afeta ranking e RPM |
| Ad Layout/UX | 🔴 Alta | Afeta viewability e CTR |
| E-E-A-T Signals | 🟡 Média | Afeta qualificação do site |
| Cookie Consent | 🔴 Alta | Obrigatório para AdSense UE/BR |
| Content Policy | 🟡 Média | Conformidade com políticas |

---

## 🎯 Estratégia de Implementação

### FASE 1: Core Web Vitals (Obrigatório)

#### 1.1 LCP (Largest Contentful Paint) < 2.5s

**Problemas atuais identificados:**
- Imagens de capa sem prioridade de carregamento
- Fontes do Google Fonts sem preload
- Hero section bloqueia renderização

**Implementações necessárias:**

```tsx
// src/app/layout.tsx - Adicionar preload de fontes
export const metadata = {
  // ... existing metadata
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Preload fonts críticas */}
        <link 
          rel="preload" 
          href="/fonts/inter-var.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        {/* Preconnect para domínios externos */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// src/components/news/NewsCard.tsx - Otimização de imagens
import Image from 'next/image';

export function NewsCard({ article, priority = false }) {
  return (
    <article>
      <Image
        src={article.coverImage}
        alt={article.title}
        width={800}
        height={450}
        priority={priority} // true para acima do fold
        placeholder="blur"
        blurDataURL="data:image/webp;base64,..." // LQIP
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </article>
  );
}
```

#### 1.2 INP (Interaction to Next Paint) < 200ms

**Problemas:**
- Event handlers pesados no main thread
- Re-renders desnecessários em componentes interativos

**Soluções:**

```tsx
// hooks/useOptimizedInteractions.ts
import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function useOptimizedNavigation() {
  const router = useRouter();
  const prefetchTimeout = useRef<NodeJS.Timeout>();

  const handleNavigation = useCallback((href: string) => {
    // Prefetch na intenção de hover
    if (prefetchTimeout.current) {
      clearTimeout(prefetchTimeout.current);
    }
    
    prefetchTimeout.current = setTimeout(() => {
      router.prefetch(href);
    }, 100);
  }, [router]);

  return { handleNavigation };
}
```

#### 1.3 CLS (Cumulative Layout Shift) < 0.1

**Problemas:**
- Anúncios que carregam sem dimensões definidas
- Imagens sem width/height explícitos
- Fontes que causam FOIT/FOUT

**Solução para AdSense:**

```tsx
// components/ads/AdUnitOptimized.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface AdUnitProps {
  slot: string;
  format: 'auto' | 'rectangle' | 'leaderboard' | 'skyscraper';
  className?: string;
}

const AD_DIMENSIONS = {
  auto: { width: '100%', height: '250px', minHeight: '250px' },
  rectangle: { width: '300px', height: '250px', minHeight: '250px' },
  leaderboard: { width: '728px', height: '90px', minHeight: '90px' },
  skyscraper: { width: '160px', height: '600px', minHeight: '600px' },
};

export function AdUnitOptimized({ slot, format, className }: AdUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const dimensions = AD_DIMENSIONS[format];

  useEffect(() => {
    if (typeof window !== 'undefined' && window.adsbygoogle && adRef.current) {
      try {
        window.adsbygoogle.push({});
        setIsLoaded(true);
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, []);

  return (
    <div 
      className={`ad-container ${className || ''}`}
      style={{
        width: dimensions.width,
        minHeight: dimensions.minHeight,
        backgroundColor: isLoaded ? 'transparent' : '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Placeholder visual enquanto carrega */}
      {!isLoaded && (
        <span className="text-muted text-sm">Publicidade</span>
      )}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ 
          display: 'block',
          width: dimensions.width,
          height: dimensions.height,
        }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format === 'auto' ? 'auto' : undefined}
        data-full-width-responsive={format === 'auto' ? 'true' : undefined}
      />
    </div>
  );
}
```

---

### FASE 2: Estratégia de Anúncios (AdSense)

#### 2.1 Posições Otimizadas (Baseadas em Heatmaps)

```tsx
// src/app/page.tsx - Estrutura com slots de anúncio
import { AdUnitOptimized } from '@/components/ads/AdUnitOptimized';

export default function HomePage() {
  return (
    <main>
      {/* AD 1: Above the fold - Leaderboard */}
      <section className="w-full flex justify-center py-4">
        <AdUnitOptimized 
          slot="1234567890" 
          format="leaderboard"
          className="hidden md:block" 
        />
        <AdUnitOptimized 
          slot="0987654321" 
          format="rectangle"
          className="md:hidden" 
        />
      </section>

      <HeroSection />

      {/* AD 2: Após hero - In-feed */}
      <section className="my-6">
        <AdUnitOptimized slot="2345678901" format="auto" />
      </section>

      <NewsGrid />

      {/* AD 3: Sidebar (desktop) */}
      <aside className="hidden lg:block">
        <AdUnitOptimized slot="3456789012" format="skyscraper" />
      </aside>
    </main>
  );
}
```

#### 2.2 Lazy Loading de Anúncios

```tsx
// components/ads/AdUnitLazy.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

export function AdUnitLazy({ slot, format }) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { 
        rootMargin: '100px', // Pré-carrega 100px antes de entrar na viewport
        threshold: 0 
      }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && !isAdLoaded && typeof window !== 'undefined') {
      // Delay para não competir com conteúdo crítico
      const timer = setTimeout(() => {
        if (window.adsbygoogle) {
          window.adsbygoogle.push({});
          setIsAdLoaded(true);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, isAdLoaded]);

  return (
    <div ref={adRef} className="ad-lazy-container">
      {isVisible ? (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format={format}
        />
      ) : (
        <div style={{ minHeight: '250px', background: '#f5f5f5' }} />
      )}
    </div>
  );
}
```

---

### FASE 3: Sinais E-E-A-T (Experience, Expertise, Authoritativeness, Trust)

#### 3.1 Páginas de Autor Aprimoradas

```tsx
// src/app/autor/[slug]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const author = await getAuthorBySlug(params.slug);
  
  return {
    title: `${author.name} - Jornalista | Cenario Internacional`,
    description: author.bio,
    authors: [{ name: author.name }],
    openGraph: {
      type: 'profile',
      images: [author.photo],
    },
  };
}

// JSON-LD para Author
const authorJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: author.name,
  jobTitle: 'Jornalista',
  worksFor: {
    '@type': 'NewsMediaOrganization',
    name: 'Cenario Internacional',
  },
  alumniOf: author.education?.map(edu => ({
    '@type': 'CollegeOrUniversity',
    name: edu.institution,
  })),
  award: author.awards,
  sameAs: [
    author.social.twitter,
    author.social.linkedin,
  ].filter(Boolean),
};
```

#### 3.2 About Us / Página Editorial

```tsx
// src/app/editorial/page.tsx
export const metadata = {
  title: 'Nossa Editorial - Cenario Internacional',
  description: 'Conheça nossa equipe editorial, princípios jornalísticos e processo de checagem de fatos.',
};

// Schema.org para EditorialPolicy
const editorialJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Política Editorial',
  about: {
    '@type': 'NewsMediaOrganization',
    name: 'Cenario Internacional',
    ethicsPolicy: 'https://portaleconomicomundial.com/etica',
    masthead: 'https://portaleconomicomundial.com/equipe',
    diversityPolicy: 'https://portaleconomicomundial.com/diversidade',
    correctionsPolicy: 'https://portaleconomicomundial.com/correcoes',
  },
};
```

---

### FASE 4: CMP (Consent Management Platform)

#### 4.1 Banner LGPD/GDPR Otimizado

```tsx
// components/consent/CookieBanner.tsx
'use client';

import { useState, useEffect } from 'react';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    advertising: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('pem_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const newPrefs = {
      necessary: true,
      analytics: true,
      advertising: true,
    };
    localStorage.setItem('pem_consent', JSON.stringify({
      ...newPrefs,
      timestamp: new Date().toISOString(),
      version: '1.0',
    }));
    setPreferences(newPrefs);
    setShowBanner(false);
    
    // Disparar evento para AdSense
    if (typeof window !== 'undefined' && window.adsbygoogle) {
      window.adsbygoogle.push({});
    }
  };

  const handleRejectNonEssential = () => {
    const newPrefs = {
      necessary: true,
      analytics: false,
      advertising: false,
    };
    localStorage.setItem('pem_consent', JSON.stringify(newPrefs));
    setPreferences(newPrefs);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      role="dialog"
      aria-label="Configurações de cookies"
      className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm">
          <p className="font-medium">Valorizamos sua privacidade</p>
          <p className="text-muted">
            Usamos cookies para melhorar sua experiência e exibir anúncios relevantes. 
            Consulte nossa <a href="/privacidade" className="underline">Política de Privacidade</a>.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRejectNonEssential}
            className="px-4 py-2 text-sm border rounded"
          >
            Recusar
          </button>
          <button 
            onClick={handleAcceptAll}
            className="px-4 py-2 text-sm bg-primary text-white rounded"
          >
            Aceitar Todos
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### FASE 5: Otimizações de Conteúdo

#### 5.1 Article Schema Aprimorado

```tsx
// src/config/seo.ts - generateArticleJsonLd atualizado
export const generateArticleJsonLd = (article, author) => ({
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: article.title,
  description: article.excerpt,
  image: article.coverImage,
  datePublished: article.publishedAt,
  dateModified: article.updatedAt,
  author: {
    '@type': 'Person',
    name: author.name,
    url: `${siteUrl}/autor/${author.slug}`,
    image: author.photo,
    jobTitle: author.title,
    description: author.bio,
  },
  // NOVO: Credibility signals
  reviewedBy: article.factCheckedBy ? {
    '@type': 'Person',
    name: article.factCheckedBy.name,
    jobTitle: 'Editor de Fato',
  } : undefined,
  // NOVO: Citation
  citation: article.sources?.map(source => ({
    '@type': 'CreativeWork',
    name: source.title,
    url: source.url,
  })),
  // NOVO: Speakable para Google Assistant
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['.article-headline', '.article-summary'],
  },
});
```

#### 5.2 Sistema de "Fact Check" Visual

```tsx
// components/news/FactCheckBadge.tsx
export function FactCheckBadge({ status }) {
  const badges = {
    verified: {
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      label: 'Verificado pela equipe',
    },
    'fact-checked': {
      color: 'bg-blue-100 text-blue-800',
      icon: Shield,
      label: 'Checagem de fatos',
    },
    opinion: {
      color: 'bg-yellow-100 text-yellow-800',
      icon: MessageSquare,
      label: 'Opinião',
    },
  };

  const badge = badges[status];
  if (!badge) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${badge.color}`}>
      <badge.icon className="w-3 h-3" />
      {badge.label}
    </span>
  );
}
```

---

## 📋 Checklist de Implementação

### Sprint 1: Fundamentos (1-2 semanas)
- [ ] Implementar preload de fontes e imagens
- [ ] Adicionar dimensões fixas para anúncios
- [ ] Criar componente CookieBanner LGPD-compliant
- [ ] Configurar lazy loading para ads abaixo do fold

### Sprint 2: E-E-A-T (2-3 semanas)
- [ ] Criar páginas de autor otimizadas
- [ ] Implementar schema ReviewedBy
- [ ] Adicionar badges de verificação
- [ ] Criar página editorial com policies

### Sprint 3: Performance (1-2 semanas)
- [ ] Otimizar LCP (imagens, fonts)
- [ ] Reduzir INP (interactions)
- [ ] Eliminar CLS (ad containers)
- [ ] Implementar service worker para cache

### Sprint 4: Monetização (1 semana)
- [ ] Configurar AdSense account
- [ ] Implementar slots otimizados
- [ ] Configurar lazy loading inteligente
- [ ] Testar viewability em diferentes devices

---

## 🎯 KPIs de Sucesso

| Métrica | Antes | Meta | Ferramenta |
|---------|-------|------|------------|
| LCP | ~3.5s | <2.5s | PageSpeed Insights |
| CLS | ~0.15 | <0.1 | PageSpeed Insights |
| INP | ~300ms | <200ms | Web Vitals Extension |
| Viewability | 40% | >70% | AdSense Reports |
| RPM | $1.50 | $3.00+ | AdSense Reports |
| Bounce Rate | 65% | <50% | Analytics |

---

## 📚 Recursos Adicionais

- [Google AdSense Best Practices](https://support.google.com/adsense/answer/17904)
- [Web Vitals para Publishers](https://web.dev/vitals/)
- [E-E-A-T Guidelines](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [AdSense Policy Center](https://support.google.com/adsense/topic/1261918)

---

**Documento criado em:** 2026-02-06  
**Versão:** 1.0  
**Status:** Implementação recomendada
