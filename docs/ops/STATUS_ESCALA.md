# Status De Escala (Sem VPS/Dominio)

Data: 2026-02-08

Este arquivo existe para voce bater o olho e saber:
- o que ja esta feito
- o que ainda falta
- qual e o proximo passo pratico

Nota atual vs grandes portais (infra + SEO + base tecnica, sem contar volume de conteudo): 8.0 / 10

---

## Feito

- ISR/Server Components na home e destaque (menos custo por visita).
- Queries do Supabase otimizadas (paginacao no banco, filtro por categoria no banco).
- Busca com FTS (RPC) com fallback para `ilike`.
- Cache de APIs externas via `external_snapshots` + job no GitHub Actions.
- Snapshots agora incluem: noticias (general/economic), earnings, calendario economico, indices, commodities, setores.
- Upload via Supabase Storage com auth + rate-limit em memoria.
- Telemetria de erro (tabela `app_errors` + endpoint) com hardening contra payload grande:
  - `src/app/api/telemetry/error/route.ts`
  - migration `supabase/migrations/20260207173000_app_errors_referrer.sql` (coluna `referrer`)
- CI basico (lint/build).
- Fundacao de testes (Vitest/Playwright) e 1 unit test inicial.
- Workflows novos:
  - Unit tests em push/PR: `.github/workflows/tests.yml`
  - E2E smoke manual: `.github/workflows/e2e.yml`
- Smoke test E2E criado: `tests/e2e/smoke.spec.ts`
- RSS/Feed implementado:
  - `src/app/rss.xml/route.ts`
  - `src/app/feed.xml/route.ts`
  - RSS por categoria: `src/app/rss/categoria/[slug]/rss.xml/route.ts`
  - Link no `<head>`: `src/app/layout.tsx`
- Rotas antes client agora renderizam no servidor (SEO/performance):
  - `src/app/em-alta/page.tsx`
  - `src/app/mercados/page.tsx`
  - `src/app/dados-economicos/page.tsx`
  - `src/app/calendario-economico/page.tsx`
- Formularios client com wrapper server para SEO:
  - `src/app/fale-conosco/page.tsx`
  - `src/app/trabalhe-conosco/page.tsx`
- JSON-LD em listagens:
  - `src/app/noticias/page.tsx`
  - `src/app/categoria/[slug]/page.tsx`
  - `src/app/destaque/page.tsx`
  - `src/app/categorias/page.tsx`
  - `src/app/em-alta/page.tsx`
- Paginacao indexavel (URLs com `?page=`):
  - `src/app/noticias/page.tsx`
  - `src/app/categoria/[slug]/page.tsx`
- Redirect 301 de slug antigo para novo (SEO):
  - migration `supabase/migrations/20260207170000_news_slug_redirects.sql`
  - upsert no update `src/services/newsManager.ts`
  - redirect no artigo `src/app/noticias/[slug]/page.tsx`
- Sitemap "portal-grade" (sitemap index + particoes + imagens):
  - index: `src/app/sitemap.xml/route.ts`
  - estaticas: `src/app/sitemaps/static.xml/route.ts`
  - categorias: `src/app/sitemaps/categories.xml/route.ts`
  - autores: `src/app/sitemaps/authors.xml/route.ts`
  - noticias paginadas + image sitemap: `src/app/sitemaps/news/[page]/route.ts`
- SEO portal-grade (canonical/OG/Twitter + noindex + robots + JSON-LD):
  - Removido canonical global do root (evita canonical errado herdado): `src/app/layout.tsx`
  - Home com metadata completa: `src/app/page.tsx`
  - `Editorial` com Twitter metadata: `src/app/editorial/page.tsx`
  - `Busca` com canonical/OG/Twitter + `noindex` (e bloqueio em robots): `src/app/busca/page.tsx` + `src/app/robots.ts`
  - Rotas internas com `noindex` via layout (alem do robots): `src/app/admin/layout.tsx`, `src/app/app/layout.tsx`, `src/app/perfil/layout.tsx`, `src/app/preferencias/layout.tsx`, `src/app/configuracoes/layout.tsx`, `src/app/(auth)/login/layout.tsx`, `src/app/(auth)/cadastro/layout.tsx`
  - Higiene do `robots` para tracking params (`utm_`, `gclid`, etc): `src/app/robots.ts`
  - JSON-LD com URLs/imagens absolutas e `ItemList` coerente: `src/config/seo.ts`
  - Remocao de `<title>` solto em paginas client do admin (head consistente): `src/app/admin/*/page.tsx`

---

## Falta (em ordem)

1. Consolidar testes
- Aumentar cobertura de unit tests (newsManager + rotas API).
- Adicionar smoke de mais rotas no Playwright (listagem e artigo quando houver fixture).

2. SEO de cobertura total (portal-grade)
- Auditoria final de rotas publicas restantes para garantir 100% de cobertura (canonical + OG + Twitter) sem depender de defaults.
- Padronizar `NEXT_PUBLIC_SITE_URL` em prod (sitemap/canonical/host corretos).

3. Performance de front (CWV)
- Revisar componentes Client vs Server.
- Imagens e `next/image` com `sizes`.
- Evitar CLS (especialmente onde entrara AdSense).

4. Operacao editorial
- Fluxo rascunho/revisao/publicado.
- Slug e redirects 301 se slug mudar.
- Paginacao indexavel nas listagens.

5. Ads (preparacao sem dominio)
- Definir slots e layout (sem gerar CLS).
- Preparar carregamento para nao matar LCP.

6. Seguranca sem WAF
- Rate-limit persistente (Supabase) para endpoints sensiveis.
- Validacao mais estrita de payloads em `/api/upload` e `/api/telemetry/error`.

7. Backups/processo
- Checklist de export/backup.
- Processo consistente de migrations por ambiente.

Referencia completa: `docs/ops/ROADMAP_ESCALA_SEM_VPS.md`

Backup (sem VPS):
- Guia: `docs/ops/BACKUP_SEM_VPS.md`
- Script: `scripts/export-supabase-content.mjs`
