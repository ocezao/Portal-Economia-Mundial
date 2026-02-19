/**
 * Cache Utilities with Tags
 * Uses Next.js unstable_cache for server-side caching
 */

import { unstable_cache } from 'next/cache';
import { revalidateTag as nextRevalidateTag, revalidatePath as nextRevalidatePath } from 'next/cache';

interface CacheOptions {
  revalidate?: number | false;
  tags?: readonly string[];
}

const DEFAULT_REVALIDATE = 60;

export function createCachedFunction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyParts: string[],
  options: CacheOptions = {}
): (...args: TArgs) => Promise<TResult> {
  const { revalidate = DEFAULT_REVALIDATE, tags } = options;
  
  return unstable_cache(
    fn,
    keyParts,
    {
      revalidate,
      tags: tags ? [...tags] : undefined,
    }
  );
}

export const CACHE_TAGS = {
  ARTICLES: 'articles',
  ARTICLES_FEATURED: 'articles-featured',
  ARTICLES_LATEST: 'articles-latest',
  ARTICLES_TRENDING: 'articles-trending',
  ARTICLES_BREAKING: 'articles-breaking',
  CATEGORIES: 'categories',
  TAGS: 'tags',
  AUTHORS: 'authors',
  MARKET_DATA: 'market-data',
  EARNINGS: 'earnings',
} as const;

export const CACHE_REVALIDATE = {
  SHORT: 30,
  DEFAULT: 60,
  MEDIUM: 300,
  LONG: 900,
  HOUR: 3600,
  DAY: 86400,
} as const;

function revalidateTag(tag: string): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (nextRevalidateTag as any)(tag);
}

function revalidatePath(path: string, type?: 'layout' | 'page'): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (nextRevalidatePath as any)(path, type);
}

export async function invalidateArticles(): Promise<void> {
  revalidateTag(CACHE_TAGS.ARTICLES);
  revalidateTag(CACHE_TAGS.ARTICLES_FEATURED);
  revalidateTag(CACHE_TAGS.ARTICLES_LATEST);
  revalidateTag(CACHE_TAGS.ARTICLES_TRENDING);
  revalidateTag(CACHE_TAGS.ARTICLES_BREAKING);
}

export async function invalidateArticle(slug: string): Promise<void> {
  revalidateTag(`article-${slug}`);
  await invalidateArticles();
}

export async function invalidateCategories(): Promise<void> {
  revalidateTag(CACHE_TAGS.CATEGORIES);
}

export async function invalidateTags(): Promise<void> {
  revalidateTag(CACHE_TAGS.TAGS);
}

export async function invalidateMarketData(): Promise<void> {
  revalidateTag(CACHE_TAGS.MARKET_DATA);
}

export async function invalidateEarnings(): Promise<void> {
  revalidateTag(CACHE_TAGS.EARNINGS);
}

export async function invalidateAll(): Promise<void> {
  revalidatePath('/', 'layout');
}

export async function invalidatePath(path: string): Promise<void> {
  revalidatePath(path);
}
