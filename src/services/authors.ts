/**
 * Public author directory (DB-backed with static fallback)
 */

import { cache } from 'react';

import type { Author } from '@/config/authors';
import { AUTHORS } from '@/config/authors';
import { queryOne, queryRows } from '@/lib/db';

type AuthorRow = {
  slug: string;
  name: string;
  short_name: string | null;
  title: string | null;
  bio: string | null;
  long_bio: string | null;
  photo: string | null;
  email: string | null;
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
  shortName: row.short_name ?? row.name,
  title: row.title ?? '',
  bio: row.bio ?? '',
  longBio: row.long_bio ?? '',
  photo: row.photo ?? '',
  email: row.email ?? '',
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
  try {
    const rows = await queryRows<AuthorRow>(
      `select *
       from public.authors
       where is_active = true
       order by editor desc, fact_checker desc, name asc`,
    );

    if (rows.length === 0) {
      return staticAuthors().filter((author) => author.isActive);
    }

    return rows.map(mapAuthorRow);
  } catch {
    return staticAuthors().filter((author) => author.isActive);
  }
});

export const getAuthorBySlug = cache(async (slug: string): Promise<Author | null> => {
  if (!slug) return null;

  try {
    const row = await queryOne<AuthorRow>(
      `select *
       from public.authors
       where slug = $1
       limit 1`,
      [slug],
    );

    if (!row) {
      return AUTHORS[slug] ?? null;
    }

    const author = mapAuthorRow(row);
    if (!author.isActive) return null;
    return author;
  } catch {
    return AUTHORS[slug] ?? null;
  }
});

export const getPrimaryFactChecker = cache(async (): Promise<Pick<Author, 'slug' | 'name'> | null> => {
  try {
    const row = await queryOne<{ slug: string; name: string }>(
      `select slug, name
       from public.authors
       where is_active = true
         and fact_checker = true
       order by joined_at asc nulls last
       limit 1`,
    );

    if (row) return row;
  } catch {
    // fallback below
  }

  const factChecker = staticAuthors().find((author) => author.factChecker && author.isActive);
  return factChecker ? { slug: factChecker.slug, name: factChecker.name } : null;
});
