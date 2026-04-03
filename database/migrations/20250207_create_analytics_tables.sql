-- Migração: Criação de tabelas para Analytics/Tracking
-- Execute no SQL Editor do banco local

-- Tabela de eventos de analytics
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_article ON analytics_events(article_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

-- Tabela de sessões
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

-- View para métricas agregadas (opcional)
CREATE OR REPLACE VIEW analytics_dashboard AS
SELECT
  DATE(timestamp) as date,
  event_type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM analytics_events
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), event_type
ORDER BY date DESC, count DESC;

-- Função para registrar evento (para uso em Edge Functions)
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

-- Políticas RLS (desativadas para service role, ativadas para anon)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Service role pode tudo (usado pelo MCP)
CREATE POLICY "Service role full access - analytics_events"
ON analytics_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access - analytics_sessions"
ON analytics_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Anon só insere (tracking)
CREATE POLICY "Anon insert only - analytics_events"
ON analytics_events
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anon insert only - analytics_sessions"
ON analytics_sessions
FOR INSERT
TO anon
WITH CHECK (true);

-- Autenticados veem seus próprios dados
CREATE POLICY "Users view own data - analytics_events"
ON analytics_events
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users view own data - analytics_sessions"
ON analytics_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Comentários
COMMENT ON TABLE analytics_events IS 'Eventos de tracking do portal (page views, cliques, etc)';
COMMENT ON TABLE analytics_sessions IS 'Sessões de usuários';

