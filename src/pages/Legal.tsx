/**
 * Páginas Legais
 * Privacidade, Termos, Cookies - Versão completa
 */

import { APP_CONFIG } from '@/config/app';
import { ROUTES } from '@/config/routes';
import { Link } from 'react-router-dom';
import { Shield, FileText, Cookie, Info, AlertTriangle, CheckCircle } from 'lucide-react';

// Configuração de conteúdo legal (variabilizado)
const LEGAL_CONTENT = {
  privacy: {
    title: 'Política de Privacidade',
    icon: Shield,
    lastUpdate: '15 de janeiro de 2024',
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
          'LocalStorage: favoritos, histórico, progresso de leitura',
        ],
      },
      {
        id: 'armazenamento',
        title: '2. Armazenamento de Dados',
        alert: {
          type: 'info',
          message: 'IMPORTANTE: Este é um ambiente de demonstração. Todos os dados são armazenados localmente no seu navegador (LocalStorage) e podem ser perdidos ao limpar o cache. Não há servidor backend.',
        },
        content: 'Seus dados permanecem no seu dispositivo e não são transmitidos para servidores externos.',
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
        content: 'Utilizamos apenas cookies essenciais para funcionamento do site e LocalStorage para persistência de dados do usuário.',
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
  },
  terms: {
    title: 'Termos de Uso',
    icon: FileText,
    lastUpdate: '15 de janeiro de 2024',
    sections: [
      {
        id: 'aceitacao',
        title: '1. Aceitação dos Termos',
        content: `Ao acessar e usar o ${APP_CONFIG.brand.name}, você concorda em cumprir estes termos de uso. Se não concordar, por favor, não utilize nossos serviços.`,
      },
      {
        id: 'servico',
        title: '2. Natureza do Serviço',
        alert: {
          type: 'warning',
          message: 'Este é um portal de notícias demonstrativo. Todo o conteúdo é fictício e para fins de teste apenas.',
        },
        content: 'O PEM fornece notícias e análises sobre geopolítica, economia e tecnologia para fins informativos.',
      },
      {
        id: 'conta',
        title: '3. Contas de Usuário',
        items: [
          'Você é responsável por manter sua senha segura',
          'Notifique-nos sobre uso não autorizado',
          'Uma conta por pessoa',
          'Informações verdadeiras no cadastro',
        ],
      },
      {
        id: 'propriedade',
        title: '4. Propriedade Intelectual',
        content: 'Todo o conteúdo é protegido por direitos autorais. Você pode compartilhar links e citar trechos com atribuição.',
      },
      {
        id: 'conduta',
        title: '5. Conduta do Usuário',
        items: [
          'Comentários devem ser respeitosos',
          'Proibido spam e conteúdo ofensivo',
          'Não publique informações falsas',
          'Respeite a privacidade de outros usuários',
        ],
      },
      {
        id: 'limitacao',
        title: '6. Limitação de Responsabilidade',
        content: 'As informações fornecidas não constituem aconselhamento profissional de investimento. Consulte especialistas antes de tomar decisões financeiras.',
      },
      {
        id: 'modificacoes',
        title: '7. Modificações',
        content: 'Reservamos o direito de modificar estes termos. Alterações significativas serão notificadas.',
      },
    ],
  },
  cookies: {
    title: 'Política de Cookies',
    icon: Cookie,
    lastUpdate: '15 de janeiro de 2024',
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
          'Analíticos: entendemos como você usa o site',
          'LocalStorage: dados de usuário (favoritos, histórico)',
        ],
      },
      {
        id: 'localstorage',
        title: 'LocalStorage e SessionStorage',
        alert: {
          type: 'info',
          message: 'Usamos LocalStorage para salvar seus dados localmente. Estes dados não são enviados para servidores.',
        },
        content: 'Armazenamos: favoritos, histórico de leitura, progresso, preferências e comentários.',
      },
      {
        id: 'gerenciamento',
        title: 'Como Gerenciar Cookies',
        content: 'Você pode gerenciar cookies nas configurações do seu navegador. Note que desativar cookies essenciais pode afetar o funcionamento do site.',
      },
      {
        id: 'terceiros',
        title: 'Cookies de Terceiros',
        content: 'Atualmente não utilizamos cookies de terceiros ou rastreamento externo.',
      },
    ],
  },
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
  children 
}: { 
  title: string; 
  icon: React.ElementType; 
  lastUpdate: string; 
  children: React.ReactNode;
}) {
  return (
    <>
      <title>{title} - {APP_CONFIG.brand.name}</title>
      <meta name="description" content={`${title} do ${APP_CONFIG.brand.name}`} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={`${APP_CONFIG.urls.base}/${title.toLowerCase().replace(/ /g, '-')}`} />

      {/* JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: title,
          description: `${title} do ${APP_CONFIG.brand.name}`,
          url: `${APP_CONFIG.urls.base}/${title.toLowerCase().replace(/ /g, '-')}`,
          dateModified: new Date().toISOString(),
        })}
      </script>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-[1280px] mx-auto px-4 pt-4">
        <ol className="flex items-center gap-2 text-sm text-[#6b6b6b]">
          <li><Link to={ROUTES.home} className="hover:text-[#c40000]">Home</Link></li>
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
export function Privacy() {
  const content = LEGAL_CONTENT.privacy;

  return (
    <LegalPageLayout 
      title={content.title} 
      icon={content.icon}
      lastUpdate={content.lastUpdate}
    >
      {content.sections.map((section) => (
        <section key={section.id} className="mb-8">
          <h2 className="text-xl font-semibold text-[#111111] mb-3">{section.title}</h2>
          
          {section.alert && <AlertBox type={section.alert.type as 'info' | 'warning'} message={section.alert.message} />}
          
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

// Página de Termos
export function Terms() {
  const content = LEGAL_CONTENT.terms;

  return (
    <LegalPageLayout 
      title={content.title} 
      icon={content.icon}
      lastUpdate={content.lastUpdate}
    >
      {content.sections.map((section) => (
        <section key={section.id} className="mb-8">
          <h2 className="text-xl font-semibold text-[#111111] mb-3">{section.title}</h2>
          
          {section.alert && <AlertBox type={section.alert.type as 'info' | 'warning'} message={section.alert.message} />}
          
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

// Página de Cookies
export function Cookies() {
  const content = LEGAL_CONTENT.cookies;

  return (
    <LegalPageLayout 
      title={content.title} 
      icon={content.icon}
      lastUpdate={content.lastUpdate}
    >
      {content.sections.map((section) => (
        <section key={section.id} className="mb-8">
          <h2 className="text-xl font-semibold text-[#111111] mb-3">{section.title}</h2>
          
          {section.alert && <AlertBox type={section.alert.type as 'info' | 'warning'} message={section.alert.message} />}
          
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
