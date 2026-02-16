# 🚀 Guia Completo de Migração para VPS

**Cenario Internacional (CIN)** - Documento de migração para VPS

---

## 📋 Resumo Executivo

Este guia descreve o processo completo de migração do Portal Econômico Mundial de ambiente de desenvolvimento/desenvolvimento para uma VPS de produção.

### Agente Especializados Criados

| Agente | Descrição | Local |
|--------|-----------|-------|
| `vps-analisador-infra` | Análise de infraestrutura | `.agents/skills/vps-analisador-infra/` |
| `vps-configurador` | Configuração inicial VPS | `.agents/skills/vps-configurador/` |
| `vps-deploy-docker` | Deploy com Docker | `.agents/skills/vps-deploy-docker/` |
| `vps-deploy-pm2` | Deploy com PM2 | `.agents/skills/vps-deploy-pm2/` |
| `vps-database` | Banco de dados | `.agents/skills/vps-database/` |
| `vps-seguranca` | Segurança e SSL | `.agents/skills/vps-seguranca/` |
| `vps-monitoramento` | Monitoramento | `.agents/skills/vps-monitoramento/` |

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                           VPS                                   │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Nginx      │    │  Next.js     │    │  Collector   │      │
│  │  (80/443)    │◄──►│  (PM2/Docker)│    │  (Analytics) │      │
│  │              │    │  Porta 3000  │    │  Porta 3001  │      │
│  │  • SSL       │    │              │    │              │      │
│  │  • Gzip      │    │              │    │              │      │
│  │  • Cache     │    │              │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Serviços Externos                       │      │
│  │  • Supabase (Auth + DB Principal)                    │      │
│  │  • Finnhub API (Cotações)                            │      │
│  │  • GNews API (Notícias)                              │      │
│  │  • (Serviço de IA removido - usar GNews diretamente) │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  Opcional na VPS: PostgreSQL 15 (Analytics)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes do Projeto

### 1. Frontend (Next.js 16+)
- **Local**: `/` (raiz)
- **Porta**: 3000 (produção)
- **Build**: `npm run build`
- **Start**: `npm start` ou `pm2 start`

### 2. Analytics Collector (Node.js/Fastify)
- **Local**: `/collector`
- **Porta**: 3001
- **Função**: Coleta de eventos de analytics

### 3. MCP Server (Opcional)
- **Local**: `/mcp-server`
- **Uso**: Integração com assistentes IA

### 4. Supabase (Externo)
- **NÃO migrar** - mantém-se hospedado no Supabase
- Auth, dados principais, edge functions

---

## 🖥️ Requisitos de Hardware

### Recomendado para Produção

| Recurso | Especificação |
|---------|---------------|
| CPU | 2 vCPU |
| RAM | 4 GB |
| Disco | 50 GB SSD |
| Tráfego | 2 TB/mês |
| Sistema | Ubuntu 22.04 LTS |

### Mínimo (Teste/Dev)

| Recurso | Especificação |
|---------|---------------|
| CPU | 1 vCPU |
| RAM | 2 GB |
| Disco | 20 GB SSD |
| Tráfego | 1 TB/mês |

---

## 🔌 Portas Necessárias

| Porta | Serviço | Descrição |
|-------|---------|-----------|
| 22 | SSH | Acesso administrativo |
| 80 | HTTP | Redirect para HTTPS |
| 443 | HTTPS | Acesso principal |
| 3000 | Next.js | App principal (interno) |
| 3001 | Collector | Analytics (opcional) |
| 3002 | Metabase | Dashboard (opcional) |

---

## 📝 Variáveis de Ambiente

### Obrigatórias

```bash
# Frontend (public)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
NEXT_PUBLIC_FINNHUB_API_KEY=sua-chave-finnhub
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com

# Backend (private)
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
SUPABASE_DB_PASSWORD=sua-senha-db
FINNHUB_API_KEY=sua-chave-finnhub
```

### Opcionais

```bash
# Analytics (se usar PostgreSQL local)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=pem_analytics
POSTGRES_USER=analytics
POSTGRES_PASSWORD=senha-forte

# OneSignal (Push)
NEXT_PUBLIC_ONESIGNAL_APP_ID=seu-app-id

# AdSense
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-0000000000
```

---

## 🛣️ Roadmap de Migração

### Fase 1: Preparação (1-2 dias)

- [ ] Escolher provedor VPS (DigitalOcean, Linode, Vultr, AWS, etc)
- [ ] Registrar/transferir domínio
- [ ] Configurar DNS (A record apontando para VPS)
- [ ] Gerar chaves SSH
- [ ] Preparar variáveis de ambiente

### Fase 2: Configuração VPS (1 dia)

```bash
# 1. Acessar VPS
ssh root@seu-vps-ip

# 2. Executar setup completo
./setup-vps-complete.sh cenariointernacional.com.br admin@email.com
```

**Tarefas:**
- [ ] Atualizar sistema
- [ ] Criar usuário deploy
- [ ] Instalar Node.js 20 + PM2
- [ ] Instalar Docker (opcional)
- [ ] Configurar firewall
- [ ] Configurar fail2ban
- [ ] Configurar Nginx
- [ ] Hardening SSH

### Fase 3: Deploy (1 dia)

**Opção A: PM2 (Recomendado)**

```bash
# Clone do repositório
git clone git@github.com:seu-usuario/cenario-internacional.git /var/www/cenario-internacional
cd /var/www/cenario-internacional

# Configurar ambiente
cp .env.example .env.production
# Editar .env.production

# Deploy
./scripts/pm2-deploy.sh cenariointernacional.com.br

# SSL
certbot --nginx -d cenariointernacional.com.br
```

**Opção B: Docker**

```bash
# Configurar
docker-compose -f docker-compose.prod.yml up -d

# SSL
./scripts/setup-ssl.sh cenariointernacional.com.br admin@email.com
```

### Fase 4: Pós-Deploy (1 dia)

- [ ] Verificar health check
- [ ] Configurar SSL
- [ ] Testar todas as rotas
- [ ] Configurar backups
- [ ] Configurar monitoramento
- [ ] Configurar alertas
- [ ] Documentar acessos

---

## 🔒 Segurança

### Checklist de Segurança

- [ ] SSL/TLS A+ (testar em ssllabs.com)
- [ ] Headers de segurança configurados
- [ ] Firewall ativo (UFW)
- [ ] Fail2Ban configurado
- [ ] SSH hardened (sem root, chaves apenas)
- [ ] Rate limiting ativo
- [ ] Variáveis de ambiente protegidas (chmod 600)
- [ ] Atualizações automáticas
- [ ] Backups criptografados

### Headers de Segurança

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 📊 Monitoramento

### Ferramentas

| Ferramenta | Uso | Porta |
|------------|-----|-------|
| PM2 | Gerenciamento de processos | CLI |
| Nginx logs | Access/error logs | - |
| Netdata | Métricas em tempo real | 19999 |
| Health Check | Verificação de saúde | /api/health |

### Health Check

```bash
# Verificar saúde
curl https://cenariointernacional.com.br/api/health

# Agendado no cron
*/5 * * * * /usr/local/bin/health-check.sh
```

---

## 💾 Backup

### O que fazer backup

- [ ] Código fonte (git)
- [ ] Variáveis de ambiente
- [ ] Banco PostgreSQL (se local)
- [ ] Logs
- [ ] Configurações Nginx

### Script de Backup

```bash
#!/bin/bash
# backup-diario.sh

BACKUP_DIR="/backups/cenario-internacional"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
pg_dump -U analytics pem_analytics > $BACKUP_DIR/db_$DATE.sql

# Backup arquivos
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/cenario-internacional

# Limpar antigos (> 7 dias)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

---

## 🚨 Troubleshooting

### Problemas Comuns

**1. App não inicia**
```bash
# Verificar logs
pm2 logs
journalctl -u pm2-deploy

# Verificar porta
lsof -i :3000
```

**2. Nginx erro 502**
```bash
# Verificar se app está rodando
pm2 status
curl http://localhost:3000/api/health

# Verificar config Nginx
nginx -t
```

**3. SSL não funciona**
```bash
# Verificar certificado
certbot certificates
certbot renew --dry-run

# Verificar config
nginx -t
systemctl restart nginx
```

---

## 📚 Recursos Adicionais

### Documentação Completa

- `README.md` - Visão geral do projeto
- `docs/06-deploy-hostinger.md` - Deploy em hospedagem compartilhada
- `docs/_security/SECURITY_AUDIT_REPORT.md` - Auditoria de segurança
- `docs/_migration/MIGRATION_LOG.md` - Histórico de migrações

### Skills dos Agentes

Cada skill em `.agents/skills/` contém:
- Configurações detalhadas
- Scripts prontos para uso
- Checklists específicos
- Comandos de troubleshooting

---

## ✅ Checklist Final de Migração

### Pré-migração
- [ ] Backup completo do ambiente atual
- [ ] Lista de todas as variáveis de ambiente
- [ ] DNS configurado e propagado
- [ ] VPS provisionado e acessível

### Migração
- [ ] Código clonado no servidor
- [ ] Dependências instaladas
- [ ] Build realizado com sucesso
- [ ] Variáveis de ambiente configuradas
- [ ] App iniciando sem erros
- [ ] Nginx configurado
- [ ] SSL funcionando
- [ ] Domínio apontando corretamente

### Pós-migração
- [ ] Health check respondendo 200
- [ ] Todas as páginas carregando
- [ ] API funcionando
- [ ] Autenticação funcionando
- [ ] Analytics coletando dados
- [ ] Backups configurados
- [ ] Monitoramento ativo
- [ ] Documentação atualizada

---

## 📞 Suporte

Para problemas durante a migração:

1. Consulte os logs: `pm2 logs`, `/var/log/nginx/error.log`
2. Verifique o health check: `/api/health`
3. Consulte a skill específica em `.agents/skills/`
4. Revise a documentação em `/docs`

---

**Última atualização**: $(date)
**Versão**: 1.0
**Status**: Pronto para migração
