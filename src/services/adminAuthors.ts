/**
 * Operações administrativas de autores (tabela `authors`)
 *
 * Implementação direta via Supabase (RLS) para não depender do deploy de Edge Function.
 * Requer que o usuário autenticado tenha `profiles.role = 'admin'` (ver policy em
 * `supabase/migrations/20260207_create_authors_table.sql`).
 */

import type { Author } from '@/config/authors';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';

type AuthorRow = {
  slug: string;
  name: string;
  short_name: string;
  title: string;
  bio: string;
  long_bio: string;
  photo: string;
  email: string;
  social: Author['social'] | null;
  expertise: string[] | null;
  education: Author['education'] | null;
  awards: string[] | null;
  languages: string[] | null;
  joined_at: string | null;
  is_active: boolean | null;
  fact_checker: boolean | null;
  editor: boolean | null;
};

const mapRowToAuthor = (row: AuthorRow): Author => ({
  slug: row.slug,
  name: row.name,
  shortName: row.short_name,
  title: row.title,
  bio: row.bio,
  longBio: row.long_bio,
  photo: row.photo,
  email: row.email,
  social: row.social ?? {},
  expertise: row.expertise ?? [],
  education: row.education ?? [],
  awards: row.awards ?? [],
  languages: row.languages ?? [],
  joinedAt: row.joined_at ?? '',
  isActive: row.is_active ?? true,
  factChecker: row.fact_checker ?? false,
  editor: row.editor ?? false,
});

const mapAuthorToInsertRow = (author: Author) => ({
  slug: author.slug,
  name: author.name,
  short_name: author.shortName,
  title: author.title,
  bio: author.bio,
  long_bio: author.longBio,
  photo: author.photo,
  email: author.email,
  social: author.social ?? {},
  expertise: author.expertise ?? [],
  education: author.education ?? [],
  awards: author.awards ?? [],
  languages: author.languages ?? [],
  joined_at: author.joinedAt || null,
  is_active: author.isActive ?? true,
  fact_checker: author.factChecker ?? false,
  editor: author.editor ?? false,
});

export async function listAdminAuthors(): Promise<Author[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  }

  const { data, error } = await supabase
    .from('authors')
    .select(
      'slug,name,short_name,title,bio,long_bio,photo,email,social,expertise,education,awards,languages,joined_at,is_active,fact_checker,editor',
    )
    .order('editor', { ascending: false })
    .order('fact_checker', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw error;
  return ((data ?? []) as AuthorRow[]).map(mapRowToAuthor);
}

export async function createAdminAuthor(author: Author) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  }

  const { error } = await supabase.from('authors').insert(mapAuthorToInsertRow(author));
  if (error) throw error;
  return { ok: true };
}

export async function updateAdminAuthor(input: { slug: string; updates: Partial<Author> }) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  }

  const { slug, updates } = input;
  if (!slug) throw new Error('slug é obrigatório');

  if ((updates as Partial<Author> & { slug?: string }).slug && (updates as Partial<Author> & { slug?: string }).slug !== slug) {
    throw new Error('Não é permitido alterar o slug do autor');
  }

  const dbUpdates: Partial<AuthorRow> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.shortName !== undefined) dbUpdates.short_name = updates.shortName;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  if (updates.longBio !== undefined) dbUpdates.long_bio = updates.longBio;
  if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.social !== undefined) dbUpdates.social = updates.social;
  if (updates.expertise !== undefined) dbUpdates.expertise = updates.expertise;
  if (updates.education !== undefined) dbUpdates.education = updates.education;
  if (updates.awards !== undefined) dbUpdates.awards = updates.awards;
  if (updates.languages !== undefined) dbUpdates.languages = updates.languages;
  if (updates.joinedAt !== undefined) dbUpdates.joined_at = updates.joinedAt || null;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.factChecker !== undefined) dbUpdates.fact_checker = updates.factChecker;
  if (updates.editor !== undefined) dbUpdates.editor = updates.editor;

  const { error } = await supabase.from('authors').update(dbUpdates).eq('slug', slug);
  if (error) throw error;
  return { ok: true };
}

export async function deleteAdminAuthor(input: { slug: string }) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  }

  const { slug } = input;
  if (!slug) throw new Error('slug é obrigatório');

  // Soft delete: mantém referências em artigos e remove do /editorial.
  const { error } = await supabase.from('authors').update({ is_active: false }).eq('slug', slug);
  if (error) throw error;
  return { ok: true };
}

export async function restoreAdminAuthor(input: { slug: string }) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  }

  const { slug } = input;
  if (!slug) throw new Error('slug é obrigatório');

  const { error } = await supabase.from('authors').update({ is_active: true }).eq('slug', slug);
  if (error) throw error;
  return { ok: true };
}
