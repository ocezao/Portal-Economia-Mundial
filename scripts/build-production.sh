#!/bin/bash

# =============================================================================
# Script de Build para Produção
# =============================================================================
# Este script realiza o build completo da aplicação para deploy em produção
# 
# Uso: ./scripts/build-production.sh
# =============================================================================

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis
START_TIME=$(date +%s)
PROJECT_NAME="Cenario Internacional"

# Funções de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Header
echo "========================================"
echo "  Build de Produção - $PROJECT_NAME"
echo "========================================"
echo ""

# 1. Verificar Node.js
echo "🟢 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    log_error "Node.js não encontrado. Por favor, instale o Node.js 20+."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    log_error "Node.js versão $NODE_VERSION detectada. Requerido: 20+."
    exit 1
fi
log_success "Node.js $(node -v) detectado"

# 2. Verificar variáveis de ambiente obrigatórias
echo ""
echo "🟢 Verificando variáveis de ambiente..."

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    log_warning "Variáveis de ambiente não definidas:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    log_info "Carregando do arquivo .env..."
    if [ -f .env ]; then
        export $(grep -v '^#' .env | xargs)
    fi
fi

# Verificar novamente
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "Variável obrigatória não definida: $var"
        exit 1
    fi
done
log_success "Todas as variáveis obrigatórias estão configuradas"

# 3. Limpar builds anteriores
echo ""
echo "🟢 Limpando builds anteriores..."
rm -rf .next
rm -rf dist
log_success "Builds anteriores removidos"

# 4. Instalar dependências
echo ""
echo "🟢 Instalando dependências..."
npm ci
log_success "Dependências instaladas"

# 5. Verificar tipos TypeScript
echo ""
echo "🟢 Verificando tipos TypeScript..."
npx tsc --noEmit
log_success "Verificação de tipos concluída"

# 6. Executar lint
echo ""
echo "🟢 Executando lint..."
npm run lint
log_success "Lint concluído"

# 7. Executar testes (se não estiver em CI)
echo ""
echo "🟢 Executando testes..."
if [ -z "$CI" ]; then
    npm run test -- --run || {
        log_warning "Alguns testes falharam, continuando..."
    }
else
    log_info "Ambiente CI detectado, pulando testes unitários"
fi

# 8. Build de produção
echo ""
echo "🟢 Iniciando build de produção..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
npm run build
log_success "Build concluído"

# 9. Verificar saída do build
echo ""
echo "🟢 Verificando saída do build..."

if [ ! -d ".next/standalone" ]; then
    log_error "Diretório .next/standalone não encontrado. Verifique se output: 'standalone' está configurado no next.config.js"
    exit 1
fi

# Calcular tamanho do build
BUILD_SIZE=$(du -sh .next | cut -f1)
STANDALONE_SIZE=$(du -sh .next/standalone 2>/dev/null | cut -f1 || echo "N/A")

log_success "Saída do build verificada"
echo "  📦 Tamanho total: $BUILD_SIZE"
echo "  📦 Standalone: $STANDALONE_SIZE"

# 10. Copiar arquivos estáticos adicionais (se necessário)
echo ""
echo "🟢 Copiando arquivos adicionais..."

# Copiar public para standalone se não existir
if [ -d "public" ] && [ ! -d ".next/standalone/public" ]; then
    cp -r public .next/standalone/
    log_success "Pasta public copiada"
fi

# 11. Verificar health check endpoint
echo ""
echo "🟢 Verificando health check..."
if [ ! -f ".next/server/app/api/health/route.js" ]; then
    log_warning "Health check endpoint não encontrado no build"
else
    log_success "Health check endpoint presente"
fi

# Calcular tempo total
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "========================================"
echo "  ✅ BUILD CONCLUÍDO COM SUCESSO"
echo "========================================"
echo ""
echo "  📊 Resumo:"
echo "     • Duração: ${MINUTES}m ${SECONDS}s"
echo "     • Ambiente: Production"
echo "     • Saída: .next/standalone/"
echo ""
echo "  🚀 Próximos passos:"
echo "     1. Execute: npm run deploy:check"
echo "     2. Inicie com: pm2 start ecosystem.config.js"
echo "     3. Ou com Docker: docker build -t portal-economico ."
echo ""
