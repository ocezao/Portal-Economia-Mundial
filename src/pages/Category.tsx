/**
 * Página de Categoria
 * Lista notícias filtradas por categoria
 */

import { useParams } from 'react-router-dom';
import { NewsCard } from '@/components/news/NewsCard';
import { getArticlesByCategory } from '@/services/newsManager';
import { CONTENT_CONFIG } from '@/config/content';
import { APP_CONFIG } from '@/config/app';

export function Category() {
  const { slug } = useParams<{ slug: string }>();
  const category = slug ? CONTENT_CONFIG.categories[slug as keyof typeof CONTENT_CONFIG.categories] : null;
  const articles = slug ? getArticlesByCategory(slug) : [];

  if (!category) {
    return (
      <section className="max-w-[1280px] mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#111111] mb-4">Categoria não encontrada</h1>
        <p className="text-[#6b6b6b]">A categoria que você está procurando não existe.</p>
      </section>
    );
  }

  return (
    <>
      {/* SEO */}
      <title>{category.name} - {APP_CONFIG.brand.name}</title>
      <meta name="description" content={category.description} />

      {/* Hero da Categoria */}
      <header 
        className="py-16 mb-8"
        style={{ backgroundColor: category.color }}
      >
        <section className="max-w-[1280px] mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {category.name}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl">
            {category.description}
          </p>
        </section>
      </header>

      {/* Lista de Artigos */}
      <section className="max-w-[1280px] mx-auto px-4 py-8">
        {articles.length > 0 ? (
          <>
            <p className="text-sm text-[#6b6b6b] mb-6">
              {articles.length} {articles.length === 1 ? 'artigo' : 'artigos'} encontrados
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(article => (
                <li key={article.slug}>
                  <NewsCard article={article} variant="default" />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <section className="text-center py-16">
            <p className="text-[#6b6b6b]">Nenhum artigo encontrado nesta categoria.</p>
          </section>
        )}
      </section>
    </>
  );
}
