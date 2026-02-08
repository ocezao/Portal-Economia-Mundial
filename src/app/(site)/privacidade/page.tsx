/**
 * Página de Política de Privacidade
 * Server Component - Next.js App Router
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_CONFIG } from '@/config/app';
import { ROUTES } from '@/config/routes';
import { Shield, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { SEO_CONFIG, generateBreadcrumbJsonLd } from '@/config/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: `Política de Privacidade | ${APP_CONFIG.brand.name}`,
  description: `Saiba como o ${APP_CONFIG.brand.name} coleta, usa e protege suas informações pessoais.`,
  alternates: { canonical: `${getSiteUrl()}/privacidade/` },
  openGraph: {
    type: 'website',
    url: `${getSiteUrl()}/privacidade/`,
    title: `Política de Privacidade | ${APP_CONFIG.brand.name}`,
    description: `Saiba como o ${APP_CONFIG.brand.name} coleta, usa e protege suas informações pessoais.`,
    siteName: SEO_CONFIG.og.siteName,
    locale: SEO_CONFIG.og.locale,
    images: [
      {
        url: SEO_CONFIG.og.image,
        width: SEO_CONFIG.og.imageWidth,
        height: SEO_CONFIG.og.imageHeight,
        alt: 'Politica de Privacidade',
      },
    ],
  },
  twitter: {
    card: SEO_CONFIG.og.twitterCard,
    site: SEO_CONFIG.og.twitterSite,
    title: `Política de Privacidade | ${APP_CONFIG.brand.name}`,
    description: `Saiba como o ${APP_CONFIG.brand.name} coleta, usa e protege suas informações pessoais.`,
    images: [SEO_CONFIG.og.image],
  },
};

// Configuração de conteúdo - Privacidade
const PRIVACY_CONTENT = {
  title: 'Política de Privacidade',
  icon: Shield,
  lastUpdate: '7 de fevereiro de 2026',
  sections: [
    {
      id: 'intro',
      title: 'Introdução',
      content: `O ${APP_CONFIG.brand.name} (${APP_CONFIG.brand.short}) valoriza a privacidade de seus usuários. Esta política descreve de forma transparente como coletamos, usamos, armazenamos e protegemos suas informações pessoais.`,
    },
    {
      id: 'coleta',
      title: '1. Informações que Coletamos',
      items: [
        'Dados de cadastro: nome, e-mail, preferências',
        'Dados de uso: páginas visitadas, tempo de leitura',
        'Dados de dispositivo: navegador, sistema operacional',
        'Dados de consentimento: preferências de privacidade/cookies',
        'Armazenamento local: favoritos, histórico, progresso de leitura (LocalStorage)',
      ],
    },
    {
      id: 'armazenamento',
      title: '2. Armazenamento de Dados',
      alert: {
        type: 'info' as const,
        message: 'Armazenamos parte das informações no seu navegador (cookies e LocalStorage) e, quando aplicável, também em nossos serviços para oferecer funcionalidades do portal.',
      },
      content: 'Aplicamos medidas técnicas e organizacionais para proteger as informações. Você pode solicitar acesso, correção ou exclusão conforme descrito nesta política.',
    },
    {
      id: 'uso',
      title: '3. Como Usamos suas Informações',
      items: [
        'Personalizar sua experiência de leitura',
        'Salvar seus favoritos e histórico',
        'Exibir progresso de leitura',
        'Enviar newsletters (com consentimento)',
      ],
    },
    {
      id: 'cookies',
      title: '4. Cookies e Tecnologias Similares',
      content: 'Utilizamos cookies essenciais para funcionamento do site e, mediante seu consentimento, cookies/tecnologias de análise e publicidade (por exemplo, Google AdSense). Você pode gerenciar suas preferências a qualquer momento no banner de cookies.',
    },
    {
      id: 'direitos',
      title: '5. Seus Direitos',
      items: [
        'Acessar seus dados armazenados',
        'Solicitar correção de informações',
        'Excluir sua conta e dados',
        'Revogar consentimentos',
      ],
    },
    {
      id: 'seguranca',
      title: '6. Segurança',
      content: 'Implementamos medidas de segurança para proteger seus dados. No entanto, nenhum sistema é 100% seguro. Recomendamos não compartilhar informações sensíveis.',
    },
  ],
};

// Componente de alerta
function AlertBox({ type, message }: { type: 'info' | 'warning'; message: string }) {
  const icons = {
    info: Info,
    warning: AlertTriangle,
  };
  const Icon = icons[type];
  const colors = {
    info: 'bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af]',
    warning: 'bg-[#fffbeb] border-[#fcd34d] text-[#92400e]',
  };

  return (
    <aside className={`p-4 rounded-lg border ${colors[type as keyof typeof colors]} my-4`}>
      <p className="flex items-start gap-2 text-sm">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        {message}
      </p>
    </aside>
  );
}

// Layout padrão para páginas legais
function LegalPageLayout({
  title,
  icon: Icon,
  lastUpdate,
  children,
}: {
  title: string;
  icon: React.ElementType;
  lastUpdate: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-[1280px] mx-auto px-4 pt-4">
        <ol className="flex items-center gap-2 text-sm text-[#6b6b6b]">
          <li><Link href={ROUTES.home} className="hover:text-[#c40000]">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[#111111]" aria-current="page">{title}</li>
        </ol>
      </nav>

      <main className="max-w-[768px] mx-auto px-4 py-8 sm:py-12">
        <header className="mb-8 sm:mb-10">
          <section className="flex items-center gap-3 mb-4">
            <Icon className="w-8 h-8 text-[#c40000]" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111111]">
              {title}
            </h1>
          </section>
          <p className="text-sm text-[#6b6b6b]">
            Última atualização: {lastUpdate}
          </p>
        </header>

        <article className="prose prose-sm sm:prose-base max-w-none text-[#374151]">
          {children}
        </article>

        {/* Contato */}
        <footer className="mt-12 pt-8 border-t border-[#e5e5e5]">
          <h2 className="text-lg font-semibold text-[#111111] mb-3">Dúvidas?</h2>
          <p className="text-sm text-[#6b6b6b] mb-4">
            Se tiver alguma dúvida sobre nossas políticas, entre em contato:
          </p>
          <a
            href={`mailto:${APP_CONFIG.contact.email}`}
            className="inline-flex items-center gap-2 text-[#c40000] hover:underline"
          >
            {APP_CONFIG.contact.email}
          </a>
        </footer>
      </main>
    </>
  );
}

// Página de Privacidade
export default function PrivacyPage() {
  const content = PRIVACY_CONTENT;
  const siteUrl = getSiteUrl();
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Privacidade', url: `${siteUrl}/privacidade/` },
  ]);

  return (
    <LegalPageLayout
      title={content.title}
      icon={content.icon}
      lastUpdate={content.lastUpdate}
    >
      <JsonLd id="jsonld-breadcrumb-privacidade" data={breadcrumbJsonLd} />
      {content.sections.map((section) => (
        <section key={section.id} className="mb-8">
          <h2 className="text-xl font-semibold text-[#111111] mb-3">{section.title}</h2>

          {section.alert && <AlertBox type={section.alert.type} message={section.alert.message} />}

          {section.content && <p className="leading-relaxed">{section.content}</p>}

          {section.items && (
            <ul className="space-y-2 mt-3">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </LegalPageLayout>
  );
}
