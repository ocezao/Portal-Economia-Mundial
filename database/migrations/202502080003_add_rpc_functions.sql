-- ============================================================
-- MIGRAÇÃO: Funções RPC para Otimização de Queries
-- Data: 2025-02-08
-- Autor: DBA Specialist
-- ============================================================

-- ============================================================
-- FUNÇÃO 1: Upsert de Tags em Batch (resolve N+1)
-- ============================================================
CREATE OR REPLACE FUNCTION upsert_article_tags(
  p_article_id UUID,
  p_tag_names TEXT[]
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tag_name TEXT;
  v_tag_slug TEXT;
  v_tag_id UUID;
BEGIN
  -- Remover tags existentes do artigo
  DELETE FROM news_article_tags WHERE article_id = p_article_id;
  
  -- Inserir/atualizar tags e associar ao artigo
  FOREACH v_tag_name IN ARRAY p_tag_names
  LOOP
    -- Gerar slug da tag
    v_tag_slug := lower(regexp_replace(v_tag_name, '[^a-zA-Z0-9]+', '-', 'g'));
    
    -- Upsert na tabela tags
    INSERT INTO tags (name, slug)
    VALUES (v_tag_name, v_tag_slug)
    ON CONFLICT (slug) 
    DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_tag_id;
    
    -- Inserir relação artigo-tag
    INSERT INTO news_article_tags (article_id, tag_id)
    VALUES (p_article_id, v_tag_id)
    ON CONFLICT (article_id, tag_id) DO NOTHING;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION upsert_article_tags IS 'Realiza upsert em batch de tags para um artigo, evitando N+1 queries';

-- ============================================================
-- FUNÇÃO 2: Buscar Artigos por Categoria
-- ============================================================
CREATE OR REPLACE FUNCTION get_articles_by_category(
  p_category_slug TEXT,
  p_limit INTEGER DEFAULT 60,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  title_en TEXT,
  excerpt TEXT,
  excerpt_en TEXT,
  content TEXT,
  content_en TEXT,
  cover_image TEXT,
  author_id TEXT,
  author_name TEXT,
  status TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  reading_time INTEGER,
  is_featured BOOLEAN,
  is_breaking BOOLEAN,
  views INTEGER,
  likes INTEGER,
  shares INTEGER,
  comments_count INTEGER,
  category_slug TEXT,
  tags JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    na.id,
    na.slug,
    na.title,
    na.title_en,
    na.excerpt,
    na.excerpt_en,
    na.content,
    na.content_en,
    na.cover_image,
    na.author_id,
    na.author_name,
    na.status,
    na.published_at,
    na.created_at,
    na.updated_at,
    na.reading_time,
    na.is_featured,
    na.is_breaking,
    na.views,
    na.likes,
    na.shares,
    na.comments_count,
    c.slug AS category_slug,
    COALESCE(
      (
        SELECT jsonb_agg(t.name ORDER BY t.name)
        FROM news_article_tags nat
        JOIN tags t ON t.id = nat.tag_id
        WHERE nat.article_id = na.id
      ),
      '[]'::jsonb
    ) AS tags
  FROM news_articles na
  INNER JOIN news_article_categories nac ON nac.article_id = na.id
  INNER JOIN categories c ON c.id = nac.category_id
  WHERE na.status = 'published'
    AND c.slug = p_category_slug
  ORDER BY na.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION get_articles_by_category IS 'Retorna artigos publicados de uma categoria específica com tags agregadas';

-- ============================================================
-- FUNÇÃO 3: Buscar Artigos Relacionados
-- ============================================================
CREATE OR REPLACE FUNCTION get_related_articles(
  p_current_slug TEXT,
  p_category_slug TEXT,
  p_limit INTEGER DEFAULT 4
) RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  excerpt TEXT,
  cover_image TEXT,
  author_name TEXT,
  published_at TIMESTAMPTZ,
  reading_time INTEGER,
  views INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    na.id,
    na.slug,
    na.title,
    na.excerpt,
    na.cover_image,
    na.author_name,
    na.published_at,
    na.reading_time,
    na.views
  FROM news_articles na
  INNER JOIN news_article_categories nac ON nac.article_id = na.id
  INNER JOIN categories c ON c.id = nac.category_id
  WHERE na.status = 'published'
    AND na.slug != p_current_slug
    AND c.slug = p_category_slug
  ORDER BY na.published_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_related_articles IS 'Retorna artigos relacionados da mesma categoria, excluindo o artigo atual';

-- ============================================================
-- FUNÇÃO 4: Buscar Artigos (Search)
-- ============================================================
CREATE OR REPLACE FUNCTION search_articles(
  p_query TEXT,
  p_limit INTEGER DEFAULT 30
) RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  excerpt TEXT,
  cover_image TEXT,
  author_name TEXT,
  published_at TIMESTAMPTZ,
  category_slug TEXT,
  rank REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Busca usando ILIKE em múltiplos campos
  RETURN QUERY
  SELECT 
    na.id,
    na.slug,
    na.title,
    na.excerpt,
    na.cover_image,
    na.author_name,
    na.published_at,
    COALESCE(c.slug, 'economia') AS category_slug,
    -- Ranking simples baseado na posição do termo
    CASE 
      WHEN na.title ILIKE '%' || p_query || '%' THEN 1.0
      WHEN na.excerpt ILIKE '%' || p_query || '%' THEN 0.8
      WHEN na.slug ILIKE '%' || p_query || '%' THEN 0.6
      ELSE 0.4
    END AS rank
  FROM news_articles na
  LEFT JOIN news_article_categories nac ON nac.article_id = na.id
  LEFT JOIN categories c ON c.id = nac.category_id
  WHERE na.status = 'published'
    AND (
      na.title ILIKE '%' || p_query || '%'
      OR na.excerpt ILIKE '%' || p_query || '%'
      OR na.slug ILIKE '%' || p_query || '%'
    )
  ORDER BY rank DESC, na.published_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION search_articles IS 'Realiza busca full-text simples em artigos publicados';

-- ============================================================
-- FUNÇÃO 5: Atualizar Contador de Comentários
-- ============================================================
CREATE OR REPLACE FUNCTION update_article_comments_count(
  p_article_slug TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE news_articles
  SET comments_count = (
    SELECT COUNT(*) 
    FROM comments 
    WHERE article_slug = p_article_slug
  )
  WHERE slug = p_article_slug;
END;
$$;

COMMENT ON FUNCTION update_article_comments_count IS 'Atualiza o contador de comentários de um artigo específico';

-- ============================================================
-- FUNÇÃO 6: Incrementar Visualizações (Thread-Safe)
-- ============================================================
CREATE OR REPLACE FUNCTION increment_article_views(
  p_article_slug TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE news_articles
  SET views = views + 1
  WHERE slug = p_article_slug;
END;
$$;

COMMENT ON FUNCTION increment_article_views IS 'Incrementa contador de views de forma atômica (thread-safe)';

