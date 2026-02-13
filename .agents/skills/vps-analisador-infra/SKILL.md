---
name: vps-analisador-infra
description: Análise completa de infraestrutura do projeto Portal Econômico Mundial para migração VPS. Use quando precisar identificar todos os componentes, dependências, requisitos de hardware, serviços externos (Supabase, Finnhub), portas utilizadas e arquitetura geral do sistema antes de planejar a migração.
---

# VPS Analisador de Infraestrutura

Skill especializada em analisar e documentar a infraestrutura completa do Portal Econômico Mundial para migração VPS.

## Responsabilidades

1. **Mapear todos os componentes** do projeto (frontend, backend, serviços)
2. **Identificar dependências** externas e internas
3. **Calcular requisitos de hardware** (CPU, RAM, disco)
4. **Documentar portas** e serviços necessários
5. **Listar variáveis de ambiente** obrigatórias

## Componentes do Projeto

### 1. Frontend (Next.js)
- **Framework**: Next.js 16+ com App Router
- **Porta**: 5173 (dev) / 3000 (produção)
- **Build**: Output standalone ou export estático
- **Node**: 20+
- **Memória mínima**: 512MB (dev), 1GB (produção)

### 2. Analytics Collector (Node.js/Fastify)
- **Local**: `/collector`
- **Porta**: 3000 (padrão)
- **Banco**: PostgreSQL 15
- **Dependências**: Fastify, pg, cors

### 3. MCP Server (Model Context Protocol)
- **Local**: `/mcp-server`
- **Uso**: Integração com assistentes IA
- **Runtime**: Node.js 20+

### 4. Supabase Edge Functions
- **Local**: `/supabase/functions`
- **Funções**: admin-users, admin-authors, ai-news
- **Deploy**: Via CLI do Supabase (não roda na VPS)

### 5. Banco de Dados (Opcional na VPS)
- **Tipo**: PostgreSQL 15 (para analytics)
- **Porta**: 5432
- **Alternativa**: Usar Supabase hospedado

## Serviços Externos Obrigatórios

| Serviço | Uso | Alternativa VPS |
|---------|-----|-----------------|
| Supabase | Auth + Dados principais | Manter externo |
| Finnhub API | Cotações mercado | Manter externo |
| GNews API | Notícias IA | Manter externo |
| servi�o de IA | Geração de conteúdo | Manter externo |

## Variáveis de Ambiente Críticas

```bash
# Obrigatórias
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_FINNHUB_API_KEY

# Produção (server-only)
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_PASSWORD
FINNHUB_API_KEY
```

## Requisitos de Hardware (Estimativa)

### Mínimo (Dev/Teste)
- **CPU**: 1 vCPU
- **RAM**: 2 GB
- **Disco**: 20 GB SSD
- **Tráfego**: 1 TB/mês

### Recomendado (Produção)
- **CPU**: 2 vCPU
- **RAM**: 4 GB
- **Disco**: 50 GB SSD
- **Tráfego**: 2 TB/mês

### Alto Tráfego
- **CPU**: 4 vCPU
- **RAM**: 8 GB
- **Disco**: 100 GB SSD
- **CDN**: Cloudflare (recomendado)

## Portas Necessárias

| Porta | Serviço | Descrição |
|-------|---------|-----------|
| 22 | SSH | Acesso administrativo |
| 80 | HTTP | Redirect para HTTPS |
| 443 | HTTPS | Acesso principal |
| 3000 | Next.js | App principal (interno) |
| 3001 | Collector | Analytics (se usar) |

## Checklist de Análise

- [ ] Mapear todos os componentes
- [ ] Identificar versões de dependências
- [ ] Calcular requisitos de hardware
- [ ] Documentar portas necessárias
- [ ] Listar secrets/variáveis
- [ ] Verificar requisitos de rede
- [ ] Identificar pontos de falha

## Comandos de Análise

```bash
# Verificar tamanho do projeto
du -sh . && du -sh node_modules

# Verificar dependências
npm ls --depth=0

# Analisar build
npm run build && du -sh .next

# Verificar portas em uso
lsof -i :3000 :5173 :3001
```
