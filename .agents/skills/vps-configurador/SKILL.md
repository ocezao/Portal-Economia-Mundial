---
name: vps-configurador
description: Configuração inicial de VPS Ubuntu/Debian para hospedar o Portal Econômico Mundial. Use quando precisar preparar um servidor novo, instalar dependências (Node.js, Docker, PM2, Nginx), configurar usuários, firewall e hardening básico antes do deploy.
---

# VPS Configurador

Skill especializada em configurar servidores VPS do zero para hospedar o Portal Econômico Mundial.

## Sistemas Suportados

- Ubuntu 22.04 LTS (recomendado)
- Ubuntu 24.04 LTS
- Debian 12
- Debian 11

## Etapas de Configuração

### 1. Atualização do Sistema

```bash
#!/bin/bash
# update-system.sh

set -e

echo "🔄 Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências básicas
apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    ufw \
    fail2ban \
    certbot \
    python3-certbot-nginx \
    nginx

echo "✅ Sistema atualizado"
```

### 2. Criar Usuário de Deploy

```bash
#!/bin/bash
# create-deploy-user.sh

USERNAME="deploy"

echo "👤 Criando usuário $USERNAME..."

# Criar usuário
useradd -m -s /bin/bash $USERNAME
usermod -aG sudo $USERNAME

# Configurar SSH (opcional: chaves)
mkdir -p /home/$USERNAME/.ssh
chmod 700 /home/$USERNAME/.ssh

# Copiar chave autorizada (se existir)
if [ -f ~/.ssh/authorized_keys ]; then
    cp ~/.ssh/authorized_keys /home/$USERNAME/.ssh/
    chown -R $USERNAME:$USERNAME /home/$USERNAME/.ssh
    chmod 600 /home/$USERNAME/.ssh/authorized_keys
fi

echo "✅ Usuário $USERNAME criado"
echo "⚠️  Defina a senha: passwd $USERNAME"
```

### 3. Instalar Node.js 20 (LTS)

```bash
#!/bin/bash
# install-node.sh

set -e

echo "📦 Instalando Node.js 20..."

# Usar NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar
node -v  # v20.x.x
npm -v   # 10.x.x

# Instalar PM2 globalmente
npm install -g pm2
pm2 --version

echo "✅ Node.js e PM2 instalados"
```

### 4. Instalar Docker (Opcional)

```bash
#!/bin/bash
# install-docker.sh

set -e

echo "🐳 Instalando Docker..."

# Remover versões antigas
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Instalar dependências
apt install -y ca-certificates gnupg lsb-release

# Adicionar repositório oficial
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar usuário ao grupo docker
usermod -aG docker deploy

echo "✅ Docker instalado"
echo "⚠️  Faça logout/login para usar Docker sem sudo"
```

### 5. Configurar Firewall (UFW)

```bash
#!/bin/bash
# configure-firewall.sh

set -e

echo "🔥 Configurando firewall..."

# Resetar regras
ufw --force reset

# Políticas padrão
ufw default deny incoming
ufw default allow outgoing

# Portas essenciais
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS

# Habilitar
ufw --force enable

# Status
ufw status verbose

echo "✅ Firewall configurado"
```

### 6. Configurar Fail2Ban

```bash
#!/bin/bash
# configure-fail2ban.sh

set -e

echo "🛡️ Configurando Fail2Ban..."

# Backup da configuração original
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.conf.backup

# Configuração personalizada
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
EOF

# Reiniciar
systemctl restart fail2ban
systemctl enable fail2ban

# Status
fail2ban-client status

echo "✅ Fail2Ban configurado"
```

### 7. Configurar Nginx

```bash
#!/bin/bash
# configure-nginx.sh

set -e

echo "🌐 Configurando Nginx..."

# Remover site padrão
rm -f /etc/nginx/sites-enabled/default

# Configuração otimizada
cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # MIME
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    # Include sites
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

# Testar configuração
nginx -t

# Reiniciar
systemctl restart nginx
systemctl enable nginx

echo "✅ Nginx configurado"
```

### 8. Configurar SSH Hardening

```bash
#!/bin/bash
# configure-ssh.sh

set -e

echo "🔐 Configurando SSH..."

# Backup
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Configurações seguras
cat >> /etc/ssh/sshd_config << 'EOF'

# Security Hardening
PermitRootLogin no
PasswordAuthentication no  # Apenas chaves SSH
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
Protocol 2
EOF

# Reiniciar SSH
systemctl restart sshd

echo "✅ SSH configurado"
echo "⚠️  Certifique-se de ter acesso via chave antes de desconectar!"
```

## Script de Setup Completo

```bash
#!/bin/bash
# setup-vps-complete.sh

set -e

DOMAIN="${1:-portal-economico.com}"
EMAIL="${2:-admin@portal-economico.com}"

echo "========================================"
echo "  Setup VPS - Portal Econômico Mundial"
echo "  Domínio: $DOMAIN"
echo "========================================"

# Executar todos os scripts
./update-system.sh
./create-deploy-user.sh
./install-node.sh
./install-docker.sh
./configure-firewall.sh
./configure-fail2ban.sh
./configure-nginx.sh

echo ""
echo "========================================"
echo "  ✅ VPS Configurado com Sucesso!"
echo "========================================"
echo ""
echo "Próximos passos:"
echo "1. Defina a senha do usuário deploy: passwd deploy"
echo "2. Configure o DNS para apontar para este servidor"
echo "3. Execute o script de deploy da aplicação"
echo ""
```

## Verificação Pós-Configuração

```bash
# Verificar serviços
systemctl status nginx
systemctl status fail2ban
systemctl status docker

# Verificar versões
node -v
npm -v
pm2 --version
docker --version

# Verificar firewall
ufw status

# Verificar espaço em disco
df -h

# Verificar memória
free -h
```
