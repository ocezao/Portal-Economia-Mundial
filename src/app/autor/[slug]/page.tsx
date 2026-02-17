/**
 * Pagina de autor com sinais editoriais e transparencia.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Award,
  BookOpen,
  GraduationCap,
  Globe,
  Mail,
  Linkedin,
  Twitter,
  ShieldCheck,
  ExternalLink,
  MapPin,
  CalendarDays,
} from 'lucide-react';

import { JsonLd } from '@/components/seo/JsonLd';
import { NewsCard } from '@/components/news/NewsCard';
import { APP_CONFIG } from '@/config/app';
import { generateAuthorJsonLd, generateAuthorProfilePageJsonLd } from '@/config/authors';
import { SEO_CONFIG } from '@/config/seo';
import { getSiteUrl } from '@/lib/siteUrl';
import { getAuthorBySlug } from '@/services/authors';
import { getArticlesByAuthor } from '@/services/newsManager';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author) {
    return {
      title: 'Autor nao encontrado',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/autor/${author.slug}/`;

  return {
    title: `${author.name} - ${author.title} | ${APP_CONFIG.brand.name}`,
    description: author.bio,
    authors: [{ name: author.name, url }],
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      url,
      title: `${author.name} - ${author.title}`,
      description: author.bio,
      siteName: SEO_CONFIG.og.siteName,
      locale: SEO_CONFIG.og.locale,
      images: [{ url: `${siteUrl}${author.photo}`, width: 400, height: 400, alt: author.name }],
    },
    twitter: {
      card: 'summary',
      site: SEO_CONFIG.og.twitterSite,
      title: `${author.name} - ${author.title}`,
      description: author.bio,
      images: [`${siteUrl}${author.photo}`],
    },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author || !author.isActive) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const articles = await getArticlesByAuthor(author.slug, 6);

  const authorJsonLd = generateAuthorJsonLd(author, siteUrl);
  const authorProfileJsonLd = generateAuthorProfilePageJsonLd(author, siteUrl, {
    recentArticleUrls: articles.map((article) => `${siteUrl}/noticias/${article.slug}/`),
  });

  return (
    <>
      <JsonLd id="jsonld-author" data={authorJsonLd} />
      <JsonLd id="jsonld-author-profile" data={authorProfileJsonLd} />

      <nav aria-label="Breadcrumb" className="max-w-[1280px] mx-auto px-4 pt-4">
        <ol className="flex items-center gap-2 text-sm text-[#6b6b6b]">
          <li><Link href="/" className="hover:text-[#c40000]">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/editorial/" className="hover:text-[#c40000]">Editorial</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[#111111] truncate" aria-current="page">{author.name}</li>
        </ol>
      </nav>

      <main className="max-w-[1280px] mx-auto px-4 py-8">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <figure className="flex-shrink-0 mx-auto md:mx-0">
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#f5f5f5] overflow-hidden border-4 border-white shadow-lg">
                <Image src={author.photo} alt={`Foto de ${author.name}`} fill sizes="160px" className="object-cover" />
              </div>
            </figure>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-[#111111]">{author.name}</h1>
                {author.factChecker && (
                  <span className="px-2 py-1 bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3" /> Verificador
                  </span>
                )}
                {author.editor && (
                  <span className="px-2 py-1 bg-[#c40000]/10 text-[#c40000] text-xs font-medium rounded-full">Editor</span>
                )}
              </div>

              <p className="text-[#c40000] font-medium mb-4">{author.title}</p>
              <p className="text-[#6b6b6b] leading-relaxed mb-6 max-w-2xl">{author.bio}</p>

              <div className="flex items-center justify-center md:justify-start gap-3">
                {author.website && (
                  <a href={author.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[#f5f5f5] hover:bg-[#111111] hover:text-white transition-colors" aria-label="Website">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {author.social.twitter && (
                  <a href={`https://twitter.com/${author.social.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[#f5f5f5] hover:bg-[#1DA1F2] hover:text-white transition-colors" aria-label="Twitter">
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {author.social.linkedin && (
                  <a href={`https://linkedin.com/in/${author.social.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[#f5f5f5] hover:bg-[#0A66C2] hover:text-white transition-colors" aria-label="LinkedIn">
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                <a href={`mailto:${author.email}`} className="p-2 rounded-full bg-[#f5f5f5] hover:bg-[#c40000] hover:text-white transition-colors" aria-label="Email">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="prose prose-lg max-w-none">
              <h2 className="text-xl font-bold text-[#111111] mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#c40000]" /> Sobre
              </h2>
              <div className="text-[#374151] leading-relaxed whitespace-pre-line">{author.longBio}</div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#111111] mb-4">Areas de Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {author.expertise.map((area) => (
                  <span key={area} className="px-3 py-1.5 bg-[#f5f5f5] text-[#374151] text-sm rounded-full border border-[#e5e5e5]">{area}</span>
                ))}
              </div>
            </section>

            {author.credentials && author.credentials.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-[#111111] mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#c40000]" /> Credenciais e Afiliacoes
                </h2>
                <ul className="space-y-2">
                  {author.credentials.map((credential) => (
                    <li key={credential} className="flex items-start gap-2 text-[#374151]"><span className="text-[#c40000] mt-1">•</span>{credential}</li>
                  ))}
                </ul>
              </section>
            )}

            {author.awards.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-[#111111] mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#c40000]" /> Reconhecimentos
                </h2>
                <ul className="space-y-2">
                  {author.awards.map((award) => (
                    <li key={award} className="flex items-start gap-2 text-[#374151]"><span className="text-[#c40000] mt-1">•</span>{award}</li>
                  ))}
                </ul>
              </section>
            )}

            {articles.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-[#111111] mb-4">Ultimas Publicacoes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {articles.map((article) => (
                    <NewsCard key={article.slug} article={article} variant="compact" />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="p-6 bg-[#f8fafc] rounded-lg border border-[#e5e5e5]">
              <h3 className="font-bold text-[#111111] mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#c40000]" /> Formacao
              </h3>
              <ul className="space-y-4">
                {author.education.map((edu) => (
                  <li key={`${edu.institution}-${edu.degree}`} className="text-sm">
                    <p className="font-medium text-[#111111]">{edu.degree}</p>
                    <p className="text-[#6b6b6b]">{edu.institution}</p>
                    <p className="text-[#9ca3af] text-xs">{edu.year}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="p-6 bg-[#f8fafc] rounded-lg border border-[#e5e5e5]">
              <h3 className="font-bold text-[#111111] mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#c40000]" /> Idiomas
              </h3>
              <div className="flex flex-wrap gap-2">
                {author.languages.map((lang) => (
                  <span key={lang} className="px-2 py-1 bg-white text-[#374151] text-sm rounded border border-[#e5e5e5]">{lang}</span>
                ))}
              </div>
            </section>

            <section className="p-6 bg-[#111111] text-white rounded-lg">
              <h3 className="font-bold mb-2">{APP_CONFIG.brand.short}</h3>
              {author.joinedAt ? (
                <p className="text-sm text-white/70 mb-3">
                  Membro da equipe editorial desde{' '}
                  {new Date(author.joinedAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              ) : null}
              {author.location && (
                <p className="text-sm text-white/70 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {author.location}
                </p>
              )}
              {author.updatedAt && (
                <p className="text-xs text-white/60 mb-4 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Perfil atualizado em {new Date(author.updatedAt).toLocaleDateString('pt-BR')}
                </p>
              )}
              <Link href="/editorial/" className="text-sm text-[#c40000] hover:underline">Conheca nossa equipe →</Link>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
