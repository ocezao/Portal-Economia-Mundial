-- ============================================================
-- PORTAL ECONÔMICO MUNDIAL - MIGRAÇÃO COMPLETA DO BANCO
-- Versão: 1.0
-- Data: 2026-02-20
-- Objetivo: Criar todas as tabelas, índices, políticas RLS e funções
-- ============================================================

-- ============================================================
-- EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. TABELA: news_articles (Artigos de Notícias)
-- ============================================================
CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    title_en TEXT,
    excerpt TEXT NOT NULL,
    excerpt_en TEXT,
    content TEXT NOT NULL,
    content_en TEXT,
    cover_image TEXT,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reading_time INTEGER NOT NULL DEFAULT 4,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_breaking BOOLEAN NOT NULL DEFAULT false,
    views INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    shares INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_news_articles_slug ON news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_news_articles_status_published ON news_articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_featured ON news_articles(status, is_featured, published_at DESC) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_news_articles_breaking ON news_articles(status, is_breaking, published_at DESC) WHERE is_breaking = true;
CREATE INDEX IF NOT EXISTS idx_news_articles_author ON news_articles(author_id, status, published_at DESC);

-- Full-text search
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'news_articles'
          AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE news_articles
          ADD COLUMN search_vector tsvector
          generated always as (
            setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('portuguese', coalesce(excerpt, '')), 'B')
          ) stored;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_news_articles_search_gin ON news_articles USING gin (search_vector);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_news_articles_updated_at
    BEFORE UPDATE ON news_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. TABELA: categories (Categorias)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_priority ON categories(priority);

-- ============================================================
-- 3. TABELA: authors (Autores/Jornalistas)
-- ============================================================
CREATE TABLE IF NOT EXISTS authors (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT,
    title TEXT,
    bio TEXT,
    long_bio TEXT,
    photo TEXT,
    email TEXT,
    social JSONB DEFAULT '{}',
    expertise TEXT[] DEFAULT '{}',
    education TEXT[],
    awards TEXT[],
    languages TEXT[] DEFAULT '{}',
    joined_at DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    fact_checker BOOLEAN DEFAULT false,
    editor BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    website TEXT,
    location TEXT,
    credentials TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);
CREATE INDEX IF NOT EXISTS idx_authors_active ON authors(is_active);

-- ============================================================
-- 4. TABELA: profiles (Perfis de Usuários)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Função is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
          AND p.status = 'active'
    );
$$;

-- ============================================================
-- 5. TABELA: job_applications (Candidaturas)
-- ============================================================
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    area TEXT NOT NULL,
    message TEXT NOT NULL,
    resume_file_name TEXT,
    resume_path TEXT,
    consent BOOLEAN NOT NULL DEFAULT true,
    meta JSONB DEFAULT '{}'
);

ALTER TABLE job_applications
    ADD CONSTRAINT job_applications_email_check 
    CHECK (position('@' in email) > 1 and char_length(email) <= 254);

CREATE INDEX IF NOT EXISTS idx_job_applications_created ON job_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_area ON job_applications(area);

-- ============================================================
-- 6. TABELA: contact_messages (Mensagens de Contato)
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    category TEXT,
    message TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'new'
);

ALTER TABLE contact_messages
    ADD CONSTRAINT contact_messages_email_check 
    CHECK (position('@' in email) > 1 and char_length(email) <= 254);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

-- ============================================================
-- 7. TABELA: leads (Newsletter/Fale Conosco)
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL,
    name TEXT,
    email TEXT NOT NULL,
    email_normalized TEXT GENERATED ALWAYS AS (lower(email)) STORED,
    consent BOOLEAN NOT NULL DEFAULT true,
    meta JSONB DEFAULT '{}'
);

ALTER TABLE leads
    ADD CONSTRAINT leads_email_check 
    CHECK (position('@' in email) > 1 and char_length(email) <= 254);

ALTER TABLE leads
    ADD CONSTRAINT leads_source_check 
    CHECK (
        source = 'fale_conosco'
        OR source LIKE 'newsletter_%'
    );

CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source_created ON leads(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email_normalized ON leads(email_normalized);
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email_source_unique ON leads(email_normalized, source);

-- ============================================================
-- 8. TABELA: comments (Comentários)
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    article_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
);

ALTER TABLE comments
    ADD CONSTRAINT comments_content_check 
    CHECK (char_length(content) BETWEEN 1 AND 2000);

CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 9. TABELA: post_actions (Likes/Favoritos/Salvos)
-- ============================================================
CREATE TABLE IF NOT EXISTS post_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    article_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL
);

ALTER TABLE post_actions
    ADD CONSTRAINT post_actions_action_check 
    CHECK (action IN ('like','save','favorite'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_actions_unique ON post_actions(user_id, article_id, action);
CREATE INDEX IF NOT EXISTS idx_post_actions_article ON post_actions(article_id);
CREATE INDEX IF NOT EXISTS idx_post_actions_user ON post_actions(user_id);

-- ============================================================
-- 10. TABELA: bookmarks (Favoritos do Usuário)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bookmarks
    ADD CONSTRAINT bookmarks_user_article_unique UNIQUE (user_id, article_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_article ON bookmarks(article_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created ON bookmarks(created_at DESC);

-- ============================================================
-- 11. TABELA: reading_history (Histórico de Leitura)
-- ============================================================
CREATE TABLE IF NOT EXISTS reading_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    time_spent INTEGER NOT NULL DEFAULT 0,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reading_history
    ADD CONSTRAINT reading_history_time_spent_check CHECK (time_spent >= 0);

CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_article ON reading_history(article_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_read_at ON reading_history(read_at DESC);

-- ============================================================
-- 12. TABELA: reading_progress (Progresso de Leitura)
-- ============================================================
CREATE TABLE IF NOT EXISTS reading_progress (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    progress_pct INTEGER NOT NULL DEFAULT 0,
    last_position INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, article_id)
);

ALTER TABLE reading_progress
    ADD CONSTRAINT reading_progress_pct_check CHECK (progress_pct BETWEEN 0 AND 100);
ALTER TABLE reading_progress
    ADD CONSTRAINT reading_progress_position_check CHECK (last_position >= 0);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_article ON reading_progress(article_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_updated ON reading_progress(updated_at DESC);

-- ============================================================
-- 13. TABELA: news_article_categories (Junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS news_article_categories (
    article_id UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_nac_article ON news_article_categories(article_id);
CREATE INDEX IF NOT EXISTS idx_nac_category ON news_article_categories(category_id);

-- ============================================================
-- 14. TABELA: news_article_tags (Junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS news_article_tags (
    article_id UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL,
    PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_nat_article ON news_article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_nat_tag ON news_article_tags(tag_id);

-- ============================================================
-- 15. TABELA: tags
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

-- ============================================================
-- 16. TABELA: news_slug_redirects
-- ============================================================
CREATE TABLE IF NOT EXISTS news_slug_redirects (
    from_slug TEXT PRIMARY KEY,
    to_slug TEXT NOT NULL,
    article_id UUID REFERENCES news_articles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 17. TABELA: analytics_events
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id UUID,
    article_id UUID REFERENCES news_articles(id) ON DELETE CASCADE,
    url_path TEXT,
    properties JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_article ON analytics_events(article_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time ON analytics_events(event_type, timestamp DESC);

-- ============================================================
-- 18. TABELA: analytics_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    page_views INTEGER DEFAULT 0,
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    country VARCHAR(2),
    referrer TEXT,
    landing_page TEXT,
    exit_page TEXT,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user ON analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started ON analytics_sessions(started_at DESC);

-- ============================================================
-- 19. TABELA: app_errors
-- ============================================================
CREATE TABLE IF NOT EXISTS app_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL DEFAULT 'web',
    message TEXT NOT NULL,
    stack TEXT,
    digest TEXT,
    url TEXT,
    pathname TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_app_errors_created ON app_errors(created_at DESC);

-- ============================================================
-- 20. TABELA: external_snapshots
-- ============================================================
CREATE TABLE IF NOT EXISTS external_snapshots (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_external_snapshots_fetched ON external_snapshots(fetched_at DESC);

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Função de busca full-text
CREATE OR REPLACE FUNCTION search_news_articles_ids(q TEXT, lim INT DEFAULT 30)
RETURNS TABLE(id UUID)
LANGUAGE SQL
STABLE
AS $$
    SELECT na.id
    FROM news_articles na
    WHERE na.status = 'published'
      AND na.search_vector @@ websearch_to_tsquery('portuguese', q)
    ORDER BY ts_rank_cd(na.search_vector, websearch_to_tsquery('portuguese', q)) DESC,
             na.published_at DESC NULLS LAST
    LIMIT GREATEST(1, LEAST(lim, 50));
$$;

-- Função para tracking de eventos
CREATE OR REPLACE FUNCTION track_event(
    p_event_type VARCHAR,
    p_user_id UUID DEFAULT NULL,
    p_session_id UUID DEFAULT NULL,
    p_article_id UUID DEFAULT NULL,
    p_url_path TEXT DEFAULT NULL,
    p_properties JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO analytics_events (
        event_type,
        user_id,
        session_id,
        article_id,
        url_path,
        properties
    ) VALUES (
        p_event_type,
        p_user_id,
        p_session_id,
        p_article_id,
        p_url_path,
        p_properties
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;

-- Função de atividade do usuário
CREATE OR REPLACE FUNCTION get_my_activity()
RETURNS TABLE (
    user_id UUID,
    comment_count INT,
    action_count INT,
    total_score INT,
    rank INT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    WITH comment_counts AS (
        SELECT user_id, count(*)::int as comment_count
        FROM comments
        WHERE status = 'active'
        GROUP BY user_id
    ),
    action_counts AS (
        SELECT user_id, count(*)::int as action_count
        FROM post_actions
        GROUP BY user_id
    ),
    merged AS (
        SELECT COALESCE(c.user_id, a.user_id) as user_id,
               COALESCE(c.comment_count, 0) as comment_count,
               COALESCE(a.action_count, 0) as action_count,
               COALESCE(c.comment_count, 0) + COALESCE(a.action_count, 0) as total_score
        FROM comment_counts c
        FULL JOIN action_counts a ON a.user_id = c.user_id
    ),
    ranked AS (
        SELECT *, dense_rank() OVER (ORDER BY total_score DESC, user_id) as rank
        FROM merged
    )
    SELECT user_id, comment_count, action_count, total_score, rank
    FROM ranked
    WHERE user_id = auth.uid();
$$;

-- Trigger para criar perfil ao cadastrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO profiles (id, name)
    VALUES (new.id, new.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- POLÍTICAS RLS
-- ============================================================

-- News Articles
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow public read news" ON news_articles;
CREATE POLICY "allow public read news" ON news_articles
    FOR SELECT TO anon, authenticated
    USING (status = 'published');

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow public read categories" ON categories;
CREATE POLICY "allow public read categories" ON categories
    FOR SELECT TO anon, authenticated
    USING (true);

-- Authors
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow public read authors" ON authors;
CREATE POLICY "allow public read authors" ON authors
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles self read" ON profiles;
CREATE POLICY "profiles self read" ON profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Job Applications
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow anon insert job" ON job_applications;
CREATE POLICY "allow anon insert job" ON job_applications
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Contact Messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow anon insert contact" ON contact_messages;
CREATE POLICY "allow anon insert contact" ON contact_messages
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow anon insert leads" ON leads;
CREATE POLICY "allow anon insert leads" ON leads
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone view comments" ON comments;
CREATE POLICY "anyone view comments" ON comments
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "auth create comments" ON comments;
CREATE POLICY "auth create comments" ON comments
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id AND status = 'active');

DROP POLICY IF EXISTS "owner update comments" ON comments;
CREATE POLICY "owner update comments" ON comments
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner delete comments" ON comments;
CREATE POLICY "owner delete comments" ON comments
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Post Actions
ALTER TABLE post_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner read actions" ON post_actions;
CREATE POLICY "owner read actions" ON post_actions
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner insert actions" ON post_actions;
CREATE POLICY "owner insert actions" ON post_actions
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner delete actions" ON post_actions;
CREATE POLICY "owner delete actions" ON post_actions
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner read bookmarks" ON bookmarks;
CREATE POLICY "owner read bookmarks" ON bookmarks
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner insert bookmarks" ON bookmarks;
CREATE POLICY "owner insert bookmarks" ON bookmarks
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner delete bookmarks" ON bookmarks;
CREATE POLICY "owner delete bookmarks" ON bookmarks
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Reading History
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner read history" ON reading_history;
CREATE POLICY "owner read history" ON reading_history
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner insert history" ON reading_history;
CREATE POLICY "owner insert history" ON reading_history
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner delete history" ON reading_history;
CREATE POLICY "owner delete history" ON reading_history
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Reading Progress
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner read progress" ON reading_progress;
CREATE POLICY "owner read progress" ON reading_progress
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner insert progress" ON reading_progress;
CREATE POLICY "owner insert progress" ON reading_progress
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner update progress" ON reading_progress;
CREATE POLICY "owner update progress" ON reading_progress
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- News Slug Redirects
ALTER TABLE news_slug_redirects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read redirects" ON news_slug_redirects;
CREATE POLICY "public read redirects" ON news_slug_redirects
    FOR SELECT USING (true);

-- Analytics Events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon insert analytics" ON analytics_events;
CREATE POLICY "anon insert analytics" ON analytics_events
    FOR INSERT TO anon
    WITH CHECK (true);

-- Analytics Sessions
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon insert sessions" ON analytics_sessions;
CREATE POLICY "anon insert sessions" ON analytics_sessions
    FOR INSERT TO anon
    WITH CHECK (true);

-- App Errors
ALTER TABLE app_errors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone insert errors" ON app_errors;
CREATE POLICY "anyone insert errors" ON app_errors
    FOR INSERT WITH CHECK (true);

-- External Snapshots
ALTER TABLE external_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read snapshots" ON external_snapshots;
CREATE POLICY "public read snapshots" ON external_snapshots
    FOR SELECT USING (true)
    WITH CHECK (expires_at IS NULL OR expires_at > NOW());

-- ============================================================
-- PERMISSÕES
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- DADOS INICIAIS (SEEDS)
-- ============================================================

-- Categorias
INSERT INTO categories (slug, name, description, color, icon, priority) VALUES
    ('economia', 'Economia', 'Mercados financeiros, politica monetaria, comercio global e indicadores economicos', '#111111', 'trending-up', 1),
    ('geopolitica', 'Geopolitica', 'Analises de relacoes internacionais, conflitos, diplomacia e poder global', '#c40000', 'globe', 2),
    ('tecnologia', 'Tecnologia', 'Inovacao, inteligencia artificial, ciberseguranca e transformacao digital', '#6b6b6b', 'cpu', 3)
ON CONFLICT (slug) DO NOTHING;

-- Autores (exemplo)
INSERT INTO authors (slug, name, short_name, title, bio, is_active) VALUES
    ('ana-silva', 'Ana Silva', 'Ana', 'Editora Chefe', 'Editora com mais de 15 anos de experiencia em jornalismo economico', true),
    ('carlos-souza', 'Carlos Souza', 'Carlos', 'Analista de Mercado', 'Especialista em mercados financeiros e analise de investimentos', true),
    ('maria-oliveira', 'Maria Oliveira', 'Maria', 'Correspondente Internacional', 'Repórter especializada em geopolítica e relações internacionais', true),
    ('pedro Santos', 'Pedro Santos', 'Pedro', 'Tecnologia', 'Especialista em tecnologia e inovação', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- FIM DA MIGRAÇÃO
-- ============================================================

