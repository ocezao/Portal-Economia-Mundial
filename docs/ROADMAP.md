# 📊 Roadmap do Projeto - Portal Econômico Mundial

## Avaliação Atual

| Área | Nota Atual | Nota Final | Peso |
|------|------------|------------|------|
| Performance | 9/10 | 9.5/10 | 25% |
| SEO | 5/10 | 9/10 | 20% |
| Funcionalidades | 6/10 | 9/10 | 20% |
| UX/Mobile | 7/10 | 8/10 | 15% |
| Engajamento | 5/10 | 8/10 | 10% |
| Infraestrutura | 8/10 | 8.5/10 | 10% |
| **TOTAL** | **6.5/10** | **9/10** | 100% |

---

## Funcionalidades já Implementadas ✅

### Core
- [x] Framework Next.js 15 (downgrade do 16 resolve Turbopack bug)
- [x] React 19 + Tailwind CSS
- [x] Supabase (Auth + Storage)
- [x] PostgreSQL local (VPS)
- [x] Docker + Docker Compose (Collector corrigido: Node 20)
- [x] Nginx com SSL
- [x] PWA
- [x] Dark Mode

### SEO
- [x] Sitemap dinâmico ✅
- [x] Robots.txt
- [x] Schema.org NewsArticle
- [x] OpenGraph + Twitter Cards
- [x] Canonical URLs
- [x] Schema.org FAQPage ✅ NOVO
- [x] Página "Como Produzimos" ✅ NOVO
- [x] Google Search Console ✅ CONFIGURADO
- [x] 10 Novas Subcategorias (Alto CPC) ✅ NOVO
- [x] Hub Pages por tema ✅ NOVO
- [x] RSS por categoria ✅ NOVO

### Funcionalidades
- [x] Newsletter (SMTP Hostinger)
- [x] Comentários
- [x] Compartilhamento social
- [x] Busca
- [x] Calendário econômico
- [x] Dados de mercado (Finnhub)
- [x] Metabase analytics
- [x] RSS Feed

### Engajamento
- [x] OneSignal Push Notifications ✅ ATIVO (script no head + fallback)
- [x] Comentários
- [x] Newsletter

---

## Próximas Implementações

### Fase 1: SEO Avançado ✅ CONCLUÍDO
- [x] Sitemap dinâmico
- [x] Robots.txt melhorado
- [x] Schema.org expandido
- [x] Canonical URLs

### Fase 2: Engajamento ✅ CONCLUÍDO
- [x] OneSignal Push Notifications (script)

### Fase 3: Funcionalidades Extras (Futuro)
- [x] RSS por categoria ✅ NOVO
- [x] Hub Pages por tema ✅ NOVO
- [ ] Chat IA (HuggingFace)
- [ ] Busca avançada (Algolia)
- [ ] Analytics tempo real
- [x] Monitoramento uptime (UptimeRobot)

---

## Ferramentas e Credenciais

### Credenciais Já Configuradas
| Serviço | Variável | Status |
|---------|----------|--------|
| OneSignal | `NEXT_PUBLIC_ONESIGNAL_APP_ID` | ✅ Configurado |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL` | ✅ Configurado |
| Finnhub | `NEXT_PUBLIC_FINNHUB_API_KEY` | ✅ Configurado |
| Metabase | `METABASE_URL` | ✅ Configurado |
| SMTP | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | ✅ Configurado |

### Ferramentas Gratuitas Disponíveis
| Serviço | Limite Free | Uso |
|---------|-------------|-----|
| OneSignal | 10K push/mês | Push notifications |
| Algolia | 10K buscas/mês | Busca avançada |
| HuggingFace | 1K msgs/mês | Chat IA |
| UptimeRobot | 5 monitors | Monitoramento |
| Cloudflare | CDN free | CDN + Cache |

---

## Métricas de Sucesso

### Performance
- TTFB: < 0.5s ✅ (atual: 0.22s)
- LCP: < 2.5s
- PageSpeed: > 80

### SEO
- Sitemap: ✅ Dinâmico
- Robots.txt: ✅ Otimizado
- Schema.org: ✅ NewsArticle + FAQPage
- Google Search Console: ✅ Configurado

### Engajamento
- Push: ✅ Ativo (OneSignal)
- Newsletter: ✅ Funcional

---

## Notas

- Todas as credenciais sensíveis estão no `.env` (não commitado)
- O projeto usa arquitetura híbrida: Supabase (Auth/Storage) + PostgreSQL local (dados)
- Performance atual: TTFB 0.22s (muito bom!)
- ✅ Build corrigido: Next.js 15 resolve bug do Turbopack
- ✅ Collector Docker: corrigido para Node 20 + todas deps
- ✅ Página "Como Produzimos" criada para E-E-A-T
- ✅ Schema FAQ implementado

---

## Contato

- **Site**: https://cenariointernacional.com.br
- **Admin**: https://cenariointernacional.com.br/admin
- **Metabase**: https://metabase.cenariointernacional.com.br
- **API**: https://api.cenariointernacional.com.br
