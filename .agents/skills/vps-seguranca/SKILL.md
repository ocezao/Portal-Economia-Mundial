---
name: vps-seguranca
description: Configurações de segurança para o Portal Econômico Mundial na VPS. Use quando precisar configurar SSL/TLS, headers de segurança, firewall, fail2ban, hardening SSH, proteção contra DDoS, e auditoria de segurança.
---

# VPS Segurança

Skill especializada em configurar e manter a segurança do servidor VPS.

## Checklist de Segurança

### 1. SSL/TLS (HTTPS)

```bash
#!/bin/bash
# setup-ssl-complete.sh

set -e

DOMAIN="${1:-portal-economico.com}"
EMAIL="${2:-admin@portal-economico.com}"

echo "🔒 Configurando SSL para $DOMAIN..."

# Instalar certbot
apt install -y certbot python3-certbot-nginx

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

# Testar renovação
certbot renew --dry-run

echo "✅ SSL configurado!"
```

### 2. Headers de Segurança

```nginx
# Adicionar à configuração do Nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# CSP (Content Security Policy) - Ajustar conforme necessidade
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co https://images.unsplash.com; connect-src 'self' https://*.supabase.co https://*.finnhub.io; font-src 'self';" always;
```

### 3. Firewall (UFW)

```bash
#!/bin/bash
# setup-firewall.sh

set -e

echo "🔥 Configurando firewall..."

# Resetar e configurar
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# SSH (considere mudar para porta não-padrão)
ufw allow 22/tcp

# HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Limitar tentativas de conexão SSH
ufw limit 22/tcp

# Habilitar
ufw --force enable

# Status
ufw status verbose

echo "✅ Firewall configurado"
```

### 4. Fail2Ban

```bash
#!/bin/bash
# setup-fail2ban.sh

set -e

echo "🛡️ Configurando Fail2Ban..."

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
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

# Criar filtros personalizados
cat > /etc/fail2ban/filter.d/nginx-noscript.conf << 'EOF'
[Definition]
failregex = ^<HOST> -.*GET.*(\.php|\.asp|\.exe|\.pl|\.cgi|\.py)
ignoreregex =
EOF

cat > /etc/fail2ban/filter.d/nginx-badbots.conf << 'EOF'
[Definition]
failregex = ^<HOST> -.*(AhrefsBot|mj12bot|DotBot|SemrushBot)
ignoreregex =
EOF

# Reiniciar
systemctl restart fail2ban
systemctl enable fail2ban

# Status
fail2ban-client status

echo "✅ Fail2Ban configurado"
```

### 5. Hardening SSH

```bash
#!/bin/bash
# harden-ssh.sh

set -e

echo "🔐 Configurando SSH..."

# Backup
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d)

# Configurações seguras
cat > /etc/ssh/sshd_config << 'EOF'
Port 22
Protocol 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

# Authentication
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Security
X11Forwarding no
PrintMotd no
PrintLastLog yes
TCPKeepAlive yes
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 2
LoginGraceTime 30

# AllowUsers deploy
EOF

# Reiniciar
systemctl restart sshd

echo "✅ SSH configurado"
echo "⚠️  IMPORTANTE: Certifique-se de ter acesso via chave antes de sair!"
```

### 6. Rate Limiting

```nginx
# /etc/nginx/conf.d/rate-limit.conf
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
limit_conn_zone $binary_remote_addr zone=addr:10m;

# Aplicar em server blocks
limit_req zone=general burst=20 nodelay;
limit_req zone=login burst=5 nodelay;
limit_conn addr 10;
```

### 7. Proteção DDoS Básica

```nginx
# /etc/nginx/conf.d/ddos-protection.conf

# Limitar tamanho de requisições
client_body_buffer_size 10K;
client_header_buffer_size 1k;
client_max_body_size 8m;
large_client_header_buffers 2 1k;

# Timeouts
client_body_timeout 12;
client_header_timeout 12;
keepalive_timeout 15;
send_timeout 10;

# Limitar conexões por IP
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
limit_conn conn_limit 50;
```

### 8. Auditoria de Segurança

```bash
#!/bin/bash
# security-audit.sh

set -e

echo "🔍 Realizando auditoria de segurança..."

# Verificar atualizações pendentes
echo "📦 Verificando atualizações..."
apt update
apt list --upgradable 2>/dev/null | grep -c "upgradable" || echo "0 pacotes para atualizar"

# Verificar portas abertas
echo "🌐 Portas abertas:"
ss -tulpn | grep LISTEN

# Verificar serviços em execução
echo "⚙️ Serviços:"
systemctl list-units --type=service --state=running | grep -E "(nginx|ssh|docker|fail2ban|postgres)"

# Verificar usuários
echo "👤 Usuários com shell:"
grep -E "/bin/bash|/bin/sh" /etc/passwd

# Verificar arquivos SUID
echo "📁 Arquivos SUID suspeitos:"
find / -perm -4000 -type f 2>/dev/null | head -20

# Verificar logs de falha de login
echo "❌ Falhas de login recentes:"
grep "Failed password" /var/log/auth.log | tail -10

# Verificar conexões ativas
echo "🔗 Conexões ativas:"
ss -tulpn | grep ESTAB | wc -l

echo "✅ Auditoria concluída"
```

### 9. Scanner de Vulnerabilidades

```bash
#!/bin/bash
# vulnerability-scan.sh

set -e

echo "🔍 Scanner de vulnerabilidades..."

# Instalar Lynis (se não estiver instalado)
if ! command -v lynis &> /dev/null; then
    apt install -y lynis
fi

# Executar scan
lynis audit system --quick 2>&1 | tee /tmp/lynis-report.txt

# Verificar certificados SSL
if command -v sslscan &> /dev/null; then
    echo "🔒 Scan de SSL..."
    sslscan localhost 2>&1 | head -50
fi

echo "✅ Scan concluído"
echo "📄 Relatório: /tmp/lynis-report.txt"
```

## Variáveis de Ambiente Seguras

```bash
# /var/www/portal-economico/.env.production
# Permissões: 600 (apenas owner)

NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://portal-economico.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_PASSWORD=xxxxxxxx

# APIs
NEXT_PUBLIC_FINNHUB_API_KEY=cxxxxxx
FINNHUB_API_KEY=cxxxxxx

# Analytics
POSTGRES_PASSWORD=xxxxxxxx
```

```bash
# Configurar permissões seguras
chmod 600 /var/www/portal-economico/.env.production
chown deploy:deploy /var/www/portal-economico/.env.production
```

## Checklist de Segurança

- [ ] SSL/TLS configurado (A+ no SSL Labs)
- [ ] Headers de segurança configurados
- [ ] Firewall ativo (apenas portas necessárias)
- [ ] Fail2Ban configurado
- [ ] SSH hardened (sem root, sem senha)
- [x] Rate limiting ativo (via middleware Next.js)
- [ ] Proteção DDoS básica
- [ ] Variáveis de ambiente protegidas
- [ ] Logs de segurança ativos
- [ ] Auditoria regular agendada
- [ ] Atualizações automáticas configuradas
- [ ] Backup de segurança testado
