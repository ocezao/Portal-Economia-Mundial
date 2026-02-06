#!/bin/bash
set -uo pipefail

# Script de verificação objetiva do sistema PEM Analytics
# Acumula falhas e reporta no final (não faz fail-fast prematuro)

echo "=== SCRIPT DE VERIFICAÇÃO PEM ANALYTICS ==="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Detectar comando docker disponível
if docker compose version &>/dev/null; then
    DOCKER_CMD="docker compose"
elif docker-compose version &>/dev/null; then
    DOCKER_CMD="docker-compose"
else
    echo -e "${RED}✗ FALHA: nem 'docker compose' nem 'docker-compose' encontrados${NC}"
    exit 1
fi

# Variáveis determinísticas (valores fixos)
COLLECTOR_URL="http://localhost:3000"
TEST_USER_ID="550e8400-e29b-41d4-a716-446655440000"
TEST_SESSION_ID="6ba7b810-9dad-11d1-80b4-00c04fd430c8"
TEST_TIMESTAMP="1710000000000"
TEST_URL="https://test.com/article"
TEST_EVENT="page_view"
TEST_PAGE_TYPE="article"

# Array para acumular falhas
declare -a MISSING_ITEMS=()

echo "Usando: ${DOCKER_CMD}"

# Função para registrar falha (acumula)
registrar_falha() {
    echo -e "${RED}✗ FALHA: $1${NC}"
    MISSING_ITEMS+=("$1")
}

# Função para registrar sucesso
registrar_sucesso() {
    echo -e "${GREEN}✓ $1${NC}"
}

echo ""
echo "[1/8] Parando containers existentes..."
${DOCKER_CMD} down -v >/dev/null 2>&1 || true
registrar_sucesso "Containers parados"

echo ""
echo "[2/8] Iniciando PostgreSQL..."
${DOCKER_CMD} up -d postgres >/dev/null 2>&1

echo "Aguardando PostgreSQL ficar healthy..."
PG_HEALTHY=false
for i in {1..30}; do
    if ${DOCKER_CMD} ps postgres | grep -q "healthy"; then
        PG_HEALTHY=true
        break
    fi
    sleep 1
done

if [ "$PG_HEALTHY" = false ]; then
    registrar_falha "PostgreSQL não ficou healthy"
else
    registrar_sucesso "PostgreSQL healthy"
fi

echo ""
echo "[3/8] Criando partições via init-partitions..."
if ${DOCKER_CMD} run --rm init-partitions >/tmp/init-partitions.log 2>&1; then
    registrar_sucesso "Partições criadas automaticamente"
else
    registrar_falha "init-partitions falhou"
fi

echo ""
echo "[4/8] Verificando partição do mês atual..."
CURRENT_YEAR=$(date +%Y)
CURRENT_MONTH=$(date +%m)
PARTITION_NAME="events_raw_${CURRENT_YEAR}_${CURRENT_MONTH}"

PARTITION_EXISTS=$(${DOCKER_CMD} exec -T postgres psql -U analytics -d pem_analytics -t -c "
    SELECT COUNT(*) FROM pg_tables 
    WHERE tablename = '${PARTITION_NAME}' 
    AND schemaname = 'public';
" 2>/dev/null | tr -d '[:space:]')

if [ "${PARTITION_EXISTS}" = "1" ]; then
    registrar_sucesso "Partição do mês atual existe"
else
    registrar_falha "Partição do mês atual não existe"
fi

echo ""
echo "[5/8] Verificando UNIQUE INDEX(event_id) na partição do mês atual..."
UNIQUE_INDEX_EXISTS=$(${DOCKER_CMD} exec -T postgres psql -U analytics -d pem_analytics -t -c "
    SELECT COUNT(*) FROM pg_indexes 
    WHERE indexname = '${PARTITION_NAME}_event_id_unique'
    AND schemaname = 'public';
" 2>/dev/null | tr -d '[:space:]')

if [ "${UNIQUE_INDEX_EXISTS}" = "1" ]; then
    registrar_sucesso "UNIQUE INDEX(event_id) nas partições"
else
    registrar_falha "UNIQUE INDEX(event_id) não existe na partição do mês atual"
fi

echo ""
echo "[6/8] Iniciando collector e verificando /health..."
${DOCKER_CMD} up -d collector >/dev/null 2>&1

echo "Aguardando collector iniciar..."
COLLECTOR_OK=false
HEALTH_OUTPUT=""
for i in {1..30}; do
    HEALTH_OUTPUT=$(curl -s "${COLLECTOR_URL}/health" 2>/dev/null || echo "")
    if echo "$HEALTH_OUTPUT" | grep -q "ok"; then
        COLLECTOR_OK=true
        break
    fi
    sleep 1
done

if [ "$COLLECTOR_OK" = true ]; then
    registrar_sucesso "Collector /health respondendo"
else
    registrar_falha "/health não retornou ok"
fi

echo ""
echo "[7/8] Testando POST /collect..."
PAYLOAD="[{\"v\":\"1.0.0\",\"event\":\"${TEST_EVENT}\",\"user_id\":\"${TEST_USER_ID}\",\"session_id\":\"${TEST_SESSION_ID}\",\"anonymous\":false,\"timestamp\":${TEST_TIMESTAMP},\"url\":\"${TEST_URL}\",\"properties\":{\"page_type\":\"${TEST_PAGE_TYPE}\"}}]"

# Primeiro envio
HTTP_RESPONSE1=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${COLLECTOR_URL}/collect" \
    -H "Content-Type: application/json" \
    -d "${PAYLOAD}" 2>/dev/null || echo "000")

if [ "${HTTP_RESPONSE1}" = "204" ]; then
    registrar_sucesso "POST /collect funcionando"
else
    registrar_falha "POST /collect não retornou 204 (1ª tentativa)"
fi

# Segundo envio (dedupe)
HTTP_RESPONSE2=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${COLLECTOR_URL}/collect" \
    -H "Content-Type: application/json" \
    -d "${PAYLOAD}" 2>/dev/null || echo "000")

if [ "${HTTP_RESPONSE2}" = "204" ]; then
    :
    # Não registramos sucesso aqui para não duplicar mensagens, 
    # mas também não registramos falha se for diferente de 204 pois o endpoint pode dedupar
else
    registrar_falha "POST /collect não retornou 204 (2ª tentativa)"
fi

echo ""
echo "[8/8] Verificando deduplicação no banco..."
if [ ${#MISSING_ITEMS[@]} -eq 0 ] || ([ "${HTTP_RESPONSE1}" = "204" ] && [ "${HTTP_RESPONSE2}" = "204" ]); then
    COUNT=$(${DOCKER_CMD} exec -T postgres psql -U analytics -d pem_analytics -t -c "
        SELECT COUNT(*) FROM events_raw 
        WHERE url = '${TEST_URL}'
        AND event_name = '${TEST_EVENT}';
    " 2>/dev/null | tr -d '[:space:]')

    if [ "${COUNT}" = "1" ]; then
        registrar_sucesso "Deduplicação funcionando (1 registro após 2 inserts)"
    elif [ "${COUNT}" = "0" ]; then
        registrar_falha "Deduplicação falhou (COUNT != 1)"
    else
        registrar_falha "Deduplicação falhou (COUNT != 1)"
    fi
else
    # Se já temos falhas anteriores que impediram o insert, não verificamos o count
    registrar_falha "Deduplicação falhou (COUNT != 1)"
fi

echo ""
echo "=============================================="

# Resultado final
if [ ${#MISSING_ITEMS[@]} -eq 0 ]; then
    echo -e "${GREEN}RESULTADO: TODOS OS TESTES PASSARAM${NC}"
    echo ""
    echo "Checklist:"
    echo "  ✓ PostgreSQL healthy"
    echo "  ✓ Partições criadas automaticamente"
    echo "  ✓ UNIQUE INDEX(event_id) nas partições"
    echo "  ✓ Collector /health respondendo"
    echo "  ✓ POST /collect funcionando"
    echo "  ✓ Deduplicação funcionando (1 registro após 2 inserts)"
    echo ""
    exit 0
else
    echo -e "${RED}RESULTADO: VERIFICAÇÃO FALHOU${NC}"
    echo ""
    echo "Faltou:"
    for item in "${MISSING_ITEMS[@]}"; do
        echo "  - ${item}"
    done
    echo ""
    echo "Comando para logs: docker compose logs [serviço]"
    exit 1
fi
