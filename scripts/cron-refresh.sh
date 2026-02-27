#!/bin/bash

# Script de Cron para Atualização de Dados do Portal
# 
# Este script configura o cron do sistema para atualizar os dados
# das APIs em intervalos definidos, mantendo o consumo dentro dos
# limites do plano gratuito.
#
# Limites:
# - Finnhub: 60 calls/min (~86.400/dia) - Usamos ~300/dia
# - GNews: 100 calls/dia - Não usado atualmente
#
# Instalação:
#   chmod +x scripts/cron-refresh.sh
#   ./scripts/cron-refresh.sh install
#
# Ou adicionar manualmente ao crontab:
#   crontab -e

# Configuração
CRON_API_SECRET="${CRON_API_SECRET:-}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
LOG_FILE="${LOG_FILE:-/var/log/portal-cron.log}"

# Função para fazer request ao endpoint de cron
call_cron() {
    local endpoint="$1"
    local description="$2"
    
    if [ -n "$CRON_API_SECRET" ]; then
        curl -s -X POST \
            -H "x-cron-secret: $CRON_API_SECRET" \
            "$WEB_URL/api/cron?type=$endpoint" \
            >> "$LOG_FILE" 2>&1
    else
        curl -s -X POST "$WEB_URL/api/cron?type=$endpoint" >> "$LOG_FILE" 2>&1
    fi
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $description: $?" >> "$LOG_FILE"
}

# Instalar crontab
install_crontab() {
    cat << EOF | crontab -
# Cron do Portal - Atualização de Dados
# Limite: ~300 chamadas/dia (Finnhub: 60/min = 86.400/dia)

# Publicar artigos agendados - a cada 1 minuto
* * * * * curl -s -X POST "http://localhost:3000/api/cron?type=publish-scheduled" > /dev/null 2>&1

# Atualizar notícias de mercado - a cada 15 minutos
*/15 * * * * curl -s -X POST "http://localhost:3000/api/cron?type=market-news" > /dev/null 2>&1

# Atualizar earnings - a cada 1 hora
0 * * * * curl -s -X POST "http://localhost:3000/api/cron?type=earnings" > /dev/null 2>&1

# Atualizar índices globais - a cada 15 minutos
*/15 * * * * curl -s -X POST "http://localhost:3000/api/cron?type=indices" > /dev/null 2>&1

# Atualizar commodities - a cada 15 minutos
*/15 * * * * curl -s -X POST "http://localhost:3000/api/cron?type=commodities" > /dev/null 2>&1

# Atualizar setores - a cada 1 hora
0 * * * * curl -s -X POST "http://localhost:3000/api/cron?type=sectors" > /dev/null 2>&1

# Atualizar calendário econômico - a cada 1 hora
0 * * * * curl -s -X POST "http://localhost:3000/api/cron?type=economic-calendar" > /dev/null 2>&1

# Verificar status todos os dias às 6h
0 6 * * * curl -s "http://localhost:3000/api/cron?type=status" > /tmp/cron-status-\$(date +\%Y\%m\%d).json 2>&1

EOF
    echo "Crontab instalado com sucesso!"
    echo ""
    echo "Jobs configurados:"
    crontab -l | grep -v "^#"
}

# Remover crontab
uninstall_crontab() {
    crontab -r
    echo "Crontab removido."
}

# Mostrar status atual
show_status() {
    curl -s "http://localhost:3000/api/cron?type=status" | jq '.' 2>/dev/null || \
    curl -s "http://localhost:3000/api/cron?type=status"
}

# Atualizar tudo agora
refresh_all() {
    echo "Atualizando todos os dados..."
    curl -s -X POST "http://localhost:3000/api/cron?type=all" | jq '.' 2>/dev/null || \
    curl -s -X POST "http://localhost:3000/api/cron?type=all"
}

# Verificar se a URL está disponível
check_service() {
    if curl -s -f -o /dev/null "$WEB_URL/api/health"; then
        echo "✓ Serviço disponível em $WEB_URL"
        return 0
    else
        echo "✗ Serviço não disponível em $WEB_URL"
        return 1
    fi
}

# Main
case "${1:-}" in
    install)
        install_crontab
        ;;
    uninstall)
        uninstall_crontab
        ;;
    status)
        show_status
        ;;
    refresh)
        refresh_all
        ;;
    check)
        check_service
        ;;
    *)
        echo "Uso: $0 {install|uninstall|status|refresh|check}"
        echo ""
        echo "Comandos:"
        echo "  install    - Instalar crontab para atualizar dados automaticamente"
        echo "  uninstall  - Remover crontab"
        echo "  status     - Mostrar status dos snapshots"
        echo "  refresh    - Atualizar todos os dados agora"
        echo "  check      - Verificar se o serviço está disponível"
        exit 1
        ;;
esac
