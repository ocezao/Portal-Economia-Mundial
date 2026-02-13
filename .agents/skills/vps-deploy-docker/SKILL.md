---
name: vps-deploy-docker
description: Deploy do Portal Econômico Mundial usando Docker e Docker Compose na VPS. Use quando precisar containerizar a aplicação, configurar docker-compose completo com Nginx, SSL, e todas as dependências para ambiente de produção.
---

# VPS Deploy Docker

Skill especializada em realizar deploy da aplicação usando Docker e Docker Compose.

## Estrutura de Containers

```
┌─────────────────────────────────────────────────────────────┐
│                         VPS                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │     Nginx       │  │   Next.js App   │  │  Collector   │ │
│  │   (reverse      │  │   (frontend)    │  │  (analytics) │ │
│  │    proxy)       │  │                 │  │              │ │
│  │   Porta 80/443  │  │   Porta 3000    │  │  Porta 3001  │ │
│  └────────┬────────┘  └─────────────────┘  └──────────────┘ │
│           │                                                 │
│  ┌────────▼────────────────────────────────────────────────┐│
│  │                Docker Network                            ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Docker Compose Completo

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: pem-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/sites:/etc/nginx/conf.d:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - app
    networks:
      - pem-network
    command: "/bin/sh -c 'while :; do sleep 6h & wait $${!}; nginx -s reload; done & nginx -g \"daemon off;\"'"

  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    container_name: pem-app
    restart: unless-stopped
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - NEXT_PUBLIC_FINNHUB_API_KEY=${NEXT_PUBLIC_FINNHUB_API_KEY}
      - NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    env_file:
      - .env.production
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - pem-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Analytics Collector (opcional)
  collector:
    build:
      context: ./collector
      dockerfile: Dockerfile
    container_name: pem-collector
    restart: unless-stopped
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - POSTGRES_HOST=${POSTGRES_HOST:-postgres}
      - POSTGRES_PORT=${POSTGRES_PORT:-5432}
      - POSTGRES_DB=${POSTGRES_DB:-pem_analytics}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - LOG_LEVEL=info
    env_file:
      - .env.production
    depends_on:
      - postgres
    networks:
      - pem-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # PostgreSQL (para analytics)
  postgres:
    image: postgres:15-alpine
    container_name: pem-postgres
    restart: unless-stopped
    expose:
      - "5432"
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-pem_analytics}
      POSTGRES_USER: ${POSTGRES_USER:-analytics}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./collector/src/db/migrations:/docker-entrypoint-initdb.d:ro
    networks:
      - pem-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Certbot para SSL
  certbot:
    image: certbot/certbot
    container_name: pem-certbot
    restart: unless-stopped
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - pem-network

volumes:
  postgres_data:

networks:
  pem-network:
    driver: bridge
```

## Configuração Nginx para Docker

```nginx
# nginx/conf.d/app.conf
upstream nextjs {
    server app:3000;
}

upstream collector {
    server collector:3000;
}

# HTTP - Redirect para HTTPS
server {
    listen 80;
    server_name portal-economico.com www.portal-economico.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Aplicação Principal
server {
    listen 443 ssl http2;
    server_name portal-economico.com www.portal-economico.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/portal-economico.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal-economico.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/portal-economico.com/chain.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript;

    # Proxy para Next.js
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # API Collector
    location /collect {
        proxy_pass http://collector;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://nextjs/_next/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /images {
        proxy_pass http://nextjs/images;
        expires 1M;
        add_header Cache-Control "public, must-revalidate";
    }
}
```

## Scripts de Deploy

### 1. Setup Inicial

```bash
#!/bin/bash
# docker-setup.sh

set -e

DOMAIN="${1:-portal-economico.com}"
EMAIL="${2:-admin@portal-economico.com}"

echo "🐳 Configurando Docker Compose..."

# Criar estrutura de diretórios
mkdir -p nginx/sites
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p logs/nginx
mkdir -p logs/app
mkdir -p logs/collector

# Gerar .env.production
cat > .env.production << EOF
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://$DOMAIN
EOF

echo "✅ Estrutura criada"
echo "⚠️  Edite o arquivo .env.production com suas variáveis"
```

### 2. Deploy Completo

```bash
#!/bin/bash
# docker-deploy.sh

set -e

DOMAIN="${1:-portal-economico.com}"
EMAIL="${2:-admin@portal-economico.com}"

echo "🚀 Iniciando deploy Docker..."

# Verificar .env.production
if [ ! -f .env.production ]; then
    echo "❌ Arquivo .env.production não encontrado"
    exit 1
fi

# Build
echo "📦 Building containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start
echo "▶️  Iniciando containers..."
docker-compose -f docker-compose.prod.yml up -d

# Aguardar healthcheck
echo "⏳ Aguardando healthcheck..."
sleep 10

# Verificar status
docker-compose -f docker-compose.prod.yml ps

# Logs
echo ""
echo "📋 Logs recentes:"
docker-compose -f docker-compose.prod.yml logs --tail=20 app

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse: https://$DOMAIN"
```

### 3. SSL/Certbot Setup

```bash
#!/bin/bash
# setup-ssl.sh

set -e

DOMAIN="${1:-portal-economico.com}"
EMAIL="${2:-admin@portal-economico.com}"

echo "🔒 Configurando SSL para $DOMAIN..."

# Parar containers
docker-compose -f docker-compose.prod.yml stop nginx

# Obter certificado
docker run -it --rm \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    -p 80:80 \
    certbot/certbot certonly \
    --standalone \
    --preferred-challenges http \
    --agree-tos \
    --no-eff-email \
    -m "$EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Reiniciar
docker-compose -f docker-compose.prod.yml up -d

echo "✅ SSL configurado!"
echo "📅 Renovação automática configurada"
```

## Comandos Úteis

```bash
# Status dos containers
docker-compose -f docker-compose.prod.yml ps

# Logs
docker-compose -f docker-compose.prod.yml logs -f app
docker-compose -f docker-compose.prod.yml logs -f nginx

# Restart
docker-compose -f docker-compose.prod.yml restart app

# Update (pull + rebuild)
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --build

# Backup do banco
docker exec pem-postgres pg_dump -U analytics pem_analytics > backup.sql

# Restore
cat backup.sql | docker exec -i pem-postgres psql -U analytics pem_analytics

# Limpar tudo (CUIDADO!)
docker-compose -f docker-compose.prod.yml down -v
docker system prune -a
```

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] DNS apontando para VPS
- [ ] Portas 80/443 liberadas
- [ ] Docker e Docker Compose instalados
- [ ] SSL configurado
- [ ] Health check respondendo
- [ ] Logs configurados
- [ ] Backup automático configurado
