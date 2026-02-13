---
name: vps-monitoramento
description: Monitoramento e observabilidade do Portal Econômico Mundial na VPS. Use quando precisar configurar logs, métricas, alertas, health checks, dashboard de monitoramento, e ferramentas de análise de performance.
---

# VPS Monitoramento

Skill especializada em configurar monitoramento e observabilidade do sistema.

## Stack de Monitoramento

```
┌─────────────────────────────────────────────────────────────┐
│                   MONITORAMENTO                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Logs       │  │  Métricas    │  │    Alertas       │  │
│  │              │  │              │  │                  │  │
│  │  • Nginx     │  │  • CPU       │  │  • Email         │  │
│  │  • App       │  │  • RAM       │  │  • Slack         │  │
│  │  • System    │  │  • Disk      │  │  • Webhook       │  │
│  │  • PostgreSQL│  │  • Network   │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Dashboard (Opcional)                    │  │
│  │              - Netdata ou Grafana                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 1. Configuração de Logs

### Logrotate

```bash
# /etc/logrotate.d/portal-economico
/var/www/portal-economico/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 deploy deploy
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Rsyslog Customizado

```bash
# /etc/rsyslog.d/50-portal-economico.conf
:programname, isequal, "portal-economico" /var/log/portal-economico/app.log
:programname, isequal, "portal-economico" ~

# PostgreSQL
local0.* /var/log/portal-economico/postgres.log
```

### PM2 Logs

```bash
# Configuração no ecosystem.config.js
{
  log_file: './logs/combined.log',
  out_file: './logs/out.log',
  error_file: './logs/error.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
}
```

## 2. Health Checks

### Script de Health Check

```bash
#!/bin/bash
# health-check.sh

set -e

APP_URL="${1:-http://localhost:3000}"
WEBHOOK_URL="${2:-}"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Funções
log_ok() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

ERRORS=0

echo "🏥 Health Check - $(date)"
echo "============================"

# 1. Verificar se aplicação responde
echo ""
echo "🌐 Verificando aplicação..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health" || echo "000")
if [ "$HTTP_CODE" == "200" ]; then
    log_ok "Aplicação responde com 200"
else
    log_error "Aplicação retornou $HTTP_CODE"
    ((ERRORS++))
fi

# 2. Verificar disco
echo ""
echo "💽 Verificando disco..."
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    log_ok "Uso de disco: ${DISK_USAGE}%"
else
    log_warn "Uso de disco alto: ${DISK_USAGE}%"
    ((ERRORS++))
fi

# 3. Verificar memória
echo ""
echo "🧠 Verificando memória..."
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEM_USAGE" -lt 90 ]; then
    log_ok "Uso de memória: ${MEM_USAGE}%"
else
    log_warn "Uso de memória alto: ${MEM_USAGE}%"
    ((ERRORS++))
fi

# 4. Verificar CPU load
echo ""
echo "⚡ Verificando CPU..."
LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
CPU_COUNT=$(nproc)
LOAD_THRESHOLD=$(echo "$CPU_COUNT * 2" | bc)
if (( $(echo "$LOAD < $LOAD_THRESHOLD" | bc -l) )); then
    log_ok "Load average: $LOAD ( CPUs: $CPU_COUNT )"
else
    log_warn "Load alto: $LOAD"
    ((ERRORS++))
fi

# 5. Verificar PostgreSQL (se local)
if pg_isready -h localhost > /dev/null 2>&1; then
    log_ok "PostgreSQL respondendo"
else
    log_warn "PostgreSQL não responde (pode ser externo)"
fi

# 6. Verificar Nginx
echo ""
echo "🌐 Verificando Nginx..."
if systemctl is-active --quiet nginx; then
    log_ok "Nginx ativo"
else
    log_error "Nginx inativo"
    ((ERRORS++))
fi

# 7. Verificar PM2
echo ""
echo "📦 Verificando PM2..."
if pm2 describe portal-economico > /dev/null 2>&1; then
    STATUS=$(pm2 jlist | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ "$STATUS" == "online" ]; then
        log_ok "PM2: portal-economico online"
    else
        log_error "PM2: portal-economico $STATUS"
        ((ERRORS++))
    fi
else
    log_warn "PM2: processo não encontrado"
fi

# Resumo
echo ""
echo "============================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Todos os checks passaram!${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS erro(s) encontrado(s)${NC}"
    
    # Enviar alerta se webhook configurado
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"🚨 Alerta de saúde do servidor: $ERRORS erro(s) encontrados\"}"
    fi
    
    exit 1
fi
```

### Agendamento (Cron)

```bash
# /etc/cron.d/health-check
*/5 * * * * root /usr/local/bin/health-check.sh https://portal-economico.com https://hooks.slack.com/services/xxx
```

## 3. Netdata (Monitoramento em Tempo Real)

```bash
#!/bin/bash
# install-netdata.sh

set -e

echo "📊 Instalando Netdata..."

# Instalar dependências
apt install -y curl jq

# Instalar Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh) --stable-channel

# Configurar
 cat > /etc/netdata/netdata.conf << 'EOF'
[global]
    history = 86400
    memory mode = dbengine
    page cache size = 64
    dbengine multihost disk space = 512

[web]
    bind to = 127.0.0.1:19999
    allow connections from = localhost

[health]
    enabled = yes
EOF

# Reiniciar
systemctl restart netdata
systemctl enable netdata

echo "✅ Netdata instalado"
echo "🔗 Acesse via: http://localhost:19999 (use SSH tunnel)"
```

### SSH Tunnel para Netdata

```bash
# Acessar Netdata remotamente via SSH tunnel
ssh -L 19999:localhost:19999 deploy@seu-vps
# Acesse http://localhost:19999 no navegador local
```

## 4. Prometheus + Grafana (Avançado)

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: pem-prometheus
    volumes:
      - ./prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: pem-grafana
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3003:3000"
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    container_name: pem-node-exporter
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
    ports:
      - "9100:9100"
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

## 5. Alertas

### Script de Alerta

```bash
#!/bin/bash
# send-alert.sh

TYPE="$1"
MESSAGE="$2"
WEBHOOK_URL="${3:-$SLACK_WEBHOOK_URL}"

case $TYPE in
    error)
        EMOJI="🚨"
        COLOR="danger"
        ;;
    warning)
        EMOJI="⚠️"
        COLOR="warning"
        ;;
    success)
        EMOJI="✅"
        COLOR="good"
        ;;
    *)
        EMOJI="ℹ️"
        COLOR="#439FE0"
        ;;
esac

# Slack
curl -X POST "$WEBHOOK_URL" \
    -H 'Content-type: application/json' \
    --data "{
        \"attachments\": [{
            \"color\": \"$COLOR\",
            \"text\": \"$EMOJI $MESSAGE\",
            \"footer\": \"Portal Econômico - $(hostname)\",
            \"ts\": $(date +%s)
        }]
    }"
```

### Alertas Automáticos

```bash
#!/bin/bash
# monitor-resources.sh

# Verificar recursos e alertar se necessário
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')

if [ "$DISK_USAGE" -gt 90 ]; then
    /usr/local/bin/send-alert.sh error "Disco quase cheio: ${DISK_USAGE}%"
fi

if [ "$MEM_USAGE" -gt 95 ]; then
    /usr/local/bin/send-alert.sh error "Memória crítica: ${MEM_USAGE}%"
fi

if (( $(echo "$LOAD > 10" | bc -l) )); then
    /usr/local/bin/send-alert.sh warning "Load muito alto: $LOAD"
fi
```

## 6. Relatórios Diários

```bash
#!/bin/bash
# daily-report.sh

REPORT="📊 Relatório Diário - $(date +%Y-%m-%d)

*Sistema:*
- Uptime: $(uptime -p)
- Load: $(uptime | awk -F'load average:' '{print $2}')
- Memória: $(free -h | grep Mem | awk '{print $3"/"$2}')
- Disco: $(df -h / | tail -1 | awk '{print $3"/"$2 " ("$5")"}')

*Acesso (últimas 24h):*
- Requisições: $(wc -l < /var/log/nginx/portal-economico-access.log)
- Erros 4xx: $(grep '" 4' /var/log/nginx/portal-economico-access.log | wc -l)
- Erros 5xx: $(grep '" 5' /var/log/nginx/portal-economico-access.log | wc -l)

*Backups:*
- Último backup: $(ls -lt /backups/postgres/*.dump.gz 2>/dev/null | head -1 | awk '{print $6, $7, $8}')
"

echo "$REPORT"
```

## Comandos Úteis

```bash
# Ver logs em tempo real
tail -f /var/log/nginx/portal-economico-error.log
tail -f /var/www/portal-economico/logs/error.log
pm2 logs

# Métricas do sistema
htop
iotop
iftop

# Análise de logs
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# Verificar conexões
ss -tulpn
netstat -tulpn

# Tamanho dos logs
du -sh /var/log/* | sort -rh | head -20
```

## Checklist de Monitoramento

- [ ] Logrotate configurado
- [ ] Health check agendado
- [ ] Netdata ou Grafana instalado
- [ ] Alertas configurados (Slack/Email)
- [ ] Dashboard de métricas acessível
- [ ] Relatórios diários automáticos
- [ ] Backup de logs configurado
- [ ] Monitoramento de recursos ativo
- [ ] Alertas de erro 5xx configurados
- [ ] Monitoramento de SSL (expiração)
