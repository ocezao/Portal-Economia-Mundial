# Atualizacao Temporaria (Leitura No Arquivo)

Data: 2026-02-08

Este arquivo existe para voce conseguir ler o estado atual completo quando o chat corta mensagens.

## SEO Portal-Grade (Bloco Atual Aplicado)

### 1) Canonical + OpenGraph + Twitter: padronizacao

- Removido canonical global do root para evitar canonical incorreto em paginas que nao definem metadata:
  - `src/app/layout.tsx`
- Home agora define metadata completa (canonical/OG/Twitter) via `generateMetadata()`:
  - `src/app/page.tsx`
- Rotas indexaveis com paginacao mantem canonical correto:
  - `/noticias/?page=N` (page > 1 vira canonical com `?page=N`, page 1 canonical sem query)
    - `src/app/noticias/page.tsx`
  - `/categoria/[slug]/?page=N` (mesma regra)
    - `src/app/categoria/[slug]/page.tsx`

### 2) Noindex em rotas finas/internas via metadata (alem do robots.ts)

Foram adicionados `layout.tsx` por rota para garantir `robots: { index: false }` mesmo quando a pagina e Client Component:

- Admin (noindex + canonical/OG/Twitter):
  - `src/app/admin/layout.tsx`
- Area logada (noindex + canonical/OG/Twitter):
  - `src/app/app/layout.tsx`
  - `src/app/perfil/layout.tsx`
  - `src/app/preferencias/layout.tsx`
  - `src/app/configuracoes/layout.tsx`
- Auth (noindex + canonical/OG/Twitter):
  - `src/app/(auth)/login/layout.tsx`
  - `src/app/(auth)/cadastro/layout.tsx`
- Busca (continua noindex, mas com canonical/OG/Twitter para preview consistente):
  - `src/app/busca/page.tsx`

### 3) Canonical e duplicacao: pagina fina de busca

- Busca usa canonical fixo `/busca/` e continua `noindex` (boa pratica para pagina de resultados internos):
  - `src/app/busca/page.tsx`

### 4) JSON-LD: validacao e coerencia (URLs/imagens)

- `NewsArticle` agora garante URLs absolutas (imagem, url, logo) e tem fallback de imagem:
  - `src/config/seo.ts`
- `ItemList` em listagens ajustado para usar `item` em `ListItem` (em vez de `url`) para ficar alinhado ao schema:
  - `src/config/seo.ts`

### 5) robots.ts: higiene para bloquear rotas/parametros sem valor

- Mantidos bloqueios de rotas internas e adicionados padrões para parametros de tracking:
  - `utm_*`, `gclid`, `fbclid`, `msclkid`, `yclid`
  - `src/app/robots.ts`

### 6) Fix colateral: remocao de <title> solto em paginas Client (admin)

Em App Router, `<title>` solto em JSX nao e o caminho correto e pode causar comportamento estranho de head.
Esses `<title>` foram removidos para depender do metadata via layout de rota (admin e noindex):

- `src/app/admin/page.tsx`
- `src/app/admin/diagnostico/page.tsx`
- `src/app/admin/usuarios/page.tsx`
- `src/app/admin/noticias/novo/page.tsx`
- `src/app/admin/noticias/editar/[slug]/page.tsx`

## Observacao importante (sem VPS/dominio)

Para sitemap/canonical/host ficarem 100% corretos em producao, voce precisa definir:

- `NEXT_PUBLIC_SITE_URL` (ex: `https://seudominio.com`)

Localmente, o projeto cai para `http://localhost:5173` via `getSiteUrl()`.

