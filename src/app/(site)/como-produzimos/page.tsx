/**
 * Página "Como Produzimos Nosso Conteúdo"
 * Demonstra o processo jornalístico e transparência editorial
 * Segue padrões de Transparency dos grandes portais (G1, Globo, VEJA)
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  BookOpen, 
  CheckCircle, 
  FileText, 
  Globe, 
  Search, 
  Shield, 
  TrendingUp,
  Users,
  Mic,
  Calendar,
  AlertTriangle,
  Eye,
  PenTool,
  Clock,
  Award
} from 'lucide-react';

import { JsonLd } from '@/components/seo/JsonLd';
import { APP_CONFIG } from '@/config/app';
import { SEO_CONFIG, generateFaqJsonLd } from '@/config/seo';
import { getSiteUrl } from '@/lib/siteUrl';
import { getActiveAuthors } from '@/services/authors';

export const metadata: Metadata = {
  title: `Como Produzimos Nosso Conteúdo - ${APP_CONFIG.brand.name}`,
  description: `Descubra como nosso time jornalístico pesquisa, escreve e publica notícias. Transparência total no processo de produção de conteúdo de ${APP_CONFIG.brand.name}.`,
  alternates: {
    canonical: `${getSiteUrl()}/como-produzimos/`,
  },
  openGraph: {
    type: 'website',
    url: `${getSiteUrl()}/como-produzimos/`,
    title: `Como Produzimos Nosso Conteúdo - ${APP_CONFIG.brand.name}`,
    description: `Descubra como nosso time jornalístico pesquisa, escreve e publica notícias.`,
    siteName: SEO_CONFIG.og.siteName,
    locale: SEO_CONFIG.og.locale,
    images: [
      {
        url: SEO_CONFIG.og.image,
        width: SEO_CONFIG.og.imageWidth,
        height: SEO_CONFIG.og.imageHeight,
        alt: APP_CONFIG.brand.name,
      },
    ],
  },
  twitter: {
    card: SEO_CONFIG.og.twitterCard,
    site: SEO_CONFIG.og.twitterSite,
    title: `Como Produzimos Nosso Conteúdo - ${APP_CONFIG.brand.name}`,
    description: `Descubra como nosso time jornalístico pesquisa, escreve e publica notícias.`,
    images: [SEO_CONFIG.og.image],
  },
};

export default async function ComoProduzimosPage() {
  const siteUrl = getSiteUrl();
  const authors = await getActiveAuthors();

  const faqItems = [
    {
      question: 'Como vocês escolhem os temas das notícias?',
      answer: 'Nossa equipe editorial monitora fontes confiáveis globally, incluindo agências de notícias, instituições financeiras, governos e especialistas em geopolítica e economia. Priorizamos notícias com impacto direto nos leitores brasileiros.',
    },
    {
      question: 'Como garantem a accuracy das informações?',
      answer: 'Todas as notícias passam por múltiplas etapas de verificação: pesquisa inicial, redação, revisão editorial e, quando aplicável, checagem de fatos por nosso time de verificação. Citamos sempre fontes primárias.',
    },
    {
      question: 'Vocês usam inteligência artificial?',
      answer: 'Utilizamos ferramentas de IA para auxiliar na pesquisa e análise de dados, mas toda a produção de conteúdo é feita por jornalistas humanos. Nenhuma notícia é publicada sem supervisão editorial.',
    },
    {
      question: 'Como lidam com correções?',
      answer: 'Quando identificamos um erro, publicamos uma correção clara e visível no artigo original, com data da correção. Acreditamos em transparência total com nossos leitores.',
    },
    {
      question: 'Qual a diferença entre notícias e análises?',
      answer: 'Notícias são relatos objetivos de fatos recentes. Análises são interpretações e opiniões de nossos especialistas, sempre identificadas claramente como tal.',
    },
  ];

  const processSteps = [
    {
      icon: Search,
      title: '1. Monitoramento',
      description: 'Acompanhamos em tempo real mais de 100 fontes confiáveis globally, incluindo agências de notícias internacionais, bancos centrais, governos e think tanks.',
    },
    {
      icon: FileText,
      title: '2. Seleção',
      description: 'Nossa equipe editorial avalia relevância, impacto no Brasil, credibilidade da fonte e interesse do público para definir a pauta diária.',
    },
    {
      icon: PenTool,
      title: '3. Pesquisa',
      description: 'Jornalistas收集am informações de múltiplas fontes, verificam dados e consultam especialistas quando necessário.',
    },
    {
      icon: Mic,
      title: '4. Produção',
      description: 'Redação objetiva e clara, seguindo padrões jornalísticos internacionais. Priorizamos clareza e precisão sobre sensacionalismo.',
    },
    {
      icon: Eye,
      title: '5. Revisão',
      description: 'Todo conteúdo passa por revisão editorial antes da publicação. Verificamos facts, fontes, grafia e formatação.',
    },
    {
      icon: Clock,
      title: '6. Publicação',
      description: 'Após aprovação editorial, a notícia é publicada com todas as tags SEO e schema.org adequados para maximizar visibilidade.',
    },
  ];

  const values = [
    {
      icon: Shield,
      title: 'Credibilidade',
      description: 'Nunca publicamos informações não verificadas. Priorizamos a verdade sobre a velocidade.',
    },
    {
      icon: Globe,
      title: 'Imparcialidade',
      description: 'Apresentamos múltiplas perspectivas em questões complexas. Nossa opinião é claramente identificada.',
    },
    {
      icon: TrendingUp,
      title: 'Relevância',
      description: 'Focamos em notícias que realmente importam para o leitor brasileiro entender o mundo.',
    },
    {
      icon: Users,
      title: 'Transparência',
      description: 'Somos claros sobre nossas fontes, métodos e possíveis conflitos de interesse.',
    },
  ];

  return (
    <>
      <JsonLd id="jsonld-faq" data={generateFaqJsonLd(faqItems)} />
      
      <div className="bg-[#111111] text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4">
          <nav className="text-sm text-white/70 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white">Como Produzimos</span>
          </nav>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
            Como Produzimos Nosso Conteúdo
          </h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Credibilidade não é acidente. É o resultado de um processo rigoroso, transparente e dedicado à verdade.
          </p>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-4 py-12">
        {/* Introdução */}
        <section className="mb-16">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-[#333] leading-relaxed">
              No <strong>{APP_CONFIG.brand.name}</strong>, acreditamos que nossos leitores merecem saber exatamente 
              como produzimos nosso conteúdo jornalístico. Esta página detalha nosso processo, valores e compromissos 
              com a qualidade e transparência.
            </p>
          </div>
        </section>

        {/* Nosso Processo */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[#111111] mb-8 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-[#c40000]" />
            Nosso Processo Jornalístico
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processSteps.map((step, index) => (
              <div 
                key={index}
                className="p-6 border border-[#e5e5e5] rounded-xl hover:shadow-lg transition-shadow"
              >
                <step.icon className="w-8 h-8 text-[#c40000] mb-4" />
                <h3 className="text-lg font-bold text-[#111111] mb-2">{step.title}</h3>
                <p className="text-sm text-[#666]">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Nossos Valores */}
        <section className="mb-16 bg-[#fafafa] p-8 rounded-xl">
          <h2 className="text-2xl font-bold text-[#111111] mb-8 flex items-center gap-3">
            <Award className="w-7 h-7 text-[#c40000]" />
            Nossos Valores
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <div key={index} className="flex gap-4">
                <value.icon className="w-6 h-6 text-[#c40000] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-[#111111] mb-1">{value.title}</h3>
                  <p className="text-sm text-[#666]">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Equipe Editorial */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[#111111] mb-8 flex items-center gap-3">
            <Users className="w-7 h-7 text-[#c40000]" />
            Nossa Equipe
          </h2>
          
          <p className="text-[#666] mb-6">
            Conteúdo produzido por {authors.length} jornalistas e analistas especializados em economia, geopolítica e tecnologia.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {authors.slice(0, 6).map((author) => (
              <Link 
                key={author.slug}
                href={`/autor/${author.slug}/`}
                className="text-center p-4 border rounded-lg hover:border-[#c40000] transition-colors"
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#f0f0f0] flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#c40000]">
                    {author.name.charAt(0)}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#111111]">{author.name}</p>
                <p className="text-xs text-[#666]">{author.title}</p>
              </Link>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Link 
              href="/editorial/"
              className="inline-flex items-center gap-2 text-[#c40000] hover:underline font-medium"
            >
              Ver equipe completa
              <Globe className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[#111111] mb-8 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-[#c40000]" />
            Perguntas Frequentes
          </h2>
          
          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <details 
                key={index}
                className="group border border-[#e5e5e5] rounded-lg"
              >
                <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                  <span className="font-medium text-[#111111] pr-4">{faq.question}</span>
                  <span className="flex-shrink-0 text-[#c40000] group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-4 pb-4 text-[#666]">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Política de Correções */}
        <section className="mb-16 bg-[#fafafa] p-8 rounded-xl">
          <h2 className="text-2xl font-bold text-[#111111] mb-6 flex items-center gap-3">
            <PenTool className="w-7 h-7 text-[#c40000]" />
            Política de Correções
          </h2>
          
          <div className="space-y-4 text-[#666]">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <p>Quando identificamos um erro, publicamos uma correção no mesmo artigo com a data da correção.</p>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <p>Erores subtis são atualizados silenciosamente com registro de mudança.</p>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <p>Não removemos críticas ou comentários negativos, exceto se violarem nossas políticas de uso.</p>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <p>Para reportar um erro, use nosso formulário de contato ou email direto.</p>
            </div>
          </div>
        </section>

        {/* Contato */}
        <section className="text-center py-8 border-t border-[#e5e5e5]">
          <h2 className="text-xl font-bold text-[#111111] mb-4">Tem dúvidas ou quer contribuir?</h2>
          <p className="text-[#666] mb-6">
            Estamos sempre abertos a feedback e sugestões dos nossos leitores.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/fale-conosco/"
              className="px-6 py-3 bg-[#c40000] text-white font-medium rounded-lg hover:bg-[#a00000] transition-colors"
            >
              Fale Conosco
            </Link>
            <Link 
              href="/editorial/"
              className="px-6 py-3 border border-[#c40000] text-[#c40000] font-medium rounded-lg hover:bg-[#c40000] hover:text-white transition-colors"
            >
              Ver Política Editorial
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
