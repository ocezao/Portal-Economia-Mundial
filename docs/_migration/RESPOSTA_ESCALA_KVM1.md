# Preparacao Para Escalar No Hostinger VPS KVM 1 - Cenario Internacional

Voce escolheu a opcao: **preparar para escalar no KVM 1**.

Objetivo: reduzir drasticamente o custo por visita (CPU/DB/rede) e deixar o site altamente cacheavel, para que quando voce colocar na VPS (1 vCPU) o projeto aguente crescer sem travar.

## Ultima atualizacao (2026-02-08)

Resumo do que foi aplicado agora no repo:

1. Home agora carrega dados no servidor (ISR)
- `src/app/(site)/page.tsx` virou Server Component com `revalidate = 60`.
- UI interativa foi separada para `src/app/(site)/HomePageClient.tsx` (sem `useEffect` para buscar noticias).

2. Pagina Destaque agora e Server Component (ISR)
- `src/app/(site)/destaque/page.tsx` virou Server Component com `revalidate = 300`.

3. `newsManager` mais escalavel (menos "baixar tudo e filtrar")
- `src/services/newsManager.ts`
  - `getArticlesByCategory` filtra no banco via join.
  - `searchArticles` busca no banco (ilike) com limit.
  - `getArticlesPaginated` pagina no banco com `range()` + `count`.
  - Leituras retornam `[]/null` quando Supabase nao esta configurado, para nao quebrar paginas server-side.

4. Admin ajustado para paginacao no banco incluindo drafts
- `src/app/(site)/admin/page.tsx` chama `getArticlesPaginated(..., { includeDrafts: true })`.

5. Base para snapshots (cache) de dados externos (Finnhub)
- Migration: `supabase/migrations/20260207130000_create_external_snapshots.sql`
- Service: `src/services/economics/snapshots.ts`
- Home usa snapshot para market news com fallback: `src/app/(site)/page.tsx`
 - Job (GitHub Actions schedule): `.github/workflows/refresh-snapshots.yml`
 - Script de refresh: `scripts/refresh-external-snapshots.mjs`

6. Upload de imagem endurecido e pronto para VPS
- `src/app/api/upload/route.ts`
  - exige `Authorization: Bearer <token>` e role `admin`
  - rate limit basico por IP (memoria)
  - upload vai para Supabase Storage (bucket configuravel por `SUPABASE_UPLOAD_BUCKET`)
- `src/components/upload/ImageUploader.tsx` envia token no header.

7. Pagina de erro do App Router
- `src/app/error.tsx`
 - Endpoint de telemetry: `src/app/api/telemetry/error/route.ts`
 - Migration para persistir erros: `supabase/migrations/20260207143000_create_app_errors.sql`

8. CI minimo (gratuito)
- `.github/workflows/ci.yml` (npm ci + lint + build)

9. Busca FTS (base)
- Migration: `supabase/migrations/20260207140000_news_articles_search_fts.sql`
- `src/services/newsManager.ts` tenta RPC `search_news_articles_ids` e cai para `ilike` se nao existir.

10. SEO portal-grade (sem VPS/dominio)
- Canonical/OG/Twitter padronizados por rota (sem canonical global incorreto):
  - `src/app/layout.tsx`
  - `src/app/(site)/page.tsx`
- Rotas internas e finas com `noindex` via metadata/layout:
  - `src/app/(site)/admin/layout.tsx`
  - `src/app/(site)/app/layout.tsx`
  - `src/app/(site)/perfil/layout.tsx`
  - `src/app/(site)/preferencias/layout.tsx`
  - `src/app/(site)/configuracoes/layout.tsx`
  - `src/app/(auth)/login/layout.tsx`
  - `src/app/(auth)/cadastro/layout.tsx`
  - `src/app/(site)/busca/page.tsx`
- `robots` com higiene para tracking params (`utm_`, `gclid`, etc):
  - `src/app/robots.ts`
- JSON-LD com URLs/imagens absolutas e `ItemList` coerente:
  - `src/config/seo.ts`

## O que ainda falta (ainda sem VPS/dominio)

1. Snapshots completos (sem fallback) + cobertura total
- Job por GitHub Actions ja existe, mas falta:
  - configurar secrets no GitHub (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FINNHUB_API_KEY`)
  - trocar mais paginas/componentes que ainda chamam Finnhub no client para ler snapshots quando fizer sentido
  - opcional: ativar `EXTERNAL_SNAPSHOTS_REQUIRE=true` em producao para evitar fallbacks

2. SEO/Distribuicao: dominio/URL base em producao
- Definir `NEXT_PUBLIC_SITE_URL` em producao para canonical/sitemaps/robots corretos.

3. Consolidar testes automatizados
- Aumentar cobertura de unit tests (newsManager + rotas API).
- Expandir smoke E2E para mais rotas (Playwright).

4. Supabase Storage (bucket + policies)
- Bucket `uploads` precisa existir.
- Definir se vai ser public (URL direta) ou private (signed URL).

## O que depende de VPS e/ou dominio (nao aplicado aqui)

1. Nginx reverse proxy, cache, compressao e headers no host.
2. Cloudflare (cache/CDN/WAF) e SSL/HSTS.
3. Medicao real de RPM/AdSense e ajustes finos (CWV, viewability, posicionamento de ads) com site no ar e indexado.

## Plano completo (ordem por dependencias)
- `docs/ops/SCALING_KVM1_EXECUTION.md`
