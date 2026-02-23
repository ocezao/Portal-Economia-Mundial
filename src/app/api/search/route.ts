import { NextResponse } from 'next/server';
import { getLatestArticles } from '@/services/newsManager';

export const revalidate = 300;

interface SearchIndexItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  publishedAt: string;
  tags: string[];
  coverImage: string;
}

export async function GET() {
  try {
    const articles = await getLatestArticles(500);
    
    const searchIndex: SearchIndexItem[] = articles
      .filter((article) => article)
      .map((article) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt || '',
        content: article.content?.slice(0, 1000) || '',
        category: article.category,
        author: article.author,
        publishedAt: article.publishedAt,
        tags: article.tags || [],
        coverImage: article.coverImage || '',
      }));

    return NextResponse.json(searchIndex, {
      headers: {
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Search index error:', error);
    return NextResponse.json({ error: 'Failed to generate search index' }, { status: 500 });
  }
}
