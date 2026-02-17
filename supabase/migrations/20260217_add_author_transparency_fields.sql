-- Adiciona campos de transparencia editorial para perfis de autores
-- Recomendados para paginas de perfil em portais de noticia (Google News/EEAT)

ALTER TABLE authors
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS credentials TEXT[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN authors.website IS 'Site oficial ou perfil publico principal do autor.';
COMMENT ON COLUMN authors.location IS 'Localizacao editorial do autor (cidade/pais).';
COMMENT ON COLUMN authors.credentials IS 'Credenciais, certificacoes e afiliacoes profissionais do autor.';
