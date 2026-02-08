/**
 * Página de Política de Cookies
 * Server Component - Next.js App Router
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_CONFIG } from '@/config/app';
import { ROUTES } from '@/config/routes';
import { Cookie, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { SEO_CONFIG, generateBreadcrumbJsonLd } from '@/config/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: `Política de Cookies | ${APP_CONFIG.brand.name}`,
  description: `Saiba como o ${APP_CONFIG.brand.name} utiliza cookies e tecnologias similares.`,
  alternates: { canonical: `${getSiteUrl()}/cookies/` },
  openGraph: {
    type: 'website',
    url: `${getSiteUrl()}/cookies/`,
    title: `Política de Cookies | ${APP_CONFIG.brand.name}`,
    description: `Saiba como o ${APP_CONFIG.brand.name} utiliza cookies e tecnologias similares.`,
    siteName: SEO_CONFIG.og.siteName,
    locale: SEO_CONFIG.og.locale,
    images: [
      {
        url: SEO_CONFIG.og.image,
        width: SEO_CONFIG.og.imageWidth,
        height: SEO_CONFIG.og.imageHeight,
        alt: 'Politica de Cookies',
      },
    ],
  },
  twitter: {
    card: SEO_CONFIG.og.twitterCard,
    site: SEO_CONFIG.og.twitterSite,
    title: `Política de Cookies | ${APP_CONFIG.brand.name}`,
    description: `Saiba como o ${APP_CONFIG.brand.name} utiliza cookies e tecnologias similares.`,
    images: [SEO_CONFIG.og.image],
  },
};

// Configuração de conteúdo - Cookies
const COOKIES_CONTENT = {
  title: 'Política de Cookies',
  icon: Cookie,
  lastUpdate: '7 de fevereiro de 2026',
  sections: [
    {
      id: 'o-que-sao',
      title: 'O que são Cookies?',
      content: 'Cookies são pequenos arquivos de texto armazenados em seu navegador quando você visita um site. Eles ajudam a lembrar suas preferências e melhorar sua experiência.',
    },
    {
      id: 'tipos',
      title: 'Tipos de Cookies que Utilizamos',
      items: [
        'Essenciais: necessários para funcionamento básico',
        'Preferências: idioma, tamanho de fonte',
        'Analíticos: entendemos como você usa o site (com consentimento)',
        'Publicidade: exibição de anúncios relevantes (com consentimento)',
        'LocalStorage: dados de usuário (favoritos, histórico)',
      ],
    },
    {
      id: 'localstorage',
      title: 'LocalStorage e SessionStorage',
      alert: {
        type: 'info' as const,
        message: 'Usamos LocalStorage para salvar seus dados localmente. Estes dados não são enviados para servidores.',
      },
      content: 'Armazenamos: favoritos, histórico de leitura, progresso e preferências.',
    },
    {
      id: 'gerenciamento',
      title: 'Como Gerenciar Cookies',
      content: 'Você pode gerenciar cookies nas configurações do seu navegador. Note que desativar cookies essenciais pode afetar o funcionamento do site.',
    },
    {
      id: 'terceiros',
      title: 'Cookies de Terceiros',
      content: 'Podemos utilizar cookies/identificadores de terceiros (por exemplo, Google AdSense) para publicidade e medição, sempre conforme suas preferências de consentimento.',
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

// Página de Cookies
export default function CookiesPage() {
  const content = COOKIES_CONTENT;
  const siteUrl = getSiteUrl();
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Cookies', url: `${siteUrl}/cookies/` },
  ]);

  return (
    <LegalPageLayout
      title={content.title}
      icon={content.icon}
      lastUpdate={content.lastUpdate}
    >
      <JsonLd id="jsonld-breadcrumb-cookies" data={breadcrumbJsonLd} />
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
