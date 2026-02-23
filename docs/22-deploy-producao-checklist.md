# 📋 Checklist Deploy Produção - VPS Hostinger

> **Versão:** 2.0  
> **Última atualização:** 2026-02-19  
> **Target:** VPS Hostinger KVM 1+ (Ubuntu 22.04)

---

## 🎯 Status Geral

```
Progresso: ████████████████████ 95% (5% pendente)
```

| Categoria | Status | Progresso |
|-----------|--------|-----------|
| Core Application | ✅ Completo | 100% |
| Infraestrutura | ✅ Completo | 100% |
| Performance | ✅ Completo | 95% |
| SEO/Distribuição | ✅ Completo | 95% |
| Segurança | ✅ Completo | 95% |
| Monitoramento | ⚠️ Configurar | 80% |

---

## ✅ IMPLEMENTADO

### Core Application
- [x] Next.js App Router
- [x] React 19 + TypeScript
- [x] Tailwind CSS + shadcn/ui
- [x] Supabase Auth + Database
- [x] Sistema de notícias completo
- [x] Ticker de mercado (Finnhub)
- [x] Sistema de comentários (Supabase + RLS)
- [x] Newsletter (API + Buttondown)
- [x] Sistema de uploads (Sharp + Supabase Storage)
- [x] Sistema de favoritos/histórico
- [x] Tradução automática (10 idiomas)

### Infraestrutura
- [x] Docker + Docker Compose (produção)
- [x] Nginx (pem.conf + ssl.conf)
- [x] Scripts de deploy (deploy.sh + rollback.sh)
- [x] Scripts de backup (backup.sh + restore.sh)
- [x] Script de setup nginx (nginx-setup.sh)
- [x] Health Check API (/api/health)

### Performance
- [x] Home SSR (Server Component)
- [x] Cache com tags (src/lib/cache.ts)
- [x] Otimização de imagens (Sharp, WebP)
- [x] Headers de cache
- [x] Bundle analyzer

### SEO/Distribuição
- [x] Sitemap dinâmico (index + partições)
- [x] Robots.txt dinâmico
- [x] JSON-LD (NewsArticle, Organization)
- [x] OpenGraph + Twitter Cards
- [x] RSS Feed
- [x] PWA Manifest
- [x] Service Worker
- [x] Push Notifications (OneSignal) ✅ ATIVO (script no head)

### Segurança
- [x] Headers de segurança (X-Frame-Options, CSP, etc)
- [x] Rate limiting in-memory
- [x] Sanitização de inputs
- [x] Validação com Zod
- [x] RLS no Supabase
- [x] Logs estruturados

### CI/CD
- [x] GitHub Actions (CI)
- [x] Testes unitários (Vitest)
- [x] Testes E2E (Playwright)
- [x] Lint + TypeCheck
- [x] Security audit
- [x] Workflow de deploy

---

## ⚠️ PENDENTE (Configuração Externa)

### 1. Configurar Sentry (Error Tracking)
**Tempo:** 15 min

1. Criar conta em https://sentry.io
2. Criar projeto Next.js
3. Copiar DSN para `.env`:
   ```
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   ```
4. Instalar dependência:
   ```bash
   npm install @sentry/nextjs
   ```

### 2. Configurar UptimeRobot (Monitoramento)
**Tempo:** 10 min

1. Criar conta em https://uptimerobot.com
2. Adicionar monitores:
   - `https://cenariointernacional.com.br/` (5 min)
   - `https://cenariointernacional.com.br/api/health` (1 min)
   - `https://cenariointernacional.com.br/rss.xml` (30 min)
3. Configurar alertas por email

### 3. Configurar GitHub Secrets (Deploy Automático)
**Tempo:** 10 min

No repositório GitHub > Settings > Secrets:
- `SSH_PRIVATE_KEY` - Chave SSH privada para acessar VPS
- `VPS_HOST` - IP ou domínio da VPS
- `VPS_USER` - Usuário SSH (ex: `deploy`)

### 4. Configurar SSL (Certbot na VPS)
**Tempo:** 5 min

```bash
sudo certbot --nginx -d cenariointernacional.com.br -d www.cenariointernacional.com.br
```

### 5. Primeiro Deploy na VPS
**Tempo:** 30 min

```bash
# SSH na VPS
ssh usuario@vps

# Clonar repositório
git clone https://github.com/seu-repo/cin.git /var/www/pem
cd /var/www/pem

# Configurar .env
cp .env.example .env
nano .env

# Instalar dependências
npm ci

# Build Docker
docker compose build web

# Iniciar containers
docker compose up -d web

# Configurar Nginx
sudo ./scripts/nginx-setup.sh

# Configurar SSL
sudo certbot --nginx -d cenariointernacional.com.br -d www.cenariointernacional.com.br
```

### 6. Configurar Backup Cron
**Tempo:** 5 min

```bash
# Editar crontab
crontab -e

# Adicionar backup diário às 2h
0 2 * * * cd /var/www/portal && ./scripts/backup.sh full >> /var/log/portal/backup.log 2>&1
```

---

## 📁 ARQUIVOS CRIADOS

```
nginx/
├── pem.conf           # Configuração Nginx
└── ssl.conf           # Configuração SSL

scripts/
├── nginx-setup.sh     # Setup Nginx + Certbot
├── deploy.sh          # Deploy zero-downtime
├── rollback.sh        # Rollback emergencial
├── backup.sh          # Backup DB + uploads
└── restore.sh         # Restauração

src/lib/
├── cache.ts           # Cache com tags
├── sentry.ts          # Error tracking
└── logger.new.ts      # Logger estruturado

.github/workflows/
└── deploy.yml         # Deploy automático

docs/
└── RUNBOOK.md         # Manual de operações
```

---

## 💰 CUSTOS MENSAIS

| Serviço | Plano | Custo |
|---------|-------|-------|
| VPS Hostinger KVM 1 | 1 core, 4GB RAM | $4.99/mês |
| Supabase | Free (500MB) | $0 |
| Sentry | Developer (5k erros) | $0 |
| UptimeRobot | Free | $0 |
| OneSignal | Free (10k subs) | $0 |
| Buttondown | Free (1k subs) | $0 |
| **TOTAL** | | **~$5/mês** |

---

## 🎯 DEFINIÇÃO DE "PRONTO"

A aplicação está **100% pronta para produção** quando:

- [x] Todos os itens acima implementados
- [x] CI/CD passando
- [x] Testes passando
- [ ] SSL configurado na VPS
- [ ] Health check respondendo 200
- [ ] UptimeRobot configurado
- [ ] Primeiro deploy realizado

---

## 📞 SUPORTE

Ver **[RUNBOOK.md](./RUNBOOK.md)** para:
- Comandos úteis
- Troubleshooting
- Procedimentos de deploy
- Contatos

---

**Responsável:** _________________  
**Data de início:** _________________  
**Previsão de go-live:** _________________
