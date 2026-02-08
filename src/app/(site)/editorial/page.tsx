/**
 * Página Editorial - E-E-A-T Signals
 * Demonstra expertise, autoridade e confiança da redação
 * Schema.org EditorialPolicy, masthead, ethicsPolicy
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, CheckCircle, FileText, Scale, Shield, Users } from 'lucide-react';

import { JsonLd } from '@/components/seo/JsonLd';
import { APP_CONFIG } from '@/config/app';
import { SEO_CONFIG } from '@/config/seo';
import { getSiteUrl } from '@/lib/siteUrl';
import { getActiveAuthors } from '@/services/authors';

export const metadata: Metadata = {
  title: `Nossa Editorial - ${APP_CONFIG.brand.name}`,
  description: `Conheça nossa equipe editorial, princípios jornalísticos e processo de checagem de fatos. Transparência e credibilidade em ${APP_CONFIG.brand.name}.`,
  alternates: {
    canonical: `${getSiteUrl()}/editorial/`,
  },
  openGraph: {
    type: 'website',
    url: `${getSiteUrl()}/editorial/`,
    title: `Nossa Editorial - ${APP_CONFIG.brand.name}`,
    description: `Conheça nossa equipe editorial e princípios jornalísticos.`,
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
    title: `Nossa Editorial - ${APP_CONFIG.brand.name}`,
    description: `Conheça nossa equipe editorial e princípios jornalísticos.`,
    images: [SEO_CONFIG.og.image],
  },
};

export default async function EditorialPage() {
  const siteUrl = getSiteUrl();
  const authors = await getActiveAuthors();

  // JSON-LD para Editorial (E-E-A-T signal forte)
  const editorialJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Política Editorial',
    url: `${siteUrl}/editorial/`,
    about: {
      '@type': 'NewsMediaOrganization',
      name: APP_CONFIG.brand.name,
      url: siteUrl,
      ethicsPolicy: `${siteUrl}/editorial/#etica`,
      masthead: `${siteUrl}/editorial/#equipe`,
      diversityPolicy: `${siteUrl}/editorial/#diversidade`,
      correctionsPolicy: `${siteUrl}/editorial/#correcoes`,
      verificationFactCheckingPolicy: `${siteUrl}/editorial/#factchecking`,
      actionableFeedbackPolicy: `${siteUrl}/editorial/#contato`,
    },
  };

  return (
    <>
      <JsonLd id="jsonld-editorial" data={editorialJsonLd} />

      {/* Hero */}
      <header className="bg-[#111111] text-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-black mb-6">Nossa Editorial</h1>
          <p className="text-lg md:text-xl text-[#9ca3af] max-w-3xl mx-auto leading-relaxed">
            Compromisso com a verdade, transparência e excelência jornalística.
            Conheça os princípios que guiam nossa cobertura.
          </p>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 py-12">
        {/* Princípios Editoriais */}
        <section id="etica" className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-[#c40000]/10 rounded-lg">
              <Scale className="w-6 h-6 text-[#c40000]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#111111]">
              Princípios Editoriais
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="prose prose-lg max-w-none">
              <h3 className="text-lg font-bold text-[#111111] mb-3">
                Independência Editorial
              </h3>
              <p className="text-[#374151] leading-relaxed">
                O {APP_CONFIG.brand.name} mantém total independência editorial. Nossa cobertura
                não é influenciada por anunciantes, patrocinadores ou interesses comerciais.
                Separar rigorosamente conteúdo editorial de publicidade é um princípio
                fundamental de nossa operação.
              </p>

              <h3 className="text-lg font-bold text-[#111111] mb-3 mt-6">
                Precisão e Correções
              </h3>
              <p className="text-[#374151] leading-relaxed">
                Comprometemo-nos com a precisão factual em todas as nossas publicações.
                Quando erros são identificados, corrigimos prontamente e de forma transparente,
                registrando a alteração no final do artigo com data da correção.
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
              <h3 className="text-lg font-bold text-[#111111] mb-3">
                Imparcialidade
              </h3>
              <p className="text-[#374151] leading-relaxed">
                Apresentamos fatos de forma equilibrada, dando voz a diferentes perspectivas
                quando relevante. Análises e opiniões são claramente identificadas como tal,
                separadas de conteúdo de reportagem.
              </p>

              <h3 className="text-lg font-bold text-[#111111] mb-3 mt-6">
                Transparência de Fontes
              </h3>
              <p className="text-[#374151] leading-relaxed">
                Sempre que possível, citamos fontes primárias e linkamos para documentos
                originais. Informações de fontes anônimas são usadas apenas quando
                estritamente necessário e após verificação rigorosa.
              </p>
            </div>
          </div>
        </section>

        {/* Fact-Checking */}
        <section id="factchecking" className="mb-16 p-8 bg-[#f8fafc] rounded-2xl border border-[#e5e5e5]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#22c55e]/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-[#22c55e]" />
            </div>
            <h2 className="text-2xl font-bold text-[#111111]">
              Processo de Checagem de Fatos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center md:text-left">
              <div className="w-12 h-12 bg-[#c40000] text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 mx-auto md:mx-0">
                1
              </div>
              <h3 className="font-bold text-[#111111] mb-2">Verificação Cruzada</h3>
              <p className="text-sm text-[#6b6b6b]">
                Toda informação é verificada em pelo menos duas fontes independentes
                antes da publicação.
              </p>
            </div>

            <div className="text-center md:text-left">
              <div className="w-12 h-12 bg-[#c40000] text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 mx-auto md:mx-0">
                2
              </div>
              <h3 className="font-bold text-[#111111] mb-2">Fontes Primárias</h3>
              <p className="text-sm text-[#6b6b6b]">
                Priorizamos documentos oficiais, comunicados de instituições e dados
                de fontes primárias.
              </p>
            </div>

            <div className="text-center md:text-left">
              <div className="w-12 h-12 bg-[#c40000] text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 mx-auto md:mx-0">
                3
              </div>
              <h3 className="font-bold text-[#111111] mb-2">Revisão Editorial</h3>
              <p className="text-sm text-[#6b6b6b]">
                Cada artigo passa por revisão de um editor sênior antes da
                publicação final.
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white rounded-lg border border-[#e5e5e5]">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#22c55e] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-[#111111]">Certificação IFCN</h4>
                <p className="text-sm text-[#6b6b6b] mt-1">
                  Nosso Editor de Fato é membro da International Fact-Checking Network (IFCN),
                  seguindo os mais rigorosos padrões de checagem.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Equipe */}
        <section id="equipe" className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-[#c40000]/10 rounded-lg">
              <Users className="w-6 h-6 text-[#c40000]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#111111]">
              Equipe Editorial
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authors.map((author) => (
              <article
                key={author.slug}
                className="p-6 bg-white rounded-xl border border-[#e5e5e5] hover:border-[#c40000] transition-colors group"
              >
                <Link href={`/autor/${author.slug}/`} className="block">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#c40000]/10 to-[#111111]/10 flex items-center justify-center text-xl font-bold text-[#c40000] flex-shrink-0">
                      {author.shortName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#111111] group-hover:text-[#c40000] transition-colors">
                        {author.name}
                      </h3>
                      <p className="text-sm text-[#c40000]">{author.title}</p>
                      <p className="text-sm text-[#6b6b6b] mt-2 line-clamp-2">
                        {author.bio}
                      </p>
                    </div>
                  </div>

                  {author.factChecker && (
                    <div className="mt-4 flex items-center gap-1 text-xs text-[#22c55e]">
                      <CheckCircle className="w-3 h-3" />
                      <span>Verificador Certificado</span>
                    </div>
                  )}
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Política de Correções */}
        <section id="correcoes" className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#c40000]/10 rounded-lg">
              <FileText className="w-6 h-6 text-[#c40000]" />
            </div>
            <h2 className="text-2xl font-bold text-[#111111]">
              Política de Correções
            </h2>
          </div>

          <div className="prose prose-lg max-w-none text-[#374151]">
            <p>
              O {APP_CONFIG.brand.name} está comprometido com a precisão e transparência.
              Quando identificamos erros em nossas publicações, seguimos o seguinte protocolo:
            </p>

            <ul className="space-y-3 mt-4">
              <li className="flex items-start gap-2">
                <span className="text-[#c40000] mt-1">•</span>
                <span>
                  <strong>Correção imediata:</strong> O erro é corrigido no corpo do texto
                  assim que identificado.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#c40000] mt-1">•</span>
                <span>
                  <strong>Nota de correção:</strong> Inserimos uma nota no final do artigo
                  indicando a data e natureza da correção.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#c40000] mt-1">•</span>
                <span>
                  <strong>Transparência:</strong> Em casos de erros significativos,
                  publicamos uma nota de retratação em nossa página de correções.
                </span>
              </li>
            </ul>

            <p className="mt-6">
              Para reportar um erro, entre em contato através do e-mail{' '}
              <a
                href={`mailto:${APP_CONFIG.contact.email}`}
                className="text-[#c40000] hover:underline"
              >
                {APP_CONFIG.contact.email}
              </a>
              .
            </p>
          </div>
        </section>

        {/* Diversidade */}
        <section id="diversidade" className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#c40000]/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-[#c40000]" />
            </div>
            <h2 className="text-2xl font-bold text-[#111111]">
              Compromisso com a Diversidade
            </h2>
          </div>

          <div className="prose prose-lg max-w-none text-[#374151]">
            <p>
              O {APP_CONFIG.brand.name} valoriza a diversidade em nossa equipe e em nossa
              cobertura. Buscamos:
            </p>

            <ul className="space-y-3 mt-4">
              <li className="flex items-start gap-2">
                <span className="text-[#c40000] mt-1">•</span>
                <span>
                  Representação diversificada em nossa equipe editorial
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#c40000] mt-1">•</span>
                <span>
                  Cobertura equilibrada de diferentes regiões e perspectivas
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#c40000] mt-1">•</span>
                <span>
                  Linguagem inclusiva em todas as nossas publicações
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#c40000] mt-1">•</span>
                <span>
                  Amplificação de vozes sub-representadas nas discussões econômicas
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Contato */}
        <section id="contato" className="p-8 bg-[#111111] text-white rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Entre em Contato</h2>
          <p className="text-[#9ca3af] mb-6 max-w-2xl">
            Sugestões, denúncias, correções ou feedback sobre nossa cobertura?
            Estamos sempre abertos a ouvir nossos leitores.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href={`mailto:${APP_CONFIG.contact.email}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#c40000] hover:bg-[#a00000] rounded-lg font-medium transition-colors"
            >
              {APP_CONFIG.contact.email}
            </a>
            <Link
              href="/fale-conosco/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
            >
              Formulário de Contato
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
