#!/bin/bash

# =============================================================================
# Script de Verificação Pré-Deploy
# =============================================================================
# Verifica se tudo está configurado corretamente antes do deploy
#
# Uso: ./scripts/deploy-check.sh [--strict]
#   --strict: Falha se houver warnings
# =============================================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Flags
STRICT_MODE=false
if [ "$1" == "--strict" ]; then
    STRICT_MODE=true
fi

# Contadores
ERRORS=0
WARNINGS=0

# Funções
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

log_section() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
    echo "────────────────────────────────────"
}

echo "========================================"
echo "  Pré-Deploy Check"
echo "========================================"
echo ""

# 1. Verificar Node.js
log_section "Ambiente"

NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1) || NODE_VERSION=""
if [ -z "$NODE_VERSION" ]; then
    check_fail "Node.js não instalado"
else
    if [ "$NODE_VERSION" -ge 20 ]; then
        check_pass "Node.js $(node -v)"
    else
        check_fail "Node.js $(node -v) (requerido: 20+)"
    fi
fi

# Verificar npm
NPM_VERSION=$(npm -v 2>/dev/null | cut -d'.' -f1) || NPM_VERSION=""
if [ -z "$NPM_VERSION" ]; then
    check_fail "npm não instalado"
else
    check_pass "npm $(npm -v)"
fi

# 2. Verificar arquivos de configuração
log_section "Arquivos de Configuração"

[ -f "next.config.js" ] && check_pass "next.config.js" || check_fail "next.config.js não encontrado"
[ -f "package.json" ] && check_pass "package.json" || check_fail "package.json não encontrado"
[ -f ".env" ] && check_pass ".env" || check_warn ".env não encontrado (usando variáveis do sistema)"
[ -f "Dockerfile" ] && check_pass "Dockerfile" || check_warn "Dockerfile não encontrado"
[ -f "ecosystem.config.js" ] && check_pass "ecosystem.config.js" || check_warn "ecosystem.config.js não encontrado"

# 3. Verificar estrutura do projeto
log_section "Estrutura do Projeto"

[ -d "src" ] && check_pass "Diretório src/" || check_fail "src/ não encontrado"
[ -d "public" ] && check_pass "Diretório public/" || check_warn "public/ não encontrado"
[ -d ".next" ] && check_pass "Build existe (.next/)" || check_fail "Build não encontrado - execute 'npm run build' primeiro"

# 4. Verificar configuração Next.js
log_section "Configuração Next.js"

if [ -f "next.config.js" ]; then
    if grep -q "output.*standalone" next.config.js; then
        check_pass "output: 'standalone' configurado"
    else
        check_fail "output: 'standalone' não configurado no next.config.js"
    fi
    
    if grep -q "poweredByHeader.*false" next.config.js; then
        check_pass "poweredByHeader desabilitado"
    else
        check_warn "poweredByHeader não desabilitado"
    fi
fi

# 5. Verificar variáveis de ambiente
log_section "Variáveis de Ambiente"

# Carregar .env se existir
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

OPTIONAL_VARS=(
    "NEXT_PUBLIC_SITE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        check_pass "$var está definida"
    else
        check_fail "$var não está definida (OBRIGATÓRIA)"
    fi
done

for var in "${OPTIONAL_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        check_pass "$var está definida"
    else
        check_warn "$var não está definida (opcional)"
    fi
done

# 6. Verificar dependências
log_section "Dependências"

if [ -d "node_modules" ]; then
    check_pass "node_modules/ existe"
    
    # Verificar sharp
    if [ -d "node_modules/sharp" ]; then
        check_pass "sharp instalado"
    else
        check_warn "sharp não encontrado em node_modules"
    fi
    
    # Verificar next
    if [ -d "node_modules/next" ]; then
        check_pass "next instalado"
    else
        check_fail "next não encontrado"
    fi
else
    check_fail "node_modules/ não encontrado - execute 'npm install'"
fi

# 7. Verificar build de produção
log_section "Build de Produção"

if [ -d ".next" ]; then
    if [ -d ".next/standalone" ]; then
        check_pass "Standalone build existe"
    else
        check_fail "Standalone build não encontrado"
    fi
    
    if [ -f ".next/BUILD_ID" ]; then
        BUILD_ID=$(cat .next/BUILD_ID)
        check_pass "BUILD_ID: ${BUILD_ID:0:8}..."
    fi
    
    # Verificar se o health check está no build
    if [ -f ".next/server/app/api/health/route.js" ]; then
        check_pass "Health check endpoint no build"
    else
        check_warn "Health check endpoint não encontrado no build"
    fi
else
    check_fail "Diretório .next não encontrado"
fi

# 8. Verificar segurança básica
log_section "Segurança"

# Verificar se há chaves sensíveis no código
SENSITIVE_PATTERNS=(
    "sk-[a-zA-Z0-9]{20,}"  # OpenAI/Stripe keys
    "[a-zA-Z0-9]{32,}"     # Generic long keys
)

# Verificar .env.example vs .env
if [ -f ".env.example" ] && [ -f ".env" ]; then
    check_pass "Arquivos .env e .env.example existem"
fi

# Verificar se o .gitignore está configurado
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        check_pass ".env está no .gitignore"
    else
        check_warn ".env não está no .gitignore"
    fi
fi

# 9. Verificar saúde da aplicação (se estiver rodando)
log_section "Health Check"

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null | grep -q "200"; then
    check_pass "Health check retorna 200"
    
    # Tentar parsear JSON
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health 2>/dev/null)
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        check_pass "Aplicação está healthy"
    elif echo "$HEALTH_RESPONSE" | grep -q "degraded"; then
        check_warn "Aplicação está em modo degraded"
    fi
else
    check_warn "Aplicação não está rodando em localhost:3000 (ou health check não implementado)"
fi

# 10. Verificar portas
log_section "Portas"

PORT=${PORT:-3000}
if lsof -i :$PORT > /dev/null 2>&1; then
    check_warn "Porta $PORT já está em uso"
else
    check_pass "Porta $PORT está disponível"
fi

# Resumo Final
echo ""
echo "========================================"
echo "  Resumo"
echo "========================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Todos os checks passaram!${NC}"
    echo ""
    echo "Pronto para deploy! 🚀"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s)${NC}"
    echo ""
    if [ "$STRICT_MODE" = true ]; then
        echo "Modo strict ativado - corrija os warnings antes de fazer deploy."
        exit 1
    else
        echo "Deploy possível, mas revise os warnings."
        exit 0
    fi
else
    echo -e "${RED}✗ $ERRORS erro(s) e $WARNINGS warning(s)${NC}"
    echo ""
    echo "Corrija os erros antes de fazer deploy."
    exit 1
fi
