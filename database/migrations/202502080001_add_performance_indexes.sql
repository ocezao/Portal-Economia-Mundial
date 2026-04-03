-- ============================================================
-- MIGRAÇÃO: Índices Compostos para Performance
-- Data: 2025-02-08
-- Autor: DBA Specialist
-- ============================================================

-- Para listagem de artigos (status + published_at)
CREATE INDEX IF NOT EXISTS idx_news_articles_status_published_at 
  ON news_articles(status, published_at DESC);

-- Para featured articles (com partial index para eficiência)
CREATE INDEX IF NOT EXISTS idx_news_articles_featured 
  ON news_articles(status, is_featured, published_at DESC) 
  WHERE is_featured = true;

-- Para breaking news (com partial index para eficiência)
CREATE INDEX IF NOT EXISTS idx_news_articles_breaking 
  ON news_articles(status, is_breaking, published_at DESC) 
  WHERE is_breaking = true;

-- Para listagem por autor
CREATE INDEX IF NOT EXISTS idx_news_articles_author 
  ON news_articles(author_id, status, published_at DESC);

-- Para analytics (event_type + timestamp)
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time 
  ON analytics_events(event_type, timestamp DESC);

-- Índice adicional para busca por slug (já deve existir, mas garantimos)
CREATE INDEX IF NOT EXISTS idx_news_articles_slug 
  ON news_articles(slug);

-- Índice para busca por categoria via join table
CREATE INDEX IF NOT EXISTS idx_news_article_categories_article 
  ON news_article_categories(article_id);

CREATE INDEX IF NOT EXISTS idx_news_article_categories_category 
  ON news_article_categories(category_id);

-- Índice para tags
CREATE INDEX IF NOT EXISTS idx_news_article_tags_article 
  ON news_article_tags(article_id);

CREATE INDEX IF NOT EXISTS idx_news_article_tags_tag 
  ON news_article_tags(tag_id);

-- Índice para comentários por artigo
CREATE INDEX IF NOT EXISTS idx_comments_article_slug 
  ON comments(article_slug, created_at DESC);

-- Comentário explicativo
COMMENT ON INDEX idx_news_articles_status_published_at IS 'Otimiza listagem geral de artigos ordenados por data';
COMMENT ON INDEX idx_news_articles_featured IS 'Otimiza busca de artigos em destaque (partial index)';
COMMENT ON INDEX idx_news_articles_breaking IS 'Otimiza busca de notícias urgentes (partial index)';
COMMENT ON INDEX idx_news_articles_author IS 'Otimiza listagem de artigos por autor';
COMMENT ON INDEX idx_analytics_events_type_time IS 'Otimiza consultas analíticas por tipo de evento';

