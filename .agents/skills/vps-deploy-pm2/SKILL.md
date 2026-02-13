---
name: vps-deploy-pm2
description: Deploy do Portal Econômico Mundial usando PM2 (Process Manager) e Nginx na VPS. Use quando preferir deploy tradicional sem Docker, com gerenciamento de processos PM2, Nginx como reverse proxy, e SSL via Certbot.
---

# VPS Deploy PM2

Skill especializada em realizar deploy da aplicação usando PM2 e Nginx (método tradicional sem Docker).

## Estrutura do Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                         VPS                                 │
│                                                             │
│  ┌─────────────────┐         ┌─────────────────────────┐   │
│  │     Nginx       │◄────────│  PM2 (Process Manager)  │   │
│  │   Porta 80/443  │         │                         │   │
│  │                 │         │  ┌───────────────────┐  │   │
│  │  Reverse Proxy  │         │  │  Next.js (x2)     │  │   │
│  │  SSL/TLS        │         │  │  Porta 3000       │  │   │
│  │  Static Cache   │         │  └───────────────────┘  │   │
│  │  Rate Limit     │         │                         │   │
│  │  Compression    │         │  ┌───────────────────┐  │   │
│  │                 │         │  │  Collector        │  │   │
│  │                 │         │  │  Porta 3001       │  │   │
│  │                 │         │  └───────────────────┘  │   │
│  └─────────────────┘         └─────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Configuração PM2

O projeto já possui `ecosystem.config.js` configurado:

```javascript
module.exports = {
  apps: [
    {
      name: 'portal-economico',
      script: './node_modules/next/dist/bin/next',
      args: 'start',
      
      // Modo cluster para utilizar múltiplos cores
      instances: 'max',  // Usa todos os cores disponíveis
      exec_mode: 'cluster',
      
      // Variáveis de ambiente
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Configurações de restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Política de memória
      max_memory_restart: '1G',
      
      // Logs
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
  ],
};
```

## Configuração Nginx

```nginx
# /etc/nginx/sites-available/portal-economico
upstream nextjs_upstream {
    least_conn;
    server 127.0.0.1:3000 weight=5 max_fails=3 fail_timeout=30s;
    # Adicione mais instâncias se necessário:
    # server 127.0.0.1:3001 weight=5 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# Redirecionar HTTP para HTTPS
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

# HTTPS - Configuração Principal
server {
    listen 443 ssl http2;
    server_name portal-economico.com www.portal-economico.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/portal-economico.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal-economico.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/portal-economico.com/chain.pem;
    
    # SSL Otimizações
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Logs
    access_log /var/log/nginx/portal-economico-access.log;
    error_log /var/log/nginx/portal-economico-error.log;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript text/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Rate Limiting
    limit_req zone=general burst=20 nodelay;
    limit_conn addr 10;

    # Proxy para Next.js
    location / {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Static files - Cache agressivo
    location /_next/static {
        alias /var/www/portal-economico/.next/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /static {
        alias /var/www/portal-economico/public;
        expires 1M;
        add_header Cache-Control "public, must-revalidate";
        access_log off;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://nextjs_upstream;
        access_log off;
    }

    # Favicon
    location = /favicon.ico {
        alias /var/www/portal-economico/public/favicon.ico;
        expires 1M;
        access_log off;
    }
}
```

## Scripts de Deploy

### 1. Preparação do Servidor

```bash
#!/bin/bash
# pm2-deploy-setup.sh

set -e

DOMAIN="${1:-portal-economico.com}"
APP_DIR="/var/www/portal-economico"

echo "🚀 Preparando deploy PM2..."

# Criar diretório da aplicação
mkdir -p $APP_DIR
mkdir -p /var/log/pm2
mkdir -p /var/www/certbot

# Configurar permissões
chown -R deploy:deploy $APP_DIR
chown -R deploy:deploy /var/log/pm2

# Criar link simbólico do Nginx
ln -sf /etc/nginx/sites-available/portal-economico \
       /etc/nginx/sites-enabled/portal-economico

# Testar configuração do Nginx
nginx -t && systemctl reload nginx

echo "✅ Servidor preparado"
```

### 2. Deploy da Aplicação

```bash
#!/bin/bash
# pm2-deploy.sh

set -e

DOMAIN="${1:-portal-economico.com}"
BRANCH="${2:-main}"
APP_DIR="/var/www/portal-economico"
REPO_URL="git@github.com:seu-usuario/portal-economico.git"

echo "🚀 Iniciando deploy PM2..."
cd $APP_DIR

# Backup do .env atual (se existir)
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Clone ou pull
if [ -d .git ]; then
    echo "📥 Pull do repositório..."
    git fetch origin
    git reset --hard origin/$BRANCH
else
    echo "📦 Clonando repositório..."
    git clone $REPO_URL .
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --only=production

# Configurar variáveis de ambiente
if [ ! -f .env.production ]; then
    echo "⚠️  Criando .env.production..."
    cat > .env.production << EOF
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://$DOMAIN
EOF
    echo "❗️ Edite .env.production com todas as variáveis necessárias"
fi

# Build
echo "🔨 Building aplicação..."
export NODE_ENV=production
npm run build

# Garantir diretório de logs
mkdir -p logs

# Deploy com PM2
echo "🚀 Iniciando com PM2..."
pm2 start ecosystem.config.js --env production

# Salvar configuração do PM2
pm2 save

# Configurar startup automático
pm2 startup systemd -u deploy --hp /home/deploy

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse: https://$DOMAIN"
echo ""
echo "Comandos úteis:"
echo "  pm2 logs portal-economico    # Ver logs"
echo "  pm2 monit                     # Monitor"
echo "  pm2 reload portal-economico   # Reload"
```

### 3. Atualização (Zero Downtime)

```bash
#!/bin/bash
# pm2-update.sh

set -e

APP_DIR="/var/www/portal-economico"

echo "🔄 Atualizando aplicação..."
cd $APP_DIR

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Pull
git fetch origin
git reset --hard origin/main

# Instalar dependências
npm ci --only=production

# Build
export NODE_ENV=production
npm run build

# Reload zero-downtime
pm2 reload ecosystem.config.js --env production

echo "✅ Aplicação atualizada!"
```

## Comandos PM2 Essenciais

```bash
# Iniciar
pm2 start ecosystem.config.js

# Status
pm2 status
pm2 monit

# Logs
pm2 logs
pm2 logs portal-economico --lines 100

# Restart
pm2 restart portal-economico

# Reload (zero-downtime)
pm2 reload portal-economico

# Parar
pm2 stop portal-economico

# Remover
pm2 delete portal-economico

# Salvar configuração
pm2 save

# Configurar startup automático
pm2 startup systemd
pm2 startup systemd -u deploy --hp /home/deploy
```

## Configuração SSL com Certbot

```bash
#!/bin/bash
# setup-ssl-pm2.sh

set -e

DOMAIN="${1:-portal-economico.com}"
EMAIL="${2:-admin@portal-economico.com}"

echo "🔒 Configurando SSL para $DOMAIN..."

# Obter certificado
certbot --nginx \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --redirect

# Configurar renovação automática
systemctl enable certbot.timer
systemctl start certbot.timer

echo "✅ SSL configurado!"
echo "📅 Renovação automática: certbot.timer"
```

## Manutenção

### Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/portal-economico"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/portal-economico"

mkdir -p $BACKUP_DIR

# Backup do código
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR .

# Backup dos logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz -C $APP_DIR/logs .

# Limpar backups antigos (manter 7 dias)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup concluído: $BACKUP_DIR"
```

### Monitoramento

```bash
# Status do sistema
pm2 status
systemctl status nginx
free -h
df -h

# Conexões ativas
netstat -tulpn | grep node
netstat -tulpn | grep nginx

# Logs em tempo real
pm2 logs
 tail -f /var/log/nginx/portal-economico-access.log
```

## Checklist de Deploy PM2

- [ ] Node.js 20+ instalado
- [ ] PM2 instalado globalmente
- [ ] Nginx instalado e configurado
- [ ] Firewall configurado (80, 443)
- [ ] Usuário deploy criado
- [ ] Código clonado no /var/www
- [ ] Variáveis de ambiente configuradas
- [ ] Build realizado com sucesso
- [ ] PM2 iniciado e salvando estado
- [ ] Nginx configurado com upstream
- [ ] SSL configurado
- [ ] Health check respondendo
- [ ] Logs configurados
- [ ] Backup automático configurado
