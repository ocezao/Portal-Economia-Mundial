/**
 * Página Sobre - Next.js App Router
 * Informações sobre o portal
 * @migration Vite → Next.js (App Router)
 * @date 2026-02-06
 */

import type { Metadata } from 'next';
import { APP_CONFIG } from '@/config/app';
import { Award, Users, Globe, TrendingUp } from 'lucide-react';
import { SEO_CONFIG, generateBreadcrumbJsonLd } from '@/config/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: `Sobre - ${APP_CONFIG.brand.name}`,
  description: `Conheça o ${APP_CONFIG.brand.name}, um projeto independente de notícias e análise.`,
  alternates: { canonical: `${getSiteUrl()}/sobre/` },
  openGraph: {
    type: 'website',
    url: `${getSiteUrl()}/sobre/`,
    title: `Sobre - ${APP_CONFIG.brand.name}`,
    description: `Conheça o ${APP_CONFIG.brand.name}, um projeto independente de notícias e análise.`,
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
    title: `Sobre - ${APP_CONFIG.brand.name}`,
    description: `Conheça o ${APP_CONFIG.brand.name}, um projeto independente de notícias e análise.`,
    images: [SEO_CONFIG.og.image],
  },
};

export default function AboutPage() {
  const siteUrl = getSiteUrl();
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Sobre', url: `${siteUrl}/sobre/` },
  ]);

  return (
    <>
      <JsonLd id="jsonld-breadcrumb-sobre" data={breadcrumbJsonLd} />

      {/* Hero */}
      <header className="bg-[#111111] text-white py-20">
        <section className="max-w-[1280px] mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            {APP_CONFIG.brand.name}
          </h1>
          <p className="text-xl md:text-2xl text-[#9ca3af] max-w-2xl mx-auto">
            {APP_CONFIG.brand.tagline}
          </p>
        </section>
      </header>

      {/* Mission */}
      <section className="py-16">
        <section className="max-w-[768px] mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#111111] mb-6">Nossa Missão</h2>
          <p className="text-lg text-[#6b6b6b] leading-relaxed mb-6">
            O {APP_CONFIG.brand.name} é um projeto independente, feito por uma equipe pequena
            que acredita em informação direta e útil. Nosso foco é explicar o que acontece e
            por que isso importa, sem excesso de ruído e sem pressa para publicar qualquer
            coisa que não esteja clara.
          </p>
          <p className="text-lg text-[#6b6b6b] leading-relaxed">
            Não somos uma redação gigante. Somos poucos, e isso nos obriga a escolher bem
            as pautas e a dedicar tempo ao contexto. Preferimos explicar os impactos reais
            de um evento do que apenas repetir manchetes.
          </p>
          <p className="text-lg text-[#6b6b6b] leading-relaxed mt-6">
            O portal se sustenta com independência editorial. Não fazemos publieditorial
            disfarçado e deixamos claro quando um conteúdo tem parceria. A credibilidade
            vem da transparência e do cuidado com o que publicamos.
          </p>
          <p className="text-lg text-[#6b6b6b] leading-relaxed mt-6">
            Se você acompanha o portal, saiba que cada texto passa por leitura humana
            e checagem básica de consistência. Quando erramos, corrigimos e registramos
            a atualização. A confiança do leitor é o nosso ativo principal.
          </p>
        </section>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[#f5f5f5]">
        <section className="max-w-[1280px] mx-auto px-4">
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <li className="text-center">
              <Award className="w-10 h-10 mx-auto mb-4 text-[#c40000]" />
              <p className="text-3xl font-black text-[#111111]">8+</p>
              <p className="text-sm text-[#6b6b6b]">Anos de experiência</p>
            </li>
            <li className="text-center">
              <Users className="w-10 h-10 mx-auto mb-4 text-[#c40000]" />
              <p className="text-3xl font-black text-[#111111]">5</p>
              <p className="text-sm text-[#6b6b6b]">Pessoas no time</p>
            </li>
            <li className="text-center">
              <Globe className="w-10 h-10 mx-auto mb-4 text-[#c40000]" />
              <p className="text-3xl font-black text-[#111111]">30+</p>
              <p className="text-sm text-[#6b6b6b]">Países acompanhados</p>
            </li>
            <li className="text-center">
              <TrendingUp className="w-10 h-10 mx-auto mb-4 text-[#c40000]" />
              <p className="text-3xl font-black text-[#111111]">Diário</p>
              <p className="text-sm text-[#6b6b6b]">Ritmo de atualização</p>
            </li>
          </ul>
        </section>
      </section>

      {/* Team */}
      <section className="py-16">
        <section className="max-w-[1280px] mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#111111] mb-8 text-center">Nossa Equipe</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.values(APP_CONFIG.contact).length > 0 && (
              <>
                <li className="text-center">
                  <figure className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#e5e5e5] flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#6b6b6b]">AS</span>
                  </figure>
                  <h3 className="text-lg font-bold text-[#111111]">Ana Silva</h3>
                  <p className="text-sm text-[#c40000]">Editora Chefe</p>
                  <p className="text-sm text-[#6b6b6b] mt-2">
                    Jornalista com 15 anos de experiência em cobertura econômica internacional.
                  </p>
                </li>
                <li className="text-center">
                  <figure className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#e5e5e5] flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#6b6b6b]">CM</span>
                  </figure>
                  <h3 className="text-lg font-bold text-[#111111]">Carlos Mendes</h3>
                  <p className="text-sm text-[#c40000]">Analista de Mercados</p>
                  <p className="text-sm text-[#6b6b6b] mt-2">
                    Economista e especialista em mercados emergentes.
                  </p>
                </li>
                <li className="text-center">
                  <figure className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#e5e5e5] flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#6b6b6b]">MO</span>
                  </figure>
                  <h3 className="text-lg font-bold text-[#111111]">Maria Oliveira</h3>
                  <p className="text-sm text-[#c40000]">Correspondente Internacional</p>
                  <p className="text-sm text-[#6b6b6b] mt-2">
                    Baseada em Bruxelas, cobre União Europeia e relações transatlânticas.
                  </p>
                </li>
              </>
            )}
          </ul>
        </section>
      </section>

      {/* Contact */}
      <section className="py-16 bg-[#f5f5f5]">
        <section className="max-w-[768px] mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[#111111] mb-6">Entre em Contato</h2>
          <p className="text-lg text-[#6b6b6b] mb-8">
            Tem uma sugestão, denúncia ou quer falar com nossa equipe?
            Estamos sempre abertos a ouvir nossos leitores.
          </p>
          <address className="not-italic space-y-2 text-[#111111]">
            <p>{APP_CONFIG.contact.email}</p>
            <p>{APP_CONFIG.contact.phone}</p>
            <p>{APP_CONFIG.contact.address}</p>
          </address>
        </section>
      </section>
    </>
  );
}
