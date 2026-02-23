/**
 * Hub Page - Página Agregadora de Temas
 * Agrega todas as subcategorias relacionadas em uma página hub
 * Melhora SEO com interlinking e autoridade de tema
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Globe, TrendingUp, Cpu, ArrowRight, Rss } from 'lucide-react';

import { JsonLd } from '@/components/seo/JsonLd';
import { NewsCard } from '@/components/news/NewsCard';
import { CONTENT_CONFIG } from '@/config/content';
import { SEO_CONFIG, generateBreadcrumbJsonLd } from '@/config/seo';
import { ROUTES } from '@/config/routes';
import { getSiteUrl } from '@/lib/siteUrl';
import { getLatestArticles } from '@/services/newsManager';

interface HubPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const HUB_CONFIG: Record<string, {
  name: string;
  description: string;
  color: string;
  icon: React.ElementType;
  categories: string[];
}> = {
  'geopolitica': {
    name: 'Geopolítica',
    description: 'Cobertura completa de relações internacionais, conflitos globais, diplomacia e poder mundial. As últimas notícias sobre summit, tratados e eventos que moldam o cenário geopolítico.',
    color: '#c40000',
    icon: Globe,
    categories: ['geopolitica', 'relacoes-internacionais', 'conflitos', 'comercio-global', 'blocos-economicos'],
  },
  'economia-global': {
    name: 'Economia Global',
    description: 'Análises profundas dos mercados financeiros globais, política monetária, investimentos e indicadores econômicos. Tudo sobre Fed, BCB, juros e economia mundial.',
    color: '#111111',
    icon: TrendingUp,
    categories: ['economia', 'criptomoedas', 'investimentos', 'politica-monetaria', 'mercados-financeiros'],
  },
  'tecnologia': {
    name: 'Tecnologia',
    description: 'Inovação, inteligência artificial, cibersegurança e transformação digital. As últimas tendências em tecnologia que estão mudando o mundo.',
    color: '#6b6b6b',
    icon: Cpu,
    categories: ['tecnologia', 'startups', 'energia'],
  },
};

export async function generateStaticParams() {
  return Object.keys(HUB_CONFIG).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: HubPageProps): Promise<Metadata> {
  const { slug } = await params;
  const hub = HUB_CONFIG[slug];
  
  if (!hub) {
    return {
      title: 'Hub não encontrado',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const hubUrl = `${siteUrl}/hubs/${slug}/`;

  return {
    title: `${hub.name} - Hub de Conteúdo | Cenario Internacional`,
    description: hub.description,
    alternates: { canonical: hubUrl },
    openGraph: {
      type: 'website',
      url: hubUrl,
      title: `${hub.name} - Hub de Conteúdo`,
      description: hub.description,
      siteName: SEO_CONFIG.og.siteName,
      locale: SEO_CONFIG.og.locale,
      images: [
        {
          url: SEO_CONFIG.og.image,
          width: SEO_CONFIG.og.imageWidth,
          height: SEO_CONFIG.og.imageHeight,
          alt: hub.name,
        },
      ],
    },
    twitter: {
      card: SEO_CONFIG.og.twitterCard,
      site: SEO_CONFIG.og.twitterSite,
      title: `${hub.name} - Hub de Conteúdo`,
      description: hub.description,
      images: [SEO_CONFIG.og.image],
    },
    other: {
      'rss:feed': `${siteUrl}/rss.xml`,
    },
  };
}

export default async function HubPage({ params }: HubPageProps) {
  const { slug } = await params;
  const hub = HUB_CONFIG[slug];
  
  if (!hub) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold">Hub não encontrado</h1>
        <Link href="/categorias" className="text-[#c40000] hover:underline">
          Ver todas as categorias
        </Link>
      </div>
    );
  }

  const siteUrl = getSiteUrl();
  const Icon = hub.icon;
  const allArticles = await getLatestArticles(20);
  
  const articlesByCategory = hub.categories.reduce((acc, catSlug) => {
    const categoryArticles = allArticles.filter(a => 
      a.category === catSlug || catSlug.includes(a.category)
    ).slice(0, 4);
    if (categoryArticles.length > 0) {
      const category = CONTENT_CONFIG.categories[catSlug as keyof typeof CONTENT_CONFIG.categories];
      acc.push({
        slug: catSlug,
        name: category?.name || catSlug,
        articles: categoryArticles,
      });
    }
    return acc;
  }, [] as Array<{ slug: string; name: string; articles: typeof allArticles }>);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Categorias', url: `${siteUrl}/categorias/` },
    { name: hub.name, url: `${siteUrl}/hubs/${slug}/` },
  ]);

  return (
    <>
      <JsonLd id="jsonld-breadcrumb-hub" data={breadcrumbJsonLd} />
      
      <div className="bg-[#111111] text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4">
          <nav className="text-sm text-white/70 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/categorias" className="hover:underline">Categorias</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{hub.name}</span>
          </nav>
          
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-xl bg-[#c40000] flex items-center justify-center flex-shrink-0">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
                {hub.name}
              </h1>
              <p className="text-lg text-white/80 max-w-2xl">
                {hub.description}
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-4">
            <a 
              href="/rss.xml"
              className="inline-flex items-center gap-2 text-sm text-[#f7931a] hover:underline"
            >
              <Rss className="w-4 h-4" />
              RSS do Hub
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-4 py-12">
        {/* Categorias do Hub */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-[#111111] mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#c40000] rounded-full"></span>
            Categorias deste Hub
          </h2>
          <div className="flex flex-wrap gap-3">
            {hub.categories.map((catSlug) => {
              const category = CONTENT_CONFIG.categories[catSlug as keyof typeof CONTENT_CONFIG.categories];
              if (!category) return null;
              return (
                <Link
                  key={catSlug}
                  href={ROUTES.categoria(catSlug)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#f6f3ef] rounded-full hover:bg-[#c40000] hover:text-white transition-colors"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
                  {category.name}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Artigos por Categoria */}
        {articlesByCategory.map((categoryGroup) => (
          <section key={categoryGroup.slug} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#111111] flex items-center gap-2">
                <span className="w-1 h-6 bg-[#c40000] rounded-full"></span>
                {categoryGroup.name}
              </h2>
              <Link 
                href={ROUTES.categoria(categoryGroup.slug)}
                className="text-sm text-[#c40000] hover:underline flex items-center gap-1"
              >
                Ver todas
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categoryGroup.articles.map((article) => (
                <NewsCard key={article.slug} article={article} />
              ))}
            </div>
          </section>
        ))}

        {/* Artigos Recentes do Hub */}
        {articlesByCategory.length === 0 && (
          <section className="text-center py-12">
            <p className="text-[#666] mb-4">Em breve: notícias em {hub.name}</p>
            <Link 
              href="/categorias"
              className="inline-flex items-center gap-2 text-[#c40000] hover:underline"
            >
              Ver todas as categorias
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
