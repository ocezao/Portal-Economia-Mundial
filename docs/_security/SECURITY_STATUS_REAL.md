# STATUS REAL DE SEGURANCA (CIN)

Data: 2026-02-17

Este documento registra, de forma pragmatica, o que esta implementado hoje no repo e quais lacunas ainda existem.

## O que ja existe (implementado)

- Headers basicos em `next.config.js`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-DNS-Prefetch-Control: on`
- Upload protegido por auth (admin) em `src/app/api/upload/route.ts`.
- Rate limit best-effort in-memory no upload em `src/app/api/upload/route.ts`.
- Sanitizacao de nomes exibidos no retorno do upload em `src/app/api/upload/route.ts` (usa `escapeHtml` + `sanitizeFilename`).
- Busca/listagem de arquivos de storage com checagem de permissao admin (via `profiles.role`) em `src/app/api/admin-files/route.ts`.
- Publicacao server-side de posts agendados (admin-only) em `src/app/api/admin-posts/route.ts`.
- Regras para posts ficarem vinculados a um autor/profissional (authors) no service de noticias: `src/services/newsManager.ts`.

## O que NAO existe (pendencias)

### Critico (recomendado antes de producao)

- CSP (Content-Security-Policy) nao esta definida.
  - Onde: `next.config.js` (headers) ou `src/middleware.ts` (preferivel para evoluir por rota).
- HSTS (Strict-Transport-Security) nao esta definido.
  - Observacao: HSTS so faz sentido com HTTPS garantido no dominio.
- Permissions-Policy nao esta definido.
- Middleware de seguranca global nao esta presente (opcional, mas recomendado).
  - Estado atual: nao existe `src/middleware.ts`.

### Importante

- Validacao de payloads com Zod ainda nao esta padronizada em todas as API Routes admin.
  - Exemplo: padronizar schemas para rotas em `src/app/api/**/route.ts`.
- Proxy de APIs externas (ex: Finnhub) para evitar chaves no cliente pode ser expandido conforme necessidade.

## Upload (pontos de seguranca)

Arquivo: `src/app/api/upload/route.ts`

- Raster: converte para WebP via Sharp e remove metadados por padrao.
- SVG: aceito e armazenado como `.svg` (sem Sharp). Existe validacao basica para bloquear SVGs com conteudo claramente perigoso:
  - `<script ...>`
  - atributos `on*=` (handlers inline)
  - `javascript:`
  - `<foreignObject ...>`
  - `<!ENTITY ...>`

Observacao: SVG seguro 100% exige uma politica mais ampla (ex: sanitizacao estrutural ou servir com headers adequados). A regra atual e um baseline para uso interno/admin.

## Checklist rapido (manual)

1. Confirmar que APIs admin exigem bearer token:
   - `src/app/api/admin-files/route.ts`
   - `src/app/api/admin-posts/route.ts`
   - `src/app/api/admin-users/route.ts`
2. Confirmar que upload aceita SVG e raster:
   - `src/app/api/upload/route.ts`
3. Confirmar que posts agendados sao publicados server-side:
   - `src/app/api/admin-posts/route.ts` (acao `publish_scheduled`)
4. Confirmar que criacao/edicao de posts exige autor/profissional ativo:
   - `src/services/newsManager.ts`

