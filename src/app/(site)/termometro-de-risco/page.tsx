/**
 * Termometro de Risco - Pagina explicativa
 */

import { APP_CONFIG } from '@/config/app';
import type { Metadata } from 'next';
import { SEO_CONFIG, generateBreadcrumbJsonLd } from '@/config/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: `Termômetro de Risco - ${APP_CONFIG.brand.name}`,
  description: 'Entenda como o termômetro de risco é calculado e como interpretar os níveis.',
  alternates: { canonical: `${getSiteUrl()}/termometro-de-risco/` },
  openGraph: {
    type: 'website',
    url: `${getSiteUrl()}/termometro-de-risco/`,
    title: `Termômetro de Risco - ${APP_CONFIG.brand.name}`,
    description: 'Entenda como o termômetro de risco é calculado e como interpretar os níveis.',
    siteName: SEO_CONFIG.og.siteName,
    locale: SEO_CONFIG.og.locale,
    images: [
      {
        url: SEO_CONFIG.og.image,
        width: SEO_CONFIG.og.imageWidth,
        height: SEO_CONFIG.og.imageHeight,
        alt: 'Termômetro de Risco',
      },
    ],
  },
  twitter: {
    card: SEO_CONFIG.og.twitterCard,
    site: SEO_CONFIG.og.twitterSite,
    title: `Termômetro de Risco - ${APP_CONFIG.brand.name}`,
    description: 'Entenda como o termômetro de risco é calculado e como interpretar os níveis.',
    images: [SEO_CONFIG.og.image],
  },
};

export default function TermometroDeRiscoPage() {
  const siteUrl = getSiteUrl();
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Termometro de risco', url: `${siteUrl}/termometro-de-risco/` },
  ]);

  return (
    <>
      <JsonLd id="jsonld-breadcrumb-termometro" data={breadcrumbJsonLd} />

      <header className="bg-[#111111] text-white py-16">
        <section className="max-w-[960px] mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-black mb-4">Termômetro de Risco</h1>
          <p className="text-lg text-[#cbd5f5] max-w-2xl">
            Leitura diaria do apetite por risco nos mercados globais.
          </p>
        </section>
      </header>

      <section className="max-w-[960px] mx-auto px-4 py-12 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">O que e</h2>
          <p className="text-base text-[#6b6b6b] leading-relaxed">
            O termometro de risco resume a temperatura do mercado a partir de sinais de
            volatilidade, liquidez e aversao a risco. O indicador mostra quando o ambiente
            fica mais instavel e quais fatores puxam essa mudanca.
          </p>
          <p className="text-base text-[#6b6b6b] leading-relaxed mt-4">
            A ideia e transformar movimentos dispersos em um retrato simples e comparavel,
            sem perder de vista o contexto de curto prazo.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">Como calculamos</h2>
          <ul className="list-disc pl-5 text-[#6b6b6b] space-y-2">
            <li>Comparamos variacoes de índices, moedas, juros e commodities.</li>
            <li>Normalizamos os movimentos para uma escala unica de 0 a 100.</li>
            <li>O numero final reflete a pressao acumulada na janela mais recente.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">Fontes e sinais</h2>
          <ul className="list-disc pl-5 text-[#6b6b6b] space-y-2">
            <li>Mercado: volatilidade implicita, spreads de credito, juros, moedas e commodities.</li>
            <li>Macro: inflação, atividade e comunicados de política monetária.</li>
            <li>Geopolítica: eventos que elevam o prêmio de risco no curto prazo.</li>
          </ul>
          <p className="text-sm text-[#6b6b6b] mt-3">
            Cada indice mostra a última atualização e os fatores que mais contribuírem
            para a leitura do dia.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">Frequência e latencia</h2>
          <ul className="list-disc pl-5 text-[#6b6b6b] space-y-2">
            <li>Indicadores de mercado podem atualizar intradiário com novos fechamentos.</li>
            <li>Indicadores macro seguem ciclos diarios, semanais ou mensais.</li>
            <li>O valor exibido reflete a ultima janela fechada, evitando ruido pontual.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">Fidelidade e limites</h2>
          <ul className="list-disc pl-5 text-[#6b6b6b] space-y-2">
            <li>Usamos fontes primarias quando possivel e cruzamos sinais para reduzir vies.</li>
            <li>Eventos raros podem gerar atrasos ou revisoes posteriores.</li>
            <li>O termômetro indica risco agregado, não substitui análise por ativo.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">Como interpretar</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <li className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#22c55e]">0 - 39</p>
              <p className="text-sm text-[#6b6b6b]">Risco baixo, mercado mais estavel.</p>
            </li>
            <li className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#f59e0b]">40 - 74</p>
              <p className="text-sm text-[#6b6b6b]">Risco moderado, atenção a eventos.</p>
            </li>
            <li className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#ef4444]">75 - 100</p>
              <p className="text-sm text-[#6b6b6b]">Risco alto, possiveis choques.</p>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">Dados tecnicos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#111111]">Escala</p>
              <p className="text-sm text-[#6b6b6b]">0 a 100 com zonas de risco pre-definidas.</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#111111]">Normalizacao</p>
              <p className="text-sm text-[#6b6b6b]">Conversao de variacoes para escala comum.</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#111111]">Janela</p>
              <p className="text-sm text-[#6b6b6b]">Movimento recente com suavizacao de picos.</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#111111]">Composicao</p>
              <p className="text-sm text-[#6b6b6b]">Sinais ponderados por relevancia regional.</p>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}
