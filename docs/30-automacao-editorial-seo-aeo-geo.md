# Plano Tecnico - Automacao Editorial para SEO, AEO e GEO

## 1. Objetivo

Este documento descreve o plano tecnico para evoluir a API e o fluxo editorial do projeto para um modelo de publicacao automatizada com qualidade profissional para:

- SEO tradicional
- AEO (Answer Engine Optimization)
- GEO (Generative Engine Optimization)
- audiencia principal no Brasil

O foco nao e apenas "agendar e publicar". O foco e transformar artigo em um ativo editorial com:

- workflow controlado
- dados estruturados persistidos
- rastreabilidade
- qualidade validavel
- distribuicao automatizada
- contexto Brasil explicito

## 2. Diagnostico Atual

Estado atual observado no codigo:

- A API admin legada de artigos continua pequena e acoplada a acoes genericas.
- `POST /api/articles` continua como camada legada.
- `POST /api/admin-posts` continua suportando apenas `publish_scheduled`, agora como dispatcher de `article_jobs`.
- A API editorial v1 ja existe com `meta`, `slug`, listagem, `GET/PATCH` por artigo, `enrich`, `publish`, `schedule`, `uploads` e `openapi`.
- O create/update editorial ja persistem `seoTitle`, `metaDescription`, `faqItems`, `sources`, `editorialStatus` e `publishedAt`.
- As telas admin de criar/editar artigo passaram a seguir o workflow editorial completo antes de publicar ou agendar.
- O schema publico do artigo ja usa fontes persistidas e nao depende mais de `citation` placeholder fixo.
- O FAQ automatico ainda existe como apoio, mas a camada editorial ja suporta FAQ persistido.
- O indice `/api/search` ainda nao expande sinais uteis para AEO/GEO.

Conclusao:

Hoje o projeto ja suporta automacao editorial bem mais madura do que no inicio deste plano: ha API dedicada, validacao, aprovacao, jobs, uploads e contrato para agentes. Ainda assim, o pacote profissional completo continua pendente em observabilidade, reindexacao, distribuicao e prova operacional em producao.

## 3. Objetivo do Estado Alvo

Ao final da evolucao, o sistema deve permitir:

1. criar rascunhos ou pautas via API
2. enriquecer o conteudo com metadados SEO/AEO/GEO
3. anexar fontes verificadas
4. validar qualidade editorial automaticamente
5. aprovar ou revisar manualmente
6. agendar ou publicar com seguranca
7. disparar distribuicao automatica
8. reindexar sitemap, RSS e indice interno
9. manter historico de versoes, jobs e auditoria

## 4. Principios de Implementacao

- Nao quebrar o fluxo editorial existente no primeiro rollout.
- Introduzir o modelo novo por etapas.
- Manter compatibilidade temporaria com `/api/articles`.
- Tornar enriquecimento e publicacao idempotentes.
- Persistir tudo que impacta indexacao, respostas e distribuicao.
- Separar conteudo editorial de metadados operacionais.
- Garantir angulo Brasil em conteudos internacionais.

## 5. Arquitetura Alvo

Camadas:

1. **Camada editorial**
   - artigo base
   - autor
   - tags e categorias
   - versoes

2. **Camada de enrichment**
   - SEO
   - AEO
   - GEO
   - entidades
   - FAQ
   - fontes

3. **Camada de workflow**
   - status
   - aprovacao
   - revisao
   - auditoria

4. **Camada de automacao**
   - jobs
   - agendamento
   - distribuicao
   - reindexacao

5. **Camada de consumo**
   - pagina publica
   - sitemap
   - RSS
   - search index
   - notificacoes/canais

## 6. Modelo de Dados Proposto

### 6.1 Alteracoes em `news_articles`

Adicionar colunas ao artigo principal para persistir metadados editoriais essenciais.

```sql
alter table public.news_articles
  add column if not exists seo_title text,
  add column if not exists meta_description text,
  add column if not exists canonical_url text,
  add column if not exists summary_short text,
  add column if not exists summary_answer text,
  add column if not exists primary_keyword text,
  add column if not exists secondary_keywords text[] not null default '{}'::text[],
  add column if not exists search_intent text,
  add column if not exists content_format text,
  add column if not exists geo_scope text,
  add column if not exists target_countries text[] not null default '{}'::text[],
  add column if not exists target_regions text[] not null default '{}'::text[],
  add column if not exists brazil_angle text,
  add column if not exists faq_items jsonb not null default '[]'::jsonb,
  add column if not exists entity_mentions jsonb not null default '{}'::jsonb,
  add column if not exists source_count integer not null default 0,
  add column if not exists fact_check_status text not null default 'pending',
  add column if not exists reviewed_by text,
  add column if not exists approved_by text,
  add column if not exists editorial_status text not null default 'draft',
  add column if not exists last_verified_at timestamptz,
  add column if not exists distributed_at timestamptz,
  add column if not exists generation_metadata jsonb not null default '{}'::jsonb,
  add column if not exists content_hash text,
  add column if not exists source_hash text;
```

### 6.2 Tabela `article_sources`

Guardar fontes por artigo de forma rastreavel.

```sql
create table if not exists public.article_sources (
  id uuid primary key default gen_random_uuid(),
  article_id text not null references public.news_articles(id) on delete cascade,
  source_type text not null,
  source_name text not null,
  source_url text,
  publisher text,
  country text,
  language text,
  accessed_at timestamptz,
  quoted_text text,
  trust_tier smallint,
  created_at timestamptz not null default now()
);

create index if not exists article_sources_article_id_idx
  on public.article_sources (article_id);
```

### 6.3 Tabela `article_versions`

Guardar historico editorial para auditoria e rollback.

```sql
create table if not exists public.article_versions (
  id uuid primary key default gen_random_uuid(),
  article_id text not null references public.news_articles(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  change_reason text,
  created_by text,
  created_at timestamptz not null default now(),
  unique (article_id, version_number)
);
```

### 6.4 Tabela `article_jobs`

Orquestrar automacoes com idempotencia.

```sql
create table if not exists public.article_jobs (
  id uuid primary key default gen_random_uuid(),
  article_id text references public.news_articles(id) on delete cascade,
  job_type text not null,
  status text not null default 'queued',
  idempotency_key text not null,
  priority smallint not null default 5,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  attempts integer not null default 0,
  run_after timestamptz,
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);
```

### 6.5 Tabela `article_distributions`

Registrar distribuicao por canal.

```sql
create table if not exists public.article_distributions (
  id uuid primary key default gen_random_uuid(),
  article_id text not null references public.news_articles(id) on delete cascade,
  channel text not null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  external_id text,
  published_url text,
  published_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);
```

## 7. Status Editorial Proposto

Substituir o uso simplificado de `draft | scheduled | published` por um workflow editorial mais rico.

Status recomendados:

- `draft`
- `generated`
- `enriched`
- `review_pending`
- `approved`
- `scheduled`
- `published`
- `distribution_pending`
- `archived`

Regra pratica:

- `status` pode continuar representando disponibilidade publica no curto prazo.
- `editorial_status` deve controlar o workflow novo.

## 8. Contrato de API Proposto

### 8.1 Estrategia

Criar `/api/v1/editorial/*` e manter os endpoints atuais como compatibilidade temporaria.

### 8.2 Endpoints novos

#### Artigos

- `POST /api/v1/editorial/articles`
  - cria pauta, rascunho ou artigo gerado

- `GET /api/v1/editorial/articles/:id`
  - retorna artigo com enrichment, fontes, workflow e jobs

- `PATCH /api/v1/editorial/articles/:id`
  - atualiza conteudo e metadados editoriais

- `POST /api/v1/editorial/articles/:id/approve`
  - marca aprovacao editorial

- `POST /api/v1/editorial/articles/:id/schedule`
  - agenda publicacao

- `POST /api/v1/editorial/articles/:id/publish`
  - publica imediatamente

#### Enrichment

- `POST /api/v1/editorial/articles/:id/enrich`
  - gera ou recalcula SEO, AEO, GEO, FAQ, resumo, entidades e checklist

- `POST /api/v1/editorial/articles/:id/validate`
  - roda validacoes editoriais sem publicar

- `POST /api/v1/editorial/articles/:id/reindex`
  - solicita reindexacao de sitemap, RSS e search index

#### Fontes

- `POST /api/v1/editorial/articles/:id/sources`
  - adiciona fonte ao artigo

- `DELETE /api/v1/editorial/articles/:id/sources/:sourceId`
  - remove fonte

#### Jobs

- `GET /api/v1/editorial/jobs`
  - lista jobs por status

- `POST /api/v1/editorial/jobs/dispatch`
  - executa lote de jobs elegiveis

### 8.3 Exemplo de payload de criacao

```json
{
  "title": "Tarifas dos EUA sobre a China pressionam cadeias globais e acendem alerta no Brasil",
  "slug": "tarifas-eua-china-impacto-brasil",
  "excerpt": "Entenda o que muda para exportadores brasileiros, dolar, commodities e inflacao apos a nova rodada de tarifas.",
  "content": "<p>...</p>",
  "category": "geopolitica",
  "authorId": "redacao-economia-global",
  "tags": ["tarifas", "china", "eua", "brasil"],
  "coverImage": "/images/news/2026/03/tarifas-eua-china.webp",
  "seoTitle": "Tarifas EUA x China: o que muda para o Brasil",
  "metaDescription": "Veja os impactos das novas tarifas dos EUA sobre a China para exportacoes, dolar, inflacao e empresas brasileiras.",
  "summaryShort": "Novas tarifas podem afetar cambio, comercio e preco de commodities no Brasil.",
  "summaryAnswer": "As tarifas aumentam o risco de pressao em cadeias globais, dolar e custos de importacao no Brasil.",
  "primaryKeyword": "tarifas eua china impacto no brasil",
  "secondaryKeywords": [
    "guerra comercial eua china",
    "tarifas para o brasil",
    "impacto no dolar"
  ],
  "searchIntent": "explicativa",
  "geoScope": "international_with_brazil_angle",
  "targetCountries": ["BR", "US", "CN"],
  "targetRegions": ["Brasil", "Estados Unidos", "China"],
  "brazilAngle": "Explicar efeitos em exportadores, cambio, inflacao e empresas brasileiras",
  "faqItems": [
    {
      "question": "Como as tarifas dos EUA sobre a China afetam o Brasil?",
      "answer": "Elas podem mexer com cambio, cadeias de suprimento, commodities e competitividade de exportadores brasileiros."
    }
  ],
  "sources": [
    {
      "sourceType": "official",
      "sourceName": "USTR",
      "sourceUrl": "https://...",
      "country": "US"
    }
  ]
}
```

## 9. Regras de Qualidade para SEO, AEO e GEO

### 9.1 SEO

Obrigatorio antes de aprovar:

- slug unico
- `seo_title` entre 45 e 65 caracteres
- `meta_description` entre 140 e 170 caracteres
- pelo menos 1 H2
- pelo menos 1 link interno sugerido ou inserido
- pelo menos 1 fonte verificavel
- canonical coerente
- imagem com proporcao OG valida

### 9.2 AEO

Obrigatorio antes de publicar:

- `summary_answer` em linguagem direta
- pelo menos 3 perguntas frequentes realmente ligadas ao conteudo
- respostas sem placeholders
- contexto explicativo para usuario leigo
- bloco "o que muda" quando o tema for complexo

### 9.3 GEO

Obrigatorio para temas internacionais com audiencia Brasil:

- `brazil_angle` preenchido
- `geo_scope` definido
- `target_countries` preenchido
- impacto no Brasil descrito no excerpt, summary ou FAQ
- entidades geograficas extraidas e persistidas

## 10. Regras Especificas para Brasil

Para conteudo internacional, a automacao deve produzir ao menos um destes angulos:

- impacto no dolar
- impacto em inflacao
- impacto em juros
- impacto em exportacoes brasileiras
- impacto em commodities relevantes para Brasil
- impacto em empresas/setores listados na B3
- impacto regulatorio ou diplomatico para Brasil

Perguntas padrao recomendadas para enrichment:

- "O que isso muda para o Brasil?"
- "Quem pode ser afetado no Brasil?"
- "Qual o impacto no dolar, inflacao ou juros?"
- "Quais setores brasileiros podem sentir mais?"
- "O efeito e imediato ou gradual?"

## 11. Pipeline de Automacao

Fluxo recomendado:

1. **ingestao**
   - pauta, fonte, texto bruto ou rascunho

2. **normalizacao**
   - slug
   - categoria
   - tags
   - autor

3. **enrichment**
   - SEO
   - AEO
   - GEO
   - entidades
   - FAQ
   - resumo curto
   - resumo answer-first

4. **validacao**
   - regras tecnicas
   - regras editoriais
   - regras Brasil

5. **revisao humana opcional**
   - aprovacao editorial
   - ajuste de copy

6. **agendamento/publicacao**
   - criar job idempotente

7. **distribuicao**
   - RSS
   - sitemap
   - search index
   - push
   - newsletter shortlist
   - social variants

8. **monitoramento**
   - logs
   - falhas
   - reprocessamento

## 12. Ordem Exata de Implementacao Neste Repositorio

### Status em 2026-04-01

- Fase 0: parcialmente concluida
- Fase 1: parcialmente concluida
- Fase 2: parcialmente concluida
- Fase 3: parcialmente concluida
- Fases 4 a 7: majoritariamente pendentes

### Fase 0 - Correcoes rapidas do estado atual

Arquivos:

- `src/app/sitemap.ts`
- `src/app/(site)/noticias/[slug]/page.tsx`
- `src/lib/autoFaq.ts`

Entregas:

- corrigir rota do sitemap para `/noticias/[slug]/`
- remover `citation` placeholder fixo
- parar de gerar FAQ generico fraco para schema publico

### Fase 1 - Schema e tipos

Arquivos:

- `supabase/migrations/*`
- `src/types/index.ts`
- `src/services/newsManager.ts`

Entregas:

- migracao com colunas novas em `news_articles`
- criacao de `article_sources`
- criacao de `article_versions`
- criacao de `article_jobs`
- criacao de `article_distributions`
- extensao do tipo `NewsArticle`

### Fase 2 - API editorial v1

Arquivos:

- `src/app/api/v1/editorial/articles/route.ts`
- `src/app/api/v1/editorial/articles/[id]/route.ts`
- `src/app/api/v1/editorial/articles/[id]/approve/route.ts`
- `src/app/api/v1/editorial/articles/[id]/schedule/route.ts`
- `src/app/api/v1/editorial/articles/[id]/publish/route.ts`
- `src/app/api/v1/editorial/articles/[id]/enrich/route.ts`
- `src/app/api/v1/editorial/articles/[id]/validate/route.ts`

Entregas:

- endpoints REST claros
- validacao de payload
- auth admin/editor
- compatibilidade temporaria com `src/app/api/articles/route.ts`

Status atual:

- concluido para `articles`, `meta`, `slug`, `openapi`, `uploads`, `enrich`, `schedule`, `publish`, `approve`, `validate`, `sources`, `jobs`
- pendente para `reindex`

### Fase 3 - Persistencia real no admin

Arquivos:

- `src/app/admin/noticias/novo/page.tsx`
- `src/app/admin/noticias/editar/[slug]/page.tsx`
- `src/services/articleApi.ts`

Entregas:

- mandar `seoTitle`, `metaDescription`, `faqItems`, `searchIntent`, `geoScope`, `brazilAngle`
- cadastrar fontes no fluxo de edicao
- preview refletir dados persistidos e nao apenas estado local

### Fase 4 - Camada de enrichment

Arquivos:

- `src/services/editorialEnrichment.ts`
- `src/lib/seo` ou `src/lib/editorial`
- `src/config/seo.ts`

Entregas:

- gerador de enrichment a partir do conteudo
- sugestao de FAQ baseada em contexto real
- extracao de entidades
- geracao de resumo answer-first
- calculo de checklist de qualidade

### Fase 5 - Jobs e automacao

Arquivos:

- `src/app/api/cron/route.ts`
- `src/services/editorialJobs.ts`
- `src/services/newsManager.ts`
- `src/app/admin/noticias/novo/page.tsx`
- `src/app/admin/noticias/editar/[slug]/page.tsx`

Entregas:

- dispatcher de jobs
- jobs `enrich_article`, `validate_article`, `publish_article`, `distribute_article`, `reindex_article`
- idempotencia por `idempotency_key`

Status atual:

- `publish_article` existe
- dispatcher existe
- teste de idempotencia de dispatch foi adicionado
- ainda faltam outros tipos de job alem de `publish_article`

### Fase 6 - Consumo publico e indexacao

Arquivos:

- `src/app/(site)/noticias/[slug]/page.tsx`
- `src/app/rss.xml/route.ts`
- `src/app/feed.xml/route.ts`
- `src/app/sitemap.ts`
- `src/app/api/search/route.ts`

Entregas:

- usar `seo_title` e `meta_description` persistidos
- usar FAQ real quando existir
- usar fontes reais no schema
- expandir search index com `summaryAnswer`, `faqItems`, `entityMentions`, `geoScope`, `author credentials`

### Fase 7 - Observabilidade e testes

Arquivos:

- `tests/integration/*`
- `tests/unit/*`
- `docs/16-api-rest.md`

Entregas:

- testes de criacao, enrichment, aprovacao, agendamento e publicacao
- testes de job idempotente
- testes de search index enriquecido
- documentacao da API v1

Status atual:

- testes dedicados de `auth`, `create`, `sources`, `enrich`, `validate`, `approve`, `publish`, `schedule`, `jobs` e `dispatch` ja existem
- teste dedicado de idempotencia do dispatcher editorial ja existe
- continua pendente cobertura de search index enriquecido

## 13. Checklist de Aceitacao por Fase

### Fase 0

- sitemap sem rota incorreta
- pagina publica sem `citation` placeholder
- schema FAQ nao usa texto generico ruim

### Fase 1

- migracoes aplicadas
- leitura e escrita funcionando com campos novos

### Fase 2

- API v1 documentada
- payload validado
- sem publicar automaticamente no create se o status for rascunho

### Fase 3

- admin salva metadados reais
- FAQ e SEO persistem no banco

### Fase 4

- enrichment gera saida deterministica e auditavel
- brasil_angle obrigatorio para temas internacionais

### Fase 5

- publicacao agendada usa job
- reprocessamento nao duplica distribuicao

### Fase 6

- schema publico usa dados persistidos
- search index atende SEO interno + AEO/GEO

### Fase 7

- cobertura minima para fluxos criticos
- docs atualizadas

## 14. Escopo Minimo da Primeira Release

Para reduzir risco, a primeira release deve incluir apenas:

- correcao de sitemap
- persistencia de `seoTitle`, `metaDescription` e `faqItems`
- `article_sources`
- `editorial_status`
- endpoint `enrich`
- endpoint `schedule`
- job `publish_article`
- pagina publica usando dados persistidos

Nao incluir na primeira release:

- distribuicao externa multi-canal
- traducao automatica
- score semantico complexo
- recomendador de links internos com ML

## 15. Resultado Esperado

Com esse plano implementado, o projeto deixa de operar como "CMS simples com schema no front" e passa a operar como plataforma editorial com:

- melhor indexacao
- maior qualidade para AI Overviews e answer engines
- contexto Brasil mais consistente
- automacao segura
- rastreabilidade e auditabilidade
- base correta para escalar volume sem degradar qualidade

## 16. Lacunas remanescentes em 2026-04-01

Os principais pontos ainda pendentes para chamar a operacao de tranquila em producao sao:

- comprovacao real na VPS
- cron editorial ativo em producao
- documentacao estrutural antiga ainda sendo limpa em partes do repositorio
- reindexacao dedicada
- observabilidade mais forte para falhas e fila
