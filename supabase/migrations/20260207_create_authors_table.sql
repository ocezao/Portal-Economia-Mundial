-- Migração: Criação de tabela de autores (E-E-A-T / Editorial)
-- Execute no SQL Editor do Supabase ou via `supabase db push`.

-- Tabela de autores
CREATE TABLE IF NOT EXISTS authors (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT NOT NULL,
  long_bio TEXT NOT NULL,
  photo TEXT NOT NULL,
  email TEXT NOT NULL,
  social JSONB NOT NULL DEFAULT '{}'::jsonb,
  expertise TEXT[] NOT NULL DEFAULT '{}'::text[],
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  awards TEXT[] NOT NULL DEFAULT '{}'::text[],
  languages TEXT[] NOT NULL DEFAULT '{}'::text[],
  joined_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  fact_checker BOOLEAN NOT NULL DEFAULT FALSE,
  editor BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_authors_is_active ON authors(is_active);
CREATE INDEX IF NOT EXISTS idx_authors_fact_checker ON authors(fact_checker);
CREATE INDEX IF NOT EXISTS idx_authors_editor ON authors(editor);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION pem_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_authors_updated_at ON authors;
CREATE TRIGGER trg_authors_updated_at
BEFORE UPDATE ON authors
FOR EACH ROW
EXECUTE FUNCTION pem_set_updated_at();

-- RLS
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

-- Service role pode tudo (usado por Edge Functions)
CREATE POLICY "Service role full access - authors"
ON authors
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Público: apenas autores ativos
CREATE POLICY "Public read active authors - authors"
ON authors
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Admin (via profiles.role = 'admin'): CRUD completo
CREATE POLICY "Admins manage authors - authors"
ON authors
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

-- Seeds: autores padrão (idempotente)
INSERT INTO authors (
  slug,
  name,
  short_name,
  title,
  bio,
  long_bio,
  photo,
  email,
  social,
  expertise,
  education,
  awards,
  languages,
  joined_at,
  is_active,
  fact_checker,
  editor
) VALUES (
  'ana-silva',
  'Ana Carolina Silva',
  'Ana Silva',
  'Editora Chefe',
  'Jornalista com 15 anos de experiência em cobertura econômica internacional. Especialista em mercados emergentes e geopolítica.',
  $$Ana Carolina Silva é Editora Chefe do Portal Econômico Mundial desde 2019. Com mais de 15 anos de experiência em jornalismo econômico, Ana liderou coberturas de eventos globais como a crise financeira de 2008, a pandemia de COVID-19 e as transições políticas em mercados emergentes.

Formada em Jornalismo pela USP e com MBA em Economia Internacional pela FGV, Ana construiu uma carreira marcada pela precisão analítica e rigor na checagem de fatos. Antes de integrar o PEM, trabalhou como correspondente internacional para importantes veículos brasileiros, com passagens por Londres, Nova York e Singapura.

Sua abordagem jornalística prioriza o contexto histórico e as implicações de longo prazo dos eventos econômicos, sempre com base em dados verificáveis e fontes oficiais.$$,
  '/images/authors/ana-silva.webp',
  'ana.silva@portaleconomicomundial.com',
  '{"twitter":"anacsilva_jorn","linkedin":"anacarolinasilva"}'::jsonb,
  ARRAY[
    'Economia Internacional',
    'Mercados Emergentes',
    'Geopolítica',
    'Política Monetária',
    'Comércio Global'
  ],
  jsonb_build_array(
    jsonb_build_object('institution','Universidade de São Paulo (USP)','degree','Bacharelado em Jornalismo','year','2008'),
    jsonb_build_object('institution','Fundação Getúlio Vargas (FGV)','degree','MBA em Economia Internacional','year','2012')
  ),
  ARRAY[
    'Prêmio Esso de Jornalismo Econômico (2019)',
    'Prêmio CNBC de Melhor Cobertura Internacional (2017)'
  ],
  ARRAY['Português','Inglês','Espanhol'],
  '2019-03-15',
  TRUE,
  FALSE,
  TRUE
), (
  'carlos-mendes',
  'Carlos Eduardo Mendes',
  'Carlos Mendes',
  'Analista de Mercados Sênior',
  'Economista e especialista em análise técnica de mercados financeiros. Focado em commodities e criptomoedas.',
  $$Carlos Eduardo Mendes é Analista de Mercados Sênior no Portal Econômico Mundial desde 2020. Economista formado pela PUC-Rio com especialização em Finanças Quantitativas, Carlos desenvolveu modelos preditivos para análise de tendências de mercado que são referência no portal.

Sua expertise em análise técnica e fundamentalista o tornou uma voz autorizada no acompanhamento de commodities, especialmente petróleo, minério de ferro e agrícolas. Nos últimos anos, ampliou seu foco para incluir o ecossistema de criptomoedas e ativos digitais, sempre com uma abordagem cautelosa e baseada em dados.

Antes de se juntar ao PEM, Carlos trabalhou em mesas de operações de grandes instituições financeiras brasileiras, experiência que lhe proporcionou compreensão prática dos mecanismos de mercado.$$,
  '/images/authors/carlos-mendes.webp',
  'carlos.mendes@portaleconomicomundial.com',
  '{"twitter":"cmendes_econ","linkedin":"carloseduardomendes"}'::jsonb,
  ARRAY[
    'Análise Técnica',
    'Commodities',
    'Criptomoedas',
    'Mercado de Capitais',
    'Econometria'
  ],
  jsonb_build_array(
    jsonb_build_object('institution','PUC-Rio','degree','Bacharelado em Economia','year','2010'),
    jsonb_build_object('institution','INSPER','degree','Especialização em Finanças Quantitativas','year','2014')
  ),
  ARRAY['Prêmio Anbima de Melhor Análise de Mercado (2021)'],
  ARRAY['Português','Inglês'],
  '2020-06-01',
  TRUE,
  FALSE,
  FALSE
), (
  'maria-oliveira',
  'Maria Fernanda Oliveira',
  'Maria Oliveira',
  'Correspondente Internacional',
  'Baseada em Bruxelas, cobre União Europeia, relações transatlânticas e política europeia.',
  $$Maria Fernanda Oliveira é Correspondente Internacional do Portal Econômico Mundial em Bruxelas desde 2021. Jornalista especializada em assuntos europeus, Maria oferece cobertura em primeira mão das decisões do Parlamento Europeu, Comissão Europeia e Conselho Europeu que impactam o comércio global.

Formada em Relações Internacionais pela UnB e com mestrado em Estudos Europeus pela Université libre de Bruxelles, Maria combina conhecimento acadêmico sólido com uma rede de contatos extensa no centro decisório europeu.

Sua cobertura privilegia as implicações das políticas europeias para o Brasil e América Latina, especialmente em áreas como acordos comerciais, regulação digital e políticas climáticas.$$,
  '/images/authors/maria-oliveira.webp',
  'maria.oliveira@portaleconomicomundial.com',
  '{"twitter":"mfoliveira_brux","linkedin":"mariafernandaoliveira"}'::jsonb,
  ARRAY[
    'Política Europeia',
    'Relações Transatlânticas',
    'Acordos Comerciais',
    'Regulação Digital',
    'Política Climática'
  ],
  jsonb_build_array(
    jsonb_build_object('institution','Universidade de Brasília (UnB)','degree','Bacharelado em Relações Internacionais','year','2015'),
    jsonb_build_object('institution','Université libre de Bruxelles','degree','Mestrado em Estudos Europeus','year','2018')
  ),
  ARRAY['Prêmio Imprensa Europeia - Câmara de Comércio UE-Brasil (2022)'],
  ARRAY['Português','Inglês','Francês','Espanhol'],
  '2021-01-15',
  TRUE,
  FALSE,
  FALSE
), (
  'roberto-santos',
  'Roberto Santos',
  'Roberto Santos',
  'Editor de Fato',
  'Responsável pela checagem de fatos e verificação de informações. Garante a precisão e credibilidade de todas as publicações.',
  $$Roberto Santos atua como Editor de Fato (Fact-Checker) do Portal Econômico Mundial desde 2020. Jornalista com formação em Ciência Política, Roberto é responsável pela verificação rigorosa de todas as informações publicadas no portal.

Especialista em checagem de fatos e combate à desinformação, Roberto desenvolveu protocolos internos de verificação que incluem análise de fontes primárias, cruzamento de dados oficiais e consulta a especialistas. Sua atuação garante que o PEM mantenha os mais altos padrões de precisão factual.

Roberto é membro da International Fact-Checking Network (IFCN) e participa ativamente de iniciativas globais de combate à desinformação econômica e financeira.$$,
  '/images/authors/roberto-santos.webp',
  'roberto.santos@portaleconomicomundial.com',
  '{"twitter":"rsantos_check","linkedin":"robertosantos"}'::jsonb,
  ARRAY[
    'Checagem de Fatos',
    'Análise de Fontes',
    'Combate à Desinformação',
    'Jornalismo Investigativo'
  ],
  jsonb_build_array(
    jsonb_build_object('institution','Universidade Federal de Pernambuco (UFPE)','degree','Bacharelado em Jornalismo','year','2012'),
    jsonb_build_object('institution','Universidade de São Paulo (USP)','degree','Mestrado em Ciência Política','year','2016')
  ),
  ARRAY[
    'Prêmio Comprova de Checagem (2021)',
    'Certificação IFCN - International Fact-Checking Network'
  ],
  ARRAY['Português','Inglês'],
  '2020-08-01',
  TRUE,
  TRUE,
  FALSE
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  title = EXCLUDED.title,
  bio = EXCLUDED.bio,
  long_bio = EXCLUDED.long_bio,
  photo = EXCLUDED.photo,
  email = EXCLUDED.email,
  social = EXCLUDED.social,
  expertise = EXCLUDED.expertise,
  education = EXCLUDED.education,
  awards = EXCLUDED.awards,
  languages = EXCLUDED.languages,
  joined_at = EXCLUDED.joined_at,
  is_active = EXCLUDED.is_active,
  fact_checker = EXCLUDED.fact_checker,
  editor = EXCLUDED.editor;

COMMENT ON TABLE authors IS 'Autores do portal (E-E-A-T). Fonte para /editorial e páginas /autor/[slug].';
COMMENT ON COLUMN authors.slug IS 'Slug único do autor (usado nas URLs).';
