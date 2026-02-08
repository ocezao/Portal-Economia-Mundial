# 📋 Checklist Deploy Produção - VPS Hostinger

> **Versão:** 1.0  
> **Última atualização:** 2026-02-08  
> **Target:** VPS Hostinger KVM 1+ (Ubuntu 22.04)

---

## 🎯 Status Geral

```
Progresso: ████████░░░░░░░░░░░░ 40% (60% pendente)
```

| Categoria | Status | Progresso |
|-----------|--------|-----------|
| Core Application | ⚠️ Parcial | 60% |
| Infraestrutura | ❌ Pendente | 0% |
| Performance | ❌ Pendente | 0% |
| SEO/Distribuição | ✅ Forte | 80% |
| Segurança | ⚠️ Básico | 50% |
| Monitoramento | ❌ Pendente | 0% |

---

## 🔴 CRÍTICO - Impede deploy seguro

### 1. Sistema de Imagens (Base64 → CDN)
**Status:** ❌ Pendente  
**Impacto:** Banco explode, site lento  
**Tempo estimado:** 4-6 horas

#### Checklist:
- [ ] Migrar imagens existentes de Base64 para `/public/uploads/`
- [ ] Integrar upload de notícias com API `/api/upload` (Sharp)
- [ ] Integrar upload de avatar com processamento WebP
- [ ] Criar script de migração em lote das imagens antigas
- [ ] Atualizar componentes para usar URLs de arquivo em vez de Base64
- [ ] Configurar nginx para servir `/uploads` com cache
- [ ] Adicionar `public/uploads/` ao `.gitignore`

**Arquivos a modificar:**
- `src/app/(site)/admin/noticias/novo/page.tsx`
- `src/app/(site)/admin/noticias/editar/[slug]/page.tsx`
- `src/app/(site)/perfil/page.tsx`
- `src/components/upload/ImageUploader.tsx`

---

### 2. Home SSR (Remover 'use client')
**Status:** ✅ Feito  
**Impacto:** Melhora SEO/TTFB (menos JS no primeiro render)  
**Tempo estimado:** Concluído

#### Checklist:
- [x] Converter `src/app/(site)/page.tsx` para Server Component
- [x] Mover interatividade para componente client separado (`HomePageClient.tsx`)
- [ ] (Opcional) Expandir cache de dados com tags/`unstable_cache` onde fizer sentido
- [ ] Rodar Lighthouse em ambiente proximo de producao

**Padrão a seguir:**
```typescript
// page.tsx (Server)
export default async function HomePage() {
  const [featured, latest] = await Promise.all([
    getFeaturedArticles(), // com cache
    getLatestArticles()
  ]);
  
  return (
    <>
      <HeroServer data={featured} />
      <Suspense fallback={<Skeleton />}>
        <ArticleListClient initialData={latest} />
      </Suspense>
    </>
  );
}
```

---

### 3. Cache de Dados
**Status:** ❌ Pendente  
**Impacto:** Custo Supabase alto, site lento  
**Tempo estimado:** 2-3 horas

#### Checklist:
- [ ] Instalar React Query/TanStack Query
- [ ] Configurar `unstable_cache` do Next.js para queries Supabase
- [ ] Implementar stale-while-revalidate nas listagens
- [ ] Adicionar cache para Finnhub API (5 minutos)
- [ ] Cache para dados de mercado (1 minuto)
- [ ] Invalidação de cache ao publicar notícia

**Configuração exemplo:**
```typescript
// src/lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedArticles = unstable_cache(
  async () => getAllArticles(),
  ['articles'],
  { revalidate: 60, tags: ['articles'] }
);
```

---

### 4. PM2 (Process Manager)
**Status:** ❌ Pendente  
**Impacto:** Site cai e não sobe sozinho  
**Tempo estimado:** 30 minutos

#### Checklist:
- [ ] Criar `ecosystem.config.js` na raiz
- [ ] Configurar cluster mode (usa todos os cores)
- [ ] Configurar logs com rotação
- [ ] Configurar restart automático
- [ ] Configurar memory limit (500MB)
- [ ] Adicionar health check grace period
- [ ] Testar `pm2 start ecosystem.config.js`
- [ ] Configurar PM2 startup script

**Arquivo a criar:**
- `ecosystem.config.js`

---

### 5. Nginx (Reverse Proxy)
**Status:** ❌ Pendente  
**Impacto:** Sem SSL, sem compressão, exposto diretamente  
**Tempo estimado:** 1-2 horas

#### Checklist:
- [ ] Instalar nginx no VPS
- [ ] Criar configuração `/etc/nginx/sites-available/pem`
- [ ] Configurar upstream para porta 3000
- [ ] Configurar SSL com Certbot
- [ ] Configurar gzip/brotli compression
- [ ] Configurar rate limiting para `/api`
- [ ] Configurar cache para arquivos estáticos
- [ ] Configurar headers de segurança
- [ ] Criar symlink para `sites-enabled`
- [ ] Testar configuração `nginx -t`

**Arquivos a criar:**
- `nginx/pem.conf`
- `scripts/nginx-setup.sh`

---

### 6. Health Check API
**Status:** ❌ Pendente  
**Impacto:** Não sabemos se aplicação está saudável  
**Tempo estimado:** 30 minutos

#### Checklist:
- [ ] Criar `src/app/api/health/route.ts`
- [ ] Verificar conexão com Supabase
- [ ] Verificar espaço em disco
- [ ] Retornar uptime e versão
- [ ] Retornar 503 se unhealthy
- [ ] Configurar PM2 para usar health check
- [ ] Testar endpoint `/api/health`

**Arquivo a criar:**
- `src/app/api/health/route.ts`

---

## 🟡 IMPORTANTE - Degradam experiência

### 7. Sitemap Dinâmico
**Status:** ✅ Feito  
**Impacto:** Google descobre noticias novas via sitemap index + particoes  
**Tempo estimado:** Concluído

#### Checklist:
- [x] Sitemap index em `/sitemap.xml` (`src/app/sitemap.xml/route.ts`)
- [x] Particoes em child sitemaps (`src/app/sitemaps/*`)
- [x] Sitemap de noticias paginado com imagens (`src/app/sitemaps/news/[page]/route.ts`)
- [ ] Validar em Search Console apos ter dominio

**Arquivo a criar:**
- `src/app/sitemap.ts`

---

### 8. Robots.txt Dinâmico
**Status:** ✅ Feito  
**Impacto:** Bloqueia rotas internas e reduz crawl de tracking params  
**Tempo estimado:** Concluído

#### Checklist:
- [x] `src/app/robots.ts`
- [x] Bloqueio de rotas internas (`/admin/`, `/app/`, `/api/`, etc)
- [x] Higiene para tracking params (`utm_`, `gclid`, `fbclid`, etc)
- [ ] Validar em producao (com `NEXT_PUBLIC_SITE_URL` setado)

**Arquivo a criar:**
- `src/app/robots.ts`

---

### 9. CI/CD Deploy Automatizado
**Status:** ❌ Pendente  
**Impacto:** Deploy manual = erros, downtime  
**Tempo estimado:** 2-3 horas

#### Checklist:
- [ ] Criar `scripts/deploy.sh`
- [ ] Configurar SSH key no GitHub
- [ ] Criar GitHub Action `.github/workflows/deploy.yml`
- [ ] Testar deploy automático no push para main
- [ ] Configurar rollback automático se health check falhar
- [ ] Adicionar notificação de deploy (opcional)

**Arquivos a criar:**
- `scripts/deploy.sh`
- `.github/workflows/deploy.yml`

---

### 10. Sistema de Comentários
**Status:** ❌ Pendente (só placeholder)  
**Impacto:** Engajamento zero  
**Tempo estimado:** 2-3 horas

#### Checklist:
- [ ] Escolher provedor (Giscus = gratuito + GitHub)
- [ ] Criar repositório para discussions
- [ ] Instalar pacote `@giscus/react`
- [ ] Integrar na página de notícia
- [ ] Configurar mapeamento (slug → discussion)
- [ ] Testar postar comentário
- [ ] Configurar moderação

**Alternativa gratuita:** Cusdis (self-hosted)

---

### 11. Newsletter Funcional
**Status:** ⚠️ Só UI (form sem backend)  
**Impacto:** Não captura leads  
**Tempo estimado:** 2-3 horas

#### Checklist:
- [ ] Criar conta Buttondown (1.000 subs grátis)
- [ ] Criar API Route `/api/newsletter/subscribe`
- [ ] Integrar com Buttondown API
- [ ] Validar email no backend
- [ ] Prevenir duplicatas
- [ ] Adicionar confirmação (double opt-in)
- [ ] Testar fluxo completo

**Arquivos a modificar/criar:**
- `src/app/api/newsletter/subscribe/route.ts`
- Componente de newsletter existente

---

### 12. Busca Funcional
**Status:** ✅ Feito  
**Impacto:** Busca funcional com FTS (RPC) + fallback  
**Tempo estimado:** Concluído

#### Opções (escolher uma):

**Opção A: Fuse.js (Gratuito, client-side)**
- [ ] Instalar `fuse.js`
- [ ] Criar índice de busca com títulos/resumos
- [ ] Implementar busca fuzzy
- [ ] Limitar a 1000 artigos recentes

**Opção B: Algolia DocSearch (Gratuito open source)**
- [ ] Aplicar ao programa DocSearch
- [ ] Instalar `@docsearch/react`
- [ ] Configurar crawler

**Arquivo a criar:**
- `src/components/search/SearchBox.tsx`

Implementacao atual:
- Pagina: `src/app/(site)/busca/page.tsx` (noindex, canonical/OG/Twitter)
- Service: `src/services/newsManager.ts` (RPC FTS + fallback `ilike`)

---

### 13. Logs Estruturados
**Status:** ❌ Pendente (só console)  
**Impacto:** Difícil debugar em produção  
**Tempo estimado:** 1-2 horas

#### Checklist:
- [ ] Instalar `pino` ou `winston`
- [ ] Configurar níveis de log (error, warn, info, debug)
- [ ] Configurar rotação de logs (diária)
- [ ] Separar logs de erro e acesso
- [ ] Adicionar correlation ID por request
- [ ] Sanitizar dados sensíveis (senhas, tokens)
- [ ] Configurar PM2 para usar logs em arquivo

**Arquivos a criar:**
- `src/lib/logger.ts`
- `logs/.gitkeep`

---

## 🟢 BOM TER - Melhoram qualidade

### 14. PWA (Progressive Web App)
**Status:** ❌ Pendente  
**Impacto:** Experiência mobile inferior  
**Tempo estimado:** 3-4 horas

#### Checklist:
- [ ] Criar `public/manifest.json`
- [ ] Configurar `next-pwa`
- [ ] Criar ícones (192x192, 512x512)
- [ ] Configurar service worker
- [ ] Implementar offline fallback
- [ ] Adicionar prompt de instalação
- [ ] Testar Lighthouse (PWA category)

**Arquivos a criar/modificar:**
- `public/manifest.json`
- `public/icons/*`
- `next.config.js` (configurar PWA)

---

### 15. Testes Automatizados
**Status:** ❌ Pendente  
**Impacto:** Regressões frequentes  
**Tempo estimado:** 8-12 horas

#### Checklist:
- [ ] Instalar Jest + React Testing Library
- [ ] Configurar `jest.config.js`
- [ ] Escrever testes para utils (slugify, date format)
- [ ] Escrever testes para componentes críticos
- [ ] Instalar Cypress/Playwright para E2E
- [ ] Criar teste E2E: fluxo de login
- [ ] Criar teste E2E: criar notícia
- [ ] Configurar GitHub Action para rodar testes
- [ ] Definir coverage mínimo (70%)

**Arquivos a criar:**
- `jest.config.js`
- `cypress.config.js` ou `playwright.config.ts`
- `src/**/*.test.ts`
- `.github/workflows/test.yml`

---

### 16. Rate Limiting
**Status:** ❌ Pendente  
**Impacto:** Vulnerável a spam/DDoS  
**Tempo estimado:** 1-2 horas

#### Checklist:
- [ ] Instalar `@upstash/ratelimit` ou `rate-limiter-flexible`
- [ ] Configurar rate limit por IP (100 req/15min)
- [ ] Configurar rate limit por usuário autenticado
- [ ] Rate limit específico para `/api/upload` (5 uploads/hora)
- [ ] Rate limit para login (5 tentativas/15min)
- [ ] Retornar 429 com Retry-After header

**Arquivos a modificar:**
- `src/middleware.ts` (novo)
- API routes críticas

---

### 17. Backup Automatizado
**Status:** ❌ Pendente  
**Impacto:** Perda de dados = fim do negócio  
**Tempo estimado:** 2-3 horas

#### Checklist:
- [ ] Criar script `scripts/backup.sh`
- [ ] Backup diário do Supabase (dump SQL)
- [ ] Backup semanal das imagens (`/uploads`)
- [ ] Upload backups para S3 (AWS/Backblaze B2)
- [ ] Configurar cron job no VPS
- [ ] Testar restore a partir de backup
- [ ] Configurar alerta se backup falhar

**Arquivos a criar:**
- `scripts/backup.sh`
- `scripts/restore.sh`

---

### 18. Monitoramento (Uptime)
**Status:** ❌ Pendente  
**Impacto:** Site cai e não sabemos  
**Tempo estimado:** 1-2 horas

#### Checklist:
- [ ] Criar conta UptimeRobot (50 monitores grátis)
- [ ] Configurar monitor para homepage
- [ ] Configurar monitor para `/api/health`
- [ ] Configurar alerta por email/Discord
- [ ] Configurar alerta por SMS (opcional)
- [ ] Adicionar badge de uptime no README

**Alternativa:** Better Uptime (gratuito)

---

### 19. Error Tracking (Sentry)
**Status:** ❌ Pendente  
**Impacto:** Erros em produção passam despercebidos  
**Tempo estimado:** 1 hora

#### Checklist:
- [ ] Criar conta Sentry (5k erros/mês grátis)
- [ ] Instalar `@sentry/nextjs`
- [ ] Configurar DSN no `.env`
- [ ] Configurar source maps
- [ ] Adicionar contexto de usuário (ID, email)
- [ ] Configurar alertas para novos erros
- [ ] Ignorar erros irrelevantes (ExtensionLoad)

---

### 20. CSP (Content Security Policy)
**Status:** ⚠️ Básico (só X-Frame-Options)  
**Impacto:** XSS vulnerável  
**Tempo estimado:** 2-3 horas

#### Checklist:
- [ ] Definir política CSP completa
- [ ] Configurar `script-src` (só inline com nonce)
- [ ] Configurar `style-src` (só inline com nonce)
- [ ] Configurar `img-src` (incluir Supabase Storage)
- [ ] Configurar `connect-src` (APIs permitidas)
- [ ] Adicionar `nonce` nos scripts do Next.js
- [ ] Testar com CSP evaluator
- [ ] Adicionar reporting para violations

**Configuração nginx:**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'nonce-{nonce}' https://www.googletagmanager.com; ..." always;
```

---

## 📊 ORDEM DE IMPLEMENTAÇÃO SUGERIDA

### Fase 1: Fundação (Semana 1) - CRÍTICO
```
Dia 1: PM2 + Nginx + Health Check
Dia 2: Fix Imagens Base64
Dia 3: Fix Home SSR
Dia 4: Cache de Dados
Dia 5: Testes integrados
```

### Fase 2: SEO/Distribuição (Semana 2) - IMPORTANTE
```
Dia 1: Sitemap + Robots
Dia 2: Comentários (Giscus)
Dia 3: Newsletter funcional
Dia 4: Busca (Fuse.js)
Dia 5: CI/CD Deploy
```

### Fase 3: Qualidade (Semana 3) - BOM TER
```
Dia 1: PWA básico
Dia 2: Rate Limiting
Dia 3: Logs estruturados
Dia 4: Sentry + UptimeRobot
Dia 5: CSP completo
```

### Fase 4: Manutenção (Semana 4)
```
Dia 1: Backup automatizado
Dia 2: Testes automatizados
Dia 3: Documentação final
Dia 4: Performance audit
Dia 5: Go live!
```

---

## 💰 CUSTOS MENSAIS ESTIMADOS (Produção)

| Serviço | Plano | Custo |
|---------|-------|-------|
| VPS Hostinger KVM 2 | 2 cores, 8GB RAM | $6.99/mês |
| Supabase | Free tier (500MB) | $0 |
| Cloudinary | Free (25GB) | $0 |
| Sentry | Developer (5k erros) | $0 |
| UptimeRobot | Free (50 monitores) | $0 |
| Buttondown | Free (1k subs) | $0 |
| Backup S3 | ~5GB | ~$0.50/mês |
| **TOTAL** | | **~$7.50/mês** |

---

## 🎯 DEFINIÇÃO DE "PRONTO"

A aplicação está **100% pronta para produção** quando:

- [ ] Todos os itens CRÍTICO estão feitos
- [ ] 80% dos itens IMPORTANTE estão feitos
- [ ] Lighthouse score > 90 (Performance, SEO, A11y)
- [ ] Uptime de 99.9% por 7 dias consecutivos
- [ ] Deploy automático funcionando
- [ ] Documentação de operações atualizada

---

## 📞 CONTINGÊNCIAS

### Se KVM 1 não aguentar:
- Upgrade para KVM 2 ($2/mês a mais)
- Ou adicionar swap (solução temporária)

### Se Supabase Free estourar:
- Arquivar notícias antigas (> 2 anos)
- Comprimir imagens mais agressivamente
- Upgrade para paid ($25/mês)

### Se tráfego explodir:
- Adicionar CloudFlare (gratuito)
- Ativar cache agressivo no Nginx
- Considerar Vercel Pro ($20/mês) em vez de VPS

---

## 📝 NOTAS FINAIS

1. **Não pule os CRÍTICOS** - Sem eles, o site vai quebrar
2. **Teste em staging primeiro** - Nunca deploy direto em produção
3. **Monitore os logs** - Os primeiros dias são críticos
4. **Tenha um rollback plan** - Snapshot do VPS antes do deploy
5. **Documente tudo** - Você vai esquecer daqui 6 meses

---

**Responsável:** _________________  
**Data de início:** _________________  
**Previsão de conclusão:** _________________
