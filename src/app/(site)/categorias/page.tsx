/**
 * Página Todas as Categorias - Next.js App Router
 * Lista de todas as categorias disponíveis
 * @migration Vite → Next.js (App Router)
 * @date 2026-02-06
 * @server-component pode ser SSR, usa next/link
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Grid3X3, ArrowRight, TrendingUp, Globe, Cpu, BarChart3, Zap, Shield, Banknote, Ship, FileText } from 'lucide-react';
import { CATEGORIES, ALL_CATEGORIES, ROUTES } from '@/config/routes';
import { SEO_CONFIG, generateBreadcrumbJsonLd, generateItemListJsonLd } from '@/config/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: 'Todas as Categorias - Cenario Internacional',
  description: 'Explore nosso conteúdo organizado por temas. Escolha uma categoria e mergulhe nas notícias mais relevantes sobre economia, geopolítica e mercados.',
  alternates: { canonical: `${getSiteUrl()}/categorias/` },
  openGraph: {
    type: 'website',
    url: `${getSiteUrl()}/categorias/`,
    title: 'Todas as Categorias - Cenario Internacional',
    description: 'Explore nosso conteúdo organizado por temas.',
    siteName: SEO_CONFIG.og.siteName,
    locale: SEO_CONFIG.og.locale,
    images: [
      {
        url: SEO_CONFIG.og.image,
        width: SEO_CONFIG.og.imageWidth,
        height: SEO_CONFIG.og.imageHeight,
        alt: 'Categorias',
      },
    ],
  },
  twitter: {
    card: SEO_CONFIG.og.twitterCard,
    site: SEO_CONFIG.og.twitterSite,
    title: 'Todas as Categorias - Cenario Internacional',
    description: 'Explore nosso conteúdo organizado por temas.',
    images: [SEO_CONFIG.og.image],
  },
};

// Mapeamento de ícones por categoria
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'geopolitica': Globe,
  'economia': TrendingUp,
  'tecnologia': Cpu,
  'mercados': BarChart3,
  'energia': Zap,
  'macroeconomia': Banknote,
  'moedas': Banknote,
  'comercio-global': Ship,
  'defesa': Shield,
  'analises': FileText,
};

// Categorias principais com descrições detalhadas
const MAIN_CATEGORIES = [
  {
    ...CATEGORIES[0], // Geopolítica
    icon: Globe,
    articleCount: 1240,
    description: 'Relações internacionais, conflitos globais, diplomacia e análises estratégicas do cenário mundial.',
  },
  {
    ...CATEGORIES[1], // Economia
    icon: TrendingUp,
    articleCount: 2150,
    description: 'Indicadores econômicos, políticas monetárias, crescimento global e análises de mercado.',
  },
  {
    ...CATEGORIES[2], // Tecnologia
    icon: Cpu,
    articleCount: 980,
    description: 'Inovação tecnológica, transformação digital, inteligência artificial e startups.',
  },
  {
    ...CATEGORIES[3], // Mercados
    icon: BarChart3,
    articleCount: 1680,
    description: 'Bolsa de valores, ações, commodities e análises de investimentos.',
  },
  {
    ...CATEGORIES[4], // Energia
    icon: Zap,
    articleCount: 720,
    description: 'Petróleo, gás natural, energias renováveis e transição energética global.',
  },
];

// Subcategorias
const SUB_CATEGORIES = ALL_CATEGORIES.filter(cat => 
  !MAIN_CATEGORIES.some(main => main.slug === cat.slug)
);

export default function TodasCategoriasPage() {
  const siteUrl = getSiteUrl();
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Categorias', url: `${siteUrl}/categorias/` },
  ]);

  const listJsonLd = generateItemListJsonLd(
    ALL_CATEGORIES.map((c) => ({ name: c.name, url: `${siteUrl}${ROUTES.categoria(c.slug)}/` })),
  );

  return (
    <>
      <JsonLd id="jsonld-breadcrumb-categorias" data={breadcrumbJsonLd} />
      <JsonLd id="jsonld-itemlist-categorias" data={listJsonLd} />

      <section className="min-h-screen bg-white">
      {/* Header da página */}
      <header className="border-b border-[#e6e1d8] bg-[#f6f3ef]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#c40000] flex items-center justify-center">
              <Grid3X3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#111111] font-headline">
              Todas as Categorias
            </h1>
          </div>
          <p className="text-lg text-[#6b6b6b] max-w-2xl">
            Explore nosso conteúdo organizado por temas. Escolha uma categoria e mergulhe nas notícias mais relevantes sobre economia, geopolítica e mercados.
          </p>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Categorias Principais */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-[#111111] mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#c40000] rounded-full"></span>
            Categorias Principais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MAIN_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={ROUTES.categoria(cat.slug)}
                  className="group block p-6 bg-white border border-[#e6e1d8] rounded-xl hover:border-[#c40000] hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${cat.color}15` }}
                    >
                      <Icon className="w-7 h-7" style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-[#111111] group-hover:text-[#c40000] transition-colors">
                          {cat.name}
                        </h3>
                        <ArrowRight className="w-5 h-5 text-[#6b6b6b] group-hover:text-[#c40000] group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-sm text-[#6b6b6b] mb-3 line-clamp-2">
                        {cat.description}
                      </p>
                      <span className="text-xs font-medium text-[#6b6b6b] bg-[#f6f3ef] px-2 py-1 rounded-full">
                        {cat.articleCount.toLocaleString()} artigos
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Subcategorias */}
        <section>
          <h2 className="text-xl font-bold text-[#111111] mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#6b6b6b] rounded-full"></span>
            Subcategorias
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {SUB_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] || FileText;
              return (
                <Link
                  key={cat.slug}
                  href={ROUTES.categoria(cat.slug)}
                  className="group flex items-center gap-3 p-4 bg-[#f6f3ef] rounded-xl hover:bg-[#c40000] transition-all duration-300"
                >
                  <Icon className="w-5 h-5 text-[#6b6b6b] group-hover:text-white transition-colors" />
                  <span className="font-medium text-[#111111] group-hover:text-white transition-colors">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
      </section>
    </>
  );
}
