/**
 * Public author directory (DB-backed with static fallback)
 *
 * Source of truth (when available): local Postgres table `authors`
 * Fallback: `src/config/authors.ts`
 */

import { cache } from 'react';

import type { Author } from '@/config/authors';
import { AUTHORS } from '@/config/authors';
import { queryOne, queryRows } from '@/lib/db';

type AuthorRow = {
  slug: string;
  name: string;
  short_name: string;
  title: string;
  bio: string;
  long_bio: string;
  photo: string;
  email: string;
  social: Record<string, unknown> | null;
  website: string | null;
  location: string | null;
  expertise: string[] | null;
  credentials: string[] | null;
  education: Array<{ institution: string; degree: string; year: string }> | null;
  awards: string[] | null;
  languages: string[] | null;
  joined_at: string | null;
  is_active: boolean | null;
  fact_checker: boolean | null;
  editor: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

const staticAuthors = () => Object.values(AUTHORS);

const mapAuthorRow = (row: AuthorRow): Author => ({
  slug: row.slug,
  name: row.name,
  shortName: row.short_name,
  title: row.title,
  bio: row.bio,
  longBio: row.long_bio,
  photo: row.photo,
  email: row.email,
  social: (row.social ?? {}) as Author['social'],
  website: row.website ?? undefined,
  location: row.location ?? undefined,
  expertise: row.expertise ?? [],
  credentials: row.credentials ?? [],
  education: row.education ?? [],
  awards: row.awards ?? [],
  languages: row.languages ?? [],
  joinedAt: row.joined_at ?? '',
  isActive: row.is_active ?? true,
  factChecker: row.fact_checker ?? false,
  editor: row.editor ?? false,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
});

export const getActiveAuthors = cache(async (): Promise<Author[]> => {
  if (!process.env.DATABASE_URL) {
    return staticAuthors().filter((a) => a.isActive);
  }

  try {
    const data = await queryRows<AuthorRow>(
      `select *
       from authors
       where is_active = true
       order by editor desc, fact_checker desc, name asc`,
    );
    return data.map(mapAuthorRow);
  } catch {
    return staticAuthors().filter((a) => a.isActive);
  }
});

export const getAuthorBySlug = cache(async (slug: string): Promise<Author | null> => {
  if (!slug) return null;

  if (!process.env.DATABASE_URL) {
    return AUTHORS[slug] ?? null;
  }

  try {
    const data = await queryOne<AuthorRow>(
      'select * from authors where slug = $1 limit 1',
      [slug],
    );
    if (!data) {
      return AUTHORS[slug] ?? null;
    }

    const author = mapAuthorRow(data);
    if (!author.isActive) return null;
    return author;
  } catch {
    return AUTHORS[slug] ?? null;
  }
});

export const getPrimaryFactChecker = cache(async (): Promise<Pick<Author, 'slug' | 'name'> | null> => {
  if (!process.env.DATABASE_URL) {
    const fc = staticAuthors().find((a) => a.factChecker && a.isActive);
    return fc ? { slug: fc.slug, name: fc.name } : null;
  }

  try {
    const data = await queryOne<Pick<AuthorRow, 'slug' | 'name'>>(
      `select slug, name
       from authors
       where is_active = true
         and fact_checker = true
       order by joined_at asc nulls last
       limit 1`,
    );
    if (!data) {
      const fc = staticAuthors().find((a) => a.factChecker && a.isActive);
      return fc ? { slug: fc.slug, name: fc.name } : null;
    }

    return { slug: data.slug, name: data.name };
  } catch {
    const fc = staticAuthors().find((a) => a.factChecker && a.isActive);
    return fc ? { slug: fc.slug, name: fc.name } : null;
  }
});
