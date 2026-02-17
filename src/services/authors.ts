/**
 * Public author directory (DB-backed with static fallback)
 *
 * Source of truth (when available): Supabase table `authors`
 * Fallback: `src/config/authors.ts`
 */

import { cache } from 'react';

import type { Author } from '@/config/authors';
import { AUTHORS } from '@/config/authors';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

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
  if (!isSupabaseConfigured) {
    return staticAuthors().filter((a) => a.isActive);
  }

  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .eq('is_active', true)
    .order('editor', { ascending: false })
    .order('fact_checker', { ascending: false })
    .order('name', { ascending: true });

  if (error || !Array.isArray(data)) {
    return staticAuthors().filter((a) => a.isActive);
  }

  return (data as AuthorRow[]).map(mapAuthorRow);
});

export const getAuthorBySlug = cache(async (slug: string): Promise<Author | null> => {
  if (!slug) return null;

  if (!isSupabaseConfigured) {
    return AUTHORS[slug] ?? null;
  }

  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    return AUTHORS[slug] ?? null;
  }

  const author = mapAuthorRow(data as AuthorRow);
  if (!author.isActive) return null;
  return author;
});

export const getPrimaryFactChecker = cache(async (): Promise<Pick<Author, 'slug' | 'name'> | null> => {
  if (!isSupabaseConfigured) {
    const fc = staticAuthors().find((a) => a.factChecker && a.isActive);
    return fc ? { slug: fc.slug, name: fc.name } : null;
  }

  const { data, error } = await supabase
    .from('authors')
    .select('slug,name')
    .eq('is_active', true)
    .eq('fact_checker', true)
    .order('joined_at', { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    const fc = staticAuthors().find((a) => a.factChecker && a.isActive);
    return fc ? { slug: fc.slug, name: fc.name } : null;
  }

  return { slug: data.slug as string, name: data.name as string };
});
