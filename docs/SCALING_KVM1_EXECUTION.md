# Execucao: Escala KVM 1 (Sem VPS/Dominio)

Este documento e o plano **completo** (nao reduzido) para deixar o projeto pronto para escalar em uma VPS pequena (Hostinger KVM 1), **sem depender de dominio/VPS agora**.

## Ordem por dependencias

### 0) Pre-requisitos (base)
1. Banco/Supabase configurado (mesmo que ainda nao esteja em producao).
2. Variaveis de ambiente definidas (local e CI).
3. Migrations aplicadas no Supabase.

Entregavel:
- Projeto ainda roda sem Supabase configurado (rotas publicas nao quebram), mas quando configurado consegue executar tudo abaixo.

### 1) Snapshots (cache externo) "de verdade"
Objetivo:
- Nao chamar Finnhub por usuario.
- Ter dados externos pre-computados e lidos do banco.

Passos:
1. Criar tabela `external_snapshots` (ja existe migration).
2. Padronizar chaves de snapshot (exemplos):
   - `finnhub_market_news:general`
   - `finnhub_earnings_calendar:next_7_days`
   - `finnhub_indices:global`
   - `finnhub_commodities:main`
3. Criar um **job** que atualiza snapshots periodicamente:
   - Opcao A (recomendada sem VPS): GitHub Actions `schedule` chamando um script Node.
   - Opcao B: Supabase Edge Function agendada (requer deploy via Supabase CLI).
4. Trocar consumo no app para ler snapshots (sem fallback em paginas criticas, apenas fallback tolerante em dev).

Entregavel:
- Snapshots atualizados automaticamente.
- Home/listagens nao consomem Finnhub diretamente em runtime.

### 2) Busca FTS (Postgres)
Objetivo:
- Busca rapida e relevante sem `ilike` em tabela grande.

Passos:
1. Adicionar coluna `search_vector` (tsvector) e indice GIN.
2. (Opcional completo) Ajustar ranking por peso (titulo > excerpt > content).
3. Atualizar `searchArticles` para usar `.textSearch()`/RPC em vez de `ilike`.

Entregavel:
- Busca escala com volume e retorna resultados melhores.

### 3) Observabilidade (gratuita, sem VPS)
Objetivo:
- Ter visibilidade de erros e performance sem depender de infraestrutura propria.

Passos (completo):
1. Erros no App Router:
   - `src/app/error.tsx` (ja existe)
   - capturar e enviar eventos para um destino persistente
2. Destino persistente (sem VPS):
   - Opcao A: tabela `app_errors` no Supabase + endpoint `POST /api/telemetry/error` com rate limit
   - Opcao B: Sentry (free) via `@sentry/nextjs` (requer instalar deps e configurar)
3. Padronizar "sanitizacao" (nao enviar PII/secrets).

Entregavel:
- Erros ficam consultaveis (dashboard/SQL) e voce descobre regressao rapido.

### 4) Testes automatizados + CI real
Objetivo:
- Bloquear regressao de SEO/perf/seguranca.

Passos:
1. Unit (Vitest):
   - Config + scripts
   - Testes criticos (minimo "completo"): `newsManager` (busca/paginacao), snapshots, auth guard do upload
2. E2E (Playwright):
   - Smoke tests: Home, noticia, busca, login, admin (se aplicavel)
3. CI:
   - Atualizar workflow para rodar `test` e `test:e2e` em PR.

Entregavel:
- PR que quebra algo importante falha no CI.

### 5) Hardening final (sem VPS/dominio)
Objetivo:
- Fechar pontas soltas antes de publicar.

Passos:
1. Storage:
   - bucket `uploads` criado
   - policy definida (public vs signed)
2. Rate limits:
   - endpoints sensiveis com rate limit (upload, telemetry)
3. Documentar checklist de deploy (para quando VPS/dominio existirem).

## Variaveis de ambiente (minimo)

Server-only (nao expor no browser):
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_UPLOAD_BUCKET` (default `uploads`)
- `FINNHUB_API_KEY` (recomendado; evita depender de `NEXT_PUBLIC_FINNHUB_API_KEY` em jobs)

Publicas (browser):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_FINNHUB_ENABLED`
- `NEXT_PUBLIC_SITE_URL` (obrigatorio em producao para canonical/sitemaps/robots corretos)

## Status atual
Ver `RESPOSTA_ESCALA_KVM1.md` para "o que ja foi aplicado" e "o que falta".
