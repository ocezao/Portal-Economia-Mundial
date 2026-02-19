import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';

type Payload = Record<string, unknown> & {
  action?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  authorId?: string;
  author?: string;
  tags?: string[];
  coverImage?: string;
  featured?: boolean;
  breaking?: boolean;
  readingTime?: number;
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
};

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice(7).trim() || null;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

async function requireAdmin(req: Request) {
  const token = getBearerToken(req);
  if (!token) return { ok: false as const, status: 401, message: 'Nao autenticado' };

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { ok: false as const, status: 401, message: 'Sessao invalida' };

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) return { ok: false as const, status: 500, message: 'Erro interno ao verificar permissoes' };
  if (profile?.role !== 'admin') return { ok: false as const, status: 403, message: 'Sem permissao' };

  return { ok: true as const, admin, userId: data.user.id };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);

    const payload = (await req.json()) as Payload;
    const action = payload.action;

    const admin = auth.admin;

    if (action === 'create') {
      const {
        title,
        slug,
        excerpt,
        content,
        category,
        authorId,
        author,
        tags = [],
        coverImage,
        featured = false,
        breaking = false,
        readingTime = 1,
        views = 0,
        likes = 0,
        shares = 0,
        comments = 0,
      } = payload;

      if (!title) return json({ error: 'Titulo e obrigatorio' }, 400);
      if (!slug) return json({ error: 'Slug e obrigatorio' }, 400);
      if (!excerpt) return json({ error: 'Resumo e obrigatorio' }, 400);
      if (!content) return json({ error: 'Conteudo e obrigatorio' }, 400);
      if (!category) return json({ error: 'Categoria e obrigatoria' }, 400);
      if (!authorId) return json({ error: 'Autor e obrigatorio' }, 400);
      if (!coverImage) return json({ error: 'Imagem de capa e obrigatoria' }, 400);

      const publishedAt = new Date().toISOString();

      const { data: inserted, error: insertError } = await admin
        .from('news_articles')
        .insert({
          title,
          slug,
          excerpt,
          content,
          cover_image: coverImage,
          author_id: authorId,
          author_name: author || 'Unknown',
          status: 'published',
          published_at: publishedAt,
          reading_time: readingTime,
          is_featured: featured,
          is_breaking: breaking,
          views,
          likes,
          shares,
          comments_count: comments,
        })
        .select('id')
        .single();

      if (insertError) return json({ error: insertError.message }, 500);
      if (!inserted) return json({ error: 'Falha ao criar artigo' }, 500);

      const articleId = inserted.id;

      const { data: categoryData } = await admin
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();

      if (categoryData) {
        await admin.from('news_article_categories').insert({
          article_id: articleId,
          category_id: categoryData.id,
        });
      }

      for (const tag of tags) {
        const tagSlug = slugify(tag);
        const { data: tagRow } = await admin
          .from('tags')
          .upsert({ name: tag, slug: tagSlug }, { onConflict: 'slug' })
          .select('id')
          .single();

        if (tagRow) {
          await admin.from('news_article_tags').insert({
            article_id: articleId,
            tag_id: tagRow.id,
          });
        }
      }

      return json({ ok: true, id: articleId, slug });
    }

    if (action === 'update') {
      const { slug: currentSlug, ...updates } = payload;

      if (!currentSlug) return json({ error: 'Slug atual e obrigatorio' }, 400);

      const { data: existing } = await admin
        .from('news_articles')
        .select('id, author_id')
        .eq('slug', currentSlug)
        .single();

      if (!existing) return json({ error: 'Artigo nao encontrado' }, 404);

      const updateData: Record<string, unknown> = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.slug) updateData.slug = updates.slug;
      if (updates.excerpt) updateData.excerpt = updates.excerpt;
      if (updates.content) updateData.content = updates.content;
      if (updates.coverImage) updateData.cover_image = updates.coverImage;
      if (updates.authorId) {
        updateData.author_id = updates.authorId;
        updateData.author_name = updates.author || existing.author_id;
      }
      if (updates.featured !== undefined) updateData.is_featured = updates.featured;
      if (updates.breaking !== undefined) updateData.is_breaking = updates.breaking;

      const { error: updateError } = await admin
        .from('news_articles')
        .update(updateData)
        .eq('slug', currentSlug);

      if (updateError) return json({ error: updateError.message }, 500);

      if (updates.category) {
        await admin.from('news_article_categories').delete().eq('article_id', existing.id);
        
        const { data: categoryData } = await admin
          .from('categories')
          .select('id')
          .eq('slug', updates.category)
          .single();

        if (categoryData) {
          await admin.from('news_article_categories').insert({
            article_id: existing.id,
            category_id: categoryData.id,
          });
        }
      }

      return json({ ok: true });
    }

    if (action === 'delete') {
      const { slug } = payload;
      if (!slug) return json({ error: 'Slug e obrigatorio' }, 400);

      const { error: deleteError } = await admin
        .from('news_articles')
        .delete()
        .eq('slug', slug);

      if (deleteError) return json({ error: deleteError.message }, 500);

      return json({ ok: true });
    }

    return json({ error: 'Acao invalida' }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro interno do servidor';
    return json({ error: message }, 500);
  }
}
