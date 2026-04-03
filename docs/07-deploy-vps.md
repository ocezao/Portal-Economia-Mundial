# Deploy em VPS (Legado PM2)

> Legado. Este guia descreve a trilha antiga com PM2 e não é mais a rota oficial do projeto.
>
> Para produção atual, usar Docker + Nginx conforme `docs/24-deploy-vps-execucao-manual.md`.

Este guia cobre a trilha histórica da aplicação em VPS usando Node.js com PM2 para gerenciamento de processos.

## 📋 Pré-requisitos

- VPS com Ubuntu 22.04+ ou Debian 12+
- Acesso SSH root ou sudo
- Domínio configurado (opcional, mas recomendado)
- 1GB+ RAM recomendado

## 🚀 Instalação Rápida

### 1. Configurar o Servidor

```bash
# Conectar ao servidor
ssh usuario@seu-servidor.com

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node -v  # v20.x.x
npm -v   # 10.x.x

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Nginx (reverse proxy)
sudo apt install -y nginx
```

### 2. Configurar Firewall

```bash
# Permitir SSH, HTTP e HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 3. Configurar Usuário de Deploy

```bash
# Criar usuário
sudo adduser deploy
sudo usermod -aG sudo deploy

# Configurar diretório da aplicação
sudo mkdir -p /var/www/portal-economico
sudo chown deploy:deploy /var/www/portal-economico
```

## 📦 Deploy da Aplicação

### 1. Clonar e Buildar

```bash
# Logar como usuário deploy
su - deploy

# Clonar repositório
cd /var/www/portal-economico
git clone https://github.com/seu-usuario/seu-repo.git .

# Instalar dependências
npm ci

# Configurar variáveis de ambiente
cp .env.example .env
nano .env  # Editar com suas configurações

# Build de produção
npm run build
```

### 2. Iniciar com PM2

```bash
# Usando o script do projeto
npm run pm2:start

# Ou manualmente
pm2 start ecosystem.config.js --env production

# Salvar configuração para iniciar automaticamente
pm2 save
pm2 startup systemd
```

### 3. Configurar Nginx

Criar configuração do site:

```bash
sudo nano /etc/nginx/sites-available/portal-economico
```

Conteúdo:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Redirecionar HTTP para HTTPS (depois de configurar SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
}
```

Ativar site:

```bash
sudo ln -s /etc/nginx/sites-available/portal-economico /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Configurar SSL (HTTPS)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Testar renovação automática
sudo certbot renew --dry-run
```

## 🔄 Atualizações

### Deploy de Nova Versão

```bash
# Logar como deploy
su - deploy
cd /var/www/portal-economico

# Puxar atualizações
git pull origin main

# Instalar novas dependências
npm ci

# Build
npm run build

# Reload zero-downtime
npm run pm2:reload
```

### Rollback

```bash
# Ver versões anteriores
git log --oneline -10

# Fazer rollback
git reset --hard HEAD~1
npm run build
npm run pm2:reload
```

## 📊 Monitoramento

### Comandos PM2

```bash
# Status
pm2 status
pm2 logs
pm2 monit

# Métricas
pm2 show portal-economico

# Reiniciar
pm2 restart portal-economico

# Parar
pm2 stop portal-economico
```

### Health Check

```bash
# Verificar saúde da aplicação
curl http://localhost:3000/api/health

# Verificar via Nginx
curl http://seu-dominio.com/api/health
```

## 🐳 Deploy com Docker (Alternativa)

### Usando Docker Compose

```bash
# Build da imagem
docker build -t portal-economico .

# Rodar container
docker run -d \
  --name portal-economico \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  portal-economico
```

### Docker Compose Completo

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
```

## 🔧 Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs

# Verificar erros de build
cat /var/www/portal-economico/logs/error.log

# Testar manualmente
NODE_ENV=production npm start
```

### Porta em uso

```bash
# Encontrar processo usando a porta
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Problemas de permissão

```bash
# Corrigir permissões
sudo chown -R deploy:deploy /var/www/portal-economico
chmod -R 755 /var/www/portal-economico
```

### Alta utilização de memória

```bash
# Ver uso de memória
free -h
pm2 status

# Reiniciar aplicação
pm2 restart portal-economico

# Ajustar limite no ecosystem.config.js
# max_memory_restart: '512M'
```

## 🔒 Segurança

### Configurações Recomendadas

1. **Desabilitar login root via SSH**
2. **Usar chaves SSH ao invés de senha**
3. **Manter sistema atualizado**
4. **Configurar fail2ban**

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### Headers de Segurança no Nginx

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## 📈 Escalabilidade

### Adicionar Mais Instâncias

Editar `ecosystem.config.js`:

```javascript
instances: 4,  // Ou 'max' para usar todos os cores
```

### Load Balancing com Nginx

```nginx
upstream app {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    location / {
        proxy_pass http://app;
    }
}
```

## 📞 Suporte

- **Documentação PM2**: https://pm2.keymetrics.io/docs/
- **Documentação Nginx**: https://nginx.org/en/docs/
- **Certbot**: https://certbot.eff.org/
