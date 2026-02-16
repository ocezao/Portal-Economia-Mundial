# Roadmap De Escala (Sem VPS/Dominio)

Objetivo: evoluir este projeto para aguentar volumes altos (centenas de milhares a milhoes de visitas/dia) com custo baixo, usando alternativas gratuitas sempre que existir opcao gratuita viavel, e **sem depender de VPS/dominio** neste momento.

Este arquivo tem 2 partes:
1. Estado atual (o que ja foi implementado).
2. Passo-a-passo completo, em **ordem de dependencia**, do que falta fazer antes de ir para VPS/dominio.

Observacoes:
- Itens "VPS/Dominio" aparecem no final apenas como referencia, mas nao devem ser executados agora.
- Onde houver "Escolha A/B", eu coloquei o caminho recomendado para o seu objetivo (escala + custo baixo).

---

## 1) Estado Atual (Implementado)

### 1.1 Renderizacao e Cache (reduzir custo por visita)
- Home movida para Server Component com `revalidate` (ISR).
- UI interativa da home separada em componente Client (sem `useEffect` inicial para buscar tudo no browser).
- Pagina de destaque movida para Server Component com `revalidate`.

Impacto:
- Menos JS no cliente para "primeiro render".
- Menos chamadas repetidas ao banco/API em cada visita.
- Melhor TTFB/SEO e melhor custo em infra pequena.

### 1.2 Consultas no banco (parar de "puxar tudo e filtrar")
- Paginacao e filtros feitos no banco (range/limit) em vez de buscar tudo.
- Categoria filtrada via join no banco.
- Busca com FTS (RPC) com fallback para `ilike`.
- Admin lista conteudo incluindo rascunhos.

Impacto:
- Query mais barata e previsivel.
- Evita gargalo quando o volume de noticias crescer.

### 1.3 Snapshots (desacoplar APIs externas do trafego)
- Criada tabela `external_snapshots` para cachear respostas (json) no Supabase.
- Services para ler snapshots no app.
- Script `scripts/refresh-external-snapshots.mjs` para atualizar snapshots com Service Role.
- GitHub Actions agendado para rodar o refresh (a cada 15 min).

Impacto:
- Usuarios nao disparam custo/latencia de API externa (Finnhub) por visita.
- Uma VPS pequena fica muito mais viavel.

### 1.4 Upload de imagem (sem filesystem local e com auth)
- API `/api/upload` exige `Authorization: Bearer <token>`.
- Permissao de upload limitada a `admin` (via metadata de usuario).
- Rate-limit em memoria para upload.
- Upload vai para Supabase Storage (bucket configuravel).
- Componente `ImageUploader` manda token na request.

Impacto:
- Evita abuso e upload anonimo.
- Funciona igual em serverless/VPS.

### 1.5 Observabilidade basica (gratuita)
- `src/app/error.tsx` envia telemetry best-effort.
- Endpoint `/api/telemetry/error` salva em tabela `app_errors`.
- Rate-limit em memoria no endpoint.

Impacto:
- Voce passa a ter sinal minimo de erros reais sem pagar SaaS.

### 1.6 CI basico
- Workflow de CI para lint + build.
- Dependencias e configs de testes (Vitest/Playwright) iniciadas.
- Teste unitario inicial para `searchArticles` criado.

Gap atual:
- Aumentar cobertura de unit tests (principalmente rotas API e helpers criticos).
- Manter E2E smoke como gate manual (workflow_dispatch) para economizar tempo/minutos.

---

## 2) O Que Falta (Sem VPS/Dominio) em Ordem de Dependencia

Esta ordem e importante: ela evita retrabalho e garante que cada passo destrava o proximo.

### Etapa 0: Baseline de Execucao Local (sem deploy)

0.1 Padronizar env vars e falhas "seguras"
- Garantir que paginas Server Component nao "crasham" quando Supabase/env nao estiver configurado.
- Padronizar `isSupabaseConfigured` e comportamento "degradado".

0.2 Scripts de desenvolvimento
- Um comando para rodar lint/build/test.
- Um comando para rodar e2e (Playwright) apontando para um server local.

Aceite:
- Rodar localmente sem env deve renderizar paginas que nao dependem de conteudo dinamico sem quebrar.

Dependencias:
- Nenhuma (apenas codigo).

---

### Etapa 1: Testes (fundacao para evoluir sem quebrar)

1.1 Unit tests (Vitest)
- Cobrir:
  - `newsManager` (paginacao, busca, drafts, fallback sem Supabase).
  - Funcoes utilitarias criticas de formacao de dados.
  - Rotas API criticas (`/api/upload` e `/api/telemetry/error`) com mocks.

1.2 E2E smoke tests (Playwright) (RECOMENDADO)
- Criar `tests/e2e/smoke.spec.ts` para garantir que as paginas criticas renderizam:
  - `/` abre e nao cai em pagina de erro.
  - `/destaque` abre.
  - Uma rota de listagem de noticias abre.
  - Uma rota de artigo (quando existir fixture/dado) abre.

1.3 Workflows no GitHub Actions
Escolha:
- A) (Recomendado) Rodar Unit tests em todo push/PR; E2E apenas manual (`workflow_dispatch`) para economizar minutos.
- B) Rodar Unit + E2E em todo push/PR (mais caro em tempo de pipeline).

Status agora:
- Unit em push/PR: `.github/workflows/tests.yml`
- E2E manual: `.github/workflows/e2e.yml`

Aceite:
- PR nao passa se quebrar build ou testes.

Dependencias:
- Nenhuma (somente codigo + configs).

---

### Etapa 2: SEO e Distribuicao (o que traz trafego organico de verdade)

2.1 Sitemap dinamico (sem depender de dominio)
- Criar `sitemap.xml` como **sitemap index** e particionar em varios sitemaps:
  - estaticas
  - categorias
  - autores
  - noticias (paginado)
- Incluir imagens no sitemap de noticias (image sitemap) quando houver `cover_image`.

2.2 robots.txt (base)
- Permitir indexacao.
- Bloquear rotas admin.

2.3 Metadados por pagina (Open Graph / Twitter / canonical)
- `metadata` no App Router para:
  - Home
  - Categoria
  - Artigo
  - Destaque / Em alta
  - Mercados / Dados economicos / Calendario economico
  - Categorias / Sobre / Paginas legais / Contato / Carreiras
  - Editorial

2.4 Dados estruturados (JSON-LD)
- `NewsArticle`/`Article` nas paginas de artigo.
- `BreadcrumbList` e `ItemList` em listagens (noticias, categoria, destaque, em alta, categorias).

2.5 Feed RSS/Atom
- Endpoint RSS para:
  - Ultimas noticias (geral)
  - Por categoria (opcional)

Status agora:
- Sitemap portal-grade:
  - index: `src/app/sitemap.xml/route.ts`
  - child sitemaps: `src/app/sitemaps/*`
- `src/app/robots.ts` ja existe.
- RSS implementado: `src/app/rss.xml/route.ts` e alias `src/app/feed.xml/route.ts`
- RSS por categoria implementado: `src/app/rss/categoria/[slug]/rss.xml/route.ts`
- Descoberta do RSS no `<head>`: `src/app/layout.tsx`
- Snapshots externos incluem chaves:
  - `finnhub_market_news:general`
  - `finnhub_market_news:economic`
  - `finnhub_earnings_calendar:next_7_days`
  - `finnhub_economic_calendar:next_7_days`
  - `finnhub_indices:global`
  - `finnhub_commodities:main`
  - `finnhub_sectors:main`
- Listagens com JSON-LD:
  - `src/app/noticias/page.tsx`
  - `src/app/categoria/[slug]/page.tsx`
  - `src/app/destaque/page.tsx`
  - `src/app/em-alta/page.tsx`
  - `src/app/categorias/page.tsx`

Aceite:
- Google consegue rastrear facilmente.
- Conteudo compartilhado em redes mostra preview correto.
- Cresce para dezenas/centenas de milhares de URLs sem estourar limite de sitemap unico.

Dependencias:
- Banco e queries de artigos (ja existe).

Proximo passo (SEO de cobertura total):
- Auditar rotas publicas restantes e padronizar canonical/OG/Twitter (sem depender de defaults).
- Garantir `NEXT_PUBLIC_SITE_URL` em producao para canonical/sitemaps/robots corretos.

Status agora (cobertura):
- `Busca` esta `noindex` e tem canonical/OG/Twitter: `src/app/busca/page.tsx`
- `Editorial` tem canonical/OG/Twitter: `src/app/editorial/page.tsx`
- Canonical global removido do root (evita canonical errado herdado): `src/app/layout.tsx`
- Rotas internas (admin/app/auth/perfil/etc) com `noindex` via layout (alem do robots): `src/app/*/layout.tsx` e `src/app/(auth)/*/layout.tsx`
- Higiene do `robots` para tracking params (`utm_`, `gclid`, etc): `src/app/robots.ts`
- JSON-LD com URLs/imagens absolutas e `ItemList` coerente: `src/config/seo.ts`

---

### Etapa 3: Performance de Front (Core Web Vitals em escala)

3.1 Reduzir bundle e custo de render
- Revisar componentes Client (evitar tornar paginas inteiras Client sem necessidade).
- Lazy-load do que for nao critico.

Status agora:
- Widgets pesados da home sao lazy-loaded via `next/dynamic`: `src/app/HomePageClient.tsx`
- Rotas antes client foram convertidas para server (menos JS): mercados/dados/calendario/em-alta

3.2 Otimizacao de imagens
- Garantir que imagens usem `next/image`.
- Politica clara de tamanhos e `sizes`.

3.3 Cache agressivo de estaticos
- Configurar headers (quando tiver infra) mas desde ja:
  - Evitar assets com nomes "nao-hash".

Aceite:
- LCP e CLS bons em mobile.

Dependencias:
- Nao depende de VPS.

---

### Etapa 4: Conteudo e Operacao (para publicar muito sem travar)

4.1 Fluxo editorial
- Rascunho -> revisao -> publicado.
- Validacoes (titulo, slug, excerpt, categoria, imagem).

4.2 Slug estavel e canonical
- Se slug mudar, redirecionar 301 do antigo para o novo.

Status agora:
- Implementado mecanismo de redirect de slug (best-effort):
  - Tabela: `supabase/migrations/20260207170000_news_slug_redirects.sql`
  - Upsert ao editar: `src/services/newsManager.ts`
  - Redirect no artigo: `src/app/noticias/[slug]/page.tsx`

4.3 Paginas de categoria e listagem com paginacao real
- Infinite scroll opcional, mas com URLs paginadas indexaveis.

Status agora:
- `/noticias` paginado via `?page=`: `src/app/noticias/page.tsx`
- `/categoria/[slug]` paginado via `?page=`: `src/app/categoria/[slug]/page.tsx`

Aceite:
- Publicar nao quebra SEO.
- Conteudo antigo continua acessivel e indexado.

Dependencias:
- Data layer pronto (ja avancou).

---

### Etapa 5: Ads (AdSense) sem matar performance

5.1 Estrategia de ads (sem dominio ainda, mas preparar layout)
- Reservar slots previsiveis:
  - Top banner (acima da dobra)
  - In-article (no meio)
  - Sidebar (desktop)
  - Sticky (cuidado com UX)

5.2 Carregamento eficiente
- Carregar scripts de ads de forma a nao travar LCP (defer/afterInteractive, conforme permitido).

5.3 Medicao (gratuita)
- Eventos basicos (cliques, scroll depth) localmente (ou via GA gratuito futuramente).

Aceite:
- Layout nao "pula" (evita CLS).

Dependencias:
- Performance/SEO bem resolvidos.
- Dominio sera necessario para configurar AdSense de verdade, mas preparar UI e slots nao depende.

---

### Etapa 6: Seguranca Basica (sem WAF, mas sem ser ingenuo)

6.1 Rate limiting melhor que memoria (ainda gratis)
Escolha:
- A) (Recomendado) Rate-limit no Supabase (tabela de contagem por janela) para endpoints sensiveis.
- B) Memoria (ja existe) e aceitar que reinicio perde estado.

6.2 Harden em endpoints
- `/api/upload`: tamanho max, tipos permitidos, validar magic bytes.
- `/api/telemetry/error`: schema estrito e truncar campos grandes.

Status agora:
- `/api/upload` tem clamp de `width/height/quality` e limite de dimensao: `src/app/api/upload/route.ts`
- `/api/telemetry/error` rejeita payload grande (best-effort) e trunca strings: `src/app/api/telemetry/error/route.ts`

Aceite:
- Menos superficie para abuso mesmo antes de ter Cloudflare.

Dependencias:
- Supabase (ja existe).

---

### Etapa 7: Backups e Recuperacao (gratuito / minimo viavel)

7.1 Export periodico (gratis)
- Dump de conteudo (SQL) manual ou via GitHub Actions (se possivel/permitido) ou ao menos checklist operacional.
- Export JSON via Service Role (nao depende de VPS):
  - Guia: `docs/ops/BACKUP_SEM_VPS.md`
  - Script: `scripts/export-supabase-content.mjs`

7.2 Versionamento de migrations
- Ja existe. Padronizar processo para rodar migrations em ambientes.

Aceite:
- Se quebrar algo, voce consegue restaurar.

Dependencias:
- Supabase.

---

## 3) Itens Que Dependem de VPS/Dominio (NAO FAZER AGORA)

Somente para voce saber o que vem depois:
- DNS + Cloudflare (Free): cache, WAF basico, rate limiting, bot fight (limitado), rules.
- Nginx no VPS: gzip/brotli, cache, headers, http2/http3 se aplicavel.
- SSL (Lets Encrypt) + renovacao automatica.
- Observabilidade no VPS (Prometheus/Grafana/Netdata, gratuitos).
- CDN e cache na borda (Cloudflare free) para assets.
- Banco/redis dedicados quando necessario.

---

## 4) Como Medir "5k/mes no AdSense" (sem chute cego)

Formula simples (estimativa):
- Receita mensal = (Pageviews/1000) * RPM
- RPM varia MUITO por pais/nicho/dispositivo/temporada/qualidade de trafego.

Rotas praticas (gratuitas) para descobrir o RPM real do seu caso:
1. Comecar com ads em pequeno volume (quando tiver dominio) e medir RPM real.
2. Fazer conteudo SEO-first e medir crescimento de pageviews por categoria.
3. Otimizar layout de ads sem piorar CWV (performance).

O que preparar agora (sem dominio):
- Layout com slots consistentes.
- Performance e SEO para crescer organico.

---

## 5) Checklist (Sem VPS/Dominio)

- [ ] Etapa 0: baseline local e scripts
- [ ] Etapa 1: unit tests + e2e smoke + workflows
- [ ] Etapa 2: sitemap + robots + metadata + JSON-LD + RSS
- [ ] Etapa 3: performance (bundle, images, CWV)
- [ ] Etapa 4: fluxo editorial + canonical/redirects + paginacao indexavel
- [ ] Etapa 5: preparar ads (slots, CLS, carregamento)
- [ ] Etapa 6: rate-limit persistente + hardening endpoints
- [ ] Etapa 7: backups e processo de migrations
