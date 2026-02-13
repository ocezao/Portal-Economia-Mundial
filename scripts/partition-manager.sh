#!/bin/bash
set -euo pipefail

# Script de criação de partições mensais para events_raw
# Cria partições para o mês atual + N meses futuros
# Cria UNIQUE INDEX(event_id) em cada partição para deduplicação

# Usar variáveis de ambiente ou defaults
DB_NAME="${POSTGRES_DB:-cin_analytics}"
DB_USER="${POSTGRES_USER:-analytics}"
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
MONTHS_AHEAD="${1:-3}"

echo "=== Gerenciador de Partições CIN Analytics ==="
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "Criando partições para: mês atual + ${MONTHS_AHEAD} meses futuros"

# Testar conexão antes de prosseguir
echo ""
echo "Testando conexão com PostgreSQL..."
if ! psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1" >/dev/null 2>&1; then
    echo "ERRO: Não foi possível conectar ao PostgreSQL em ${DB_HOST}:${DB_PORT}"
    exit 1
fi
echo "Conexão OK"

# Função para criar índice único em partição específica (com identificadores seguros)
criar_indice_unico() {
    local partition_name=$1
    echo "Criando UNIQUE INDEX em ${partition_name}..."
    
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = format('%I_event_id_unique', '${partition_name}')
        AND schemaname = 'public'
    ) THEN
        EXECUTE format('CREATE UNIQUE INDEX %I_event_id_unique ON %I(event_id)', 
            '${partition_name}', '${partition_name}');
    END IF;
END
\$\$;
EOF
}

# Loop para criar partições
ERRO=0

for i in $(seq 0 "${MONTHS_AHEAD}"); do
    # Calcular datas (compatível Linux e macOS)
    if date --version >/dev/null 2>&1; then
        START_DATE=$(date -d "+${i} months" +%Y-%m-01)
        NEXT_MONTH=$(date -d "+$((i+1)) months" +%Y-%m-01)
    else
        START_DATE=$(date -v+${i}m +%Y-%m-01)
        NEXT_MONTH=$(date -v+$((${i}+1))m +%Y-%m-01)
    fi
    
    YEAR=$(echo "${START_DATE}" | cut -d'-' -f1)
    MONTH=$(echo "${START_DATE}" | cut -d'-' -f2)
    TABLE_NAME="events_raw_${YEAR}_${MONTH}"
    
    echo ""
    echo "Processando: ${TABLE_NAME} (${START_DATE} até ${NEXT_MONTH})"
    
    # Criar partição
    echo "  Criando tabela partição..."
    if ! psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -c "
        CREATE TABLE IF NOT EXISTS ${TABLE_NAME} 
        PARTITION OF events_raw 
        FOR VALUES FROM ('${START_DATE}') TO ('${NEXT_MONTH}');
    " 2>/dev/null; then
        echo "ERRO ao criar partição ${TABLE_NAME}"
        ERRO=1
        continue
    fi
    
    # Criar índice único (essencial para deduplicação)
    echo "  Criando índice único..."
    if ! criar_indice_unico "${TABLE_NAME}"; then
        echo "ERRO ao criar índice único em ${TABLE_NAME}"
        ERRO=1
        continue
    fi
    
    echo "  ✓ ${TABLE_NAME} pronta"
done

echo ""

if [ $ERRO -ne 0 ]; then
    echo "=== ERRO: Falha ao criar partições/índices ==="
    exit 1
fi

echo "=== Todas as partições criadas com sucesso ==="
echo "Partições ativas:"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "
    SELECT tablename 
    FROM pg_tables 
    WHERE tablename LIKE 'events_raw_20%' 
    AND schemaname = 'public'
    ORDER BY tablename;
"
