/**
 * Operacoes administrativas de autores (tabela `authors`)
 *
 * Implementacao direta via Postgres local.
 */

import type { Author } from '@/config/authors';
import { query, queryRows } from '@/lib/db';

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
  website: string | null;
  location: string | null;
  expertise: string[] | null;
  credentials: string[] | null;
  education: Author['education'] | null;
  awards: string[] | null;
  languages: string[] | null;
  joined_at: string | null;
  is_active: boolean | null;
  fact_checker: boolean | null;
  editor: boolean | null;
  created_at: string | null;
  updated_at: string | null;
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
  website: author.website ?? null,
  location: author.location ?? null,
  expertise: author.expertise ?? [],
  credentials: author.credentials ?? [],
  education: author.education ?? [],
  awards: author.awards ?? [],
  languages: author.languages ?? [],
  joined_at: author.joinedAt || null,
  is_active: author.isActive ?? true,
  fact_checker: author.factChecker ?? false,
  editor: author.editor ?? false,
});

export async function listAdminAuthors(): Promise<Author[]> {
  if (!process.env.DATABASE_URL) {
    throw new Error('Banco local nao configurado (DATABASE_URL).');
  }

  const data = await queryRows<AuthorRow>(
    `select *
     from authors
     order by editor desc, fact_checker desc, name asc`,
  );
  return data.map(mapRowToAuthor);
}

export async function createAdminAuthor(author: Author) {
  if (!process.env.DATABASE_URL) {
    throw new Error('Banco local nao configurado (DATABASE_URL).');
  }

  const row = mapAuthorToInsertRow(author);
  await query(
    `insert into authors (
      slug, name, short_name, title, bio, long_bio, photo, email, social, website, location,
      expertise, credentials, education, awards, languages, joined_at, is_active, fact_checker, editor
    ) values (
      $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11,
      $12::text[], $13::text[], $14::jsonb, $15::text[], $16::text[], $17, $18, $19, $20
    )`,
    [
      row.slug,
      row.name,
      row.short_name,
      row.title,
      row.bio,
      row.long_bio,
      row.photo,
      row.email,
      JSON.stringify(row.social ?? {}),
      row.website,
      row.location,
      row.expertise ?? [],
      row.credentials ?? [],
      JSON.stringify(row.education ?? []),
      row.awards ?? [],
      row.languages ?? [],
      row.joined_at,
      row.is_active,
      row.fact_checker,
      row.editor,
    ],
  );
  return { ok: true };
}

export async function updateAdminAuthor(input: { slug: string; updates: Partial<Author> }) {
  if (!process.env.DATABASE_URL) {
    throw new Error('Banco local nao configurado (DATABASE_URL).');
  }

  const { slug, updates } = input;
  if (!slug) throw new Error('slug e obrigatorio');

  if ((updates as Partial<Author> & { slug?: string }).slug && (updates as Partial<Author> & { slug?: string }).slug !== slug) {
    throw new Error('Nao e permitido alterar o slug do autor');
  }

  const assignments: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  const push = (column: string, value: unknown, cast?: string) => {
    assignments.push(`${column} = $${index}${cast ? `::${cast}` : ''}`);
    values.push(value);
    index += 1;
  };

  if (updates.name !== undefined) push('name', updates.name);
  if (updates.shortName !== undefined) push('short_name', updates.shortName);
  if (updates.title !== undefined) push('title', updates.title);
  if (updates.bio !== undefined) push('bio', updates.bio);
  if (updates.longBio !== undefined) push('long_bio', updates.longBio);
  if (updates.photo !== undefined) push('photo', updates.photo);
  if (updates.email !== undefined) push('email', updates.email);
  if (updates.social !== undefined) push('social', JSON.stringify(updates.social ?? {}), 'jsonb');
  if (updates.website !== undefined) push('website', updates.website);
  if (updates.location !== undefined) push('location', updates.location);
  if (updates.expertise !== undefined) push('expertise', updates.expertise ?? [], 'text[]');
  if (updates.credentials !== undefined) push('credentials', updates.credentials ?? [], 'text[]');
  if (updates.education !== undefined) push('education', JSON.stringify(updates.education ?? []), 'jsonb');
  if (updates.awards !== undefined) push('awards', updates.awards ?? [], 'text[]');
  if (updates.languages !== undefined) push('languages', updates.languages ?? [], 'text[]');
  if (updates.joinedAt !== undefined) push('joined_at', updates.joinedAt || null);
  if (updates.isActive !== undefined) push('is_active', updates.isActive);
  if (updates.factChecker !== undefined) push('fact_checker', updates.factChecker);
  if (updates.editor !== undefined) push('editor', updates.editor);

  if (assignments.length === 0) {
    return { ok: true };
  }

  values.push(slug);
  await query(
    `update authors
     set ${assignments.join(', ')}
     where slug = $${index}`,
    values,
  );
  return { ok: true };
}

export async function deleteAdminAuthor(input: { slug: string }) {
  if (!process.env.DATABASE_URL) {
    throw new Error('Banco local nao configurado (DATABASE_URL).');
  }

  const { slug } = input;
  if (!slug) throw new Error('slug e obrigatorio');

  await query('update authors set is_active = false where slug = $1', [slug]);
  return { ok: true };
}

export async function restoreAdminAuthor(input: { slug: string }) {
  if (!process.env.DATABASE_URL) {
    throw new Error('Banco local nao configurado (DATABASE_URL).');
  }

  const { slug } = input;
  if (!slug) throw new Error('slug e obrigatorio');

  await query('update authors set is_active = true where slug = $1', [slug]);
  return { ok: true };
}
