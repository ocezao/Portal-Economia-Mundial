#!/bin/bash

# =============================================================================
# Script de Verificacao Pre-Deploy
# =============================================================================
# Verifica se tudo esta configurado corretamente antes do deploy
# oficial em Docker + Nginx.
#
# Uso: ./scripts/deploy-check.sh [--strict]
#   --strict: Falha se houver warnings
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

STRICT_MODE=false
if [ "${1:-}" == "--strict" ]; then
    STRICT_MODE=true
fi

ERRORS=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}OK${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}WARN${NC} $1"
    ((WARNINGS++))
}

check_fail() {
    echo -e "${RED}FAIL${NC} $1"
    ((ERRORS++))
}

log_section() {
    echo ""
    echo -e "${BLUE}>> $1${NC}"
    echo "----------------------------------------"
}

echo "========================================"
echo "  Pre-Deploy Check (Docker + Nginx)"
echo "========================================"
echo ""

log_section "Ambiente"

NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1) || NODE_VERSION=""
if [ -z "$NODE_VERSION" ]; then
    check_fail "Node.js nao instalado"
elif [ "$NODE_VERSION" -ge 20 ]; then
    check_pass "Node.js $(node -v)"
else
    check_fail "Node.js $(node -v) (requerido: 20+)"
fi

if command -v npm >/dev/null 2>&1; then
    check_pass "npm $(npm -v)"
else
    check_fail "npm nao instalado"
fi

if command -v docker >/dev/null 2>&1; then
    check_pass "docker instalado"
else
    check_fail "docker nao instalado"
fi

if docker compose version >/dev/null 2>&1; then
    check_pass "docker compose disponivel"
else
    check_fail "docker compose nao disponivel"
fi

log_section "Arquivos de Configuracao"

[ -f "next.config.js" ] && check_pass "next.config.js" || check_fail "next.config.js nao encontrado"
[ -f "package.json" ] && check_pass "package.json" || check_fail "package.json nao encontrado"
[ -f ".env" ] && check_pass ".env" || check_warn ".env nao encontrado (usando variaveis do sistema)"
[ -f ".env.example" ] && check_pass ".env.example" || check_warn ".env.example nao encontrado"
[ -f "Dockerfile" ] && check_pass "Dockerfile" || check_fail "Dockerfile nao encontrado"
[ -f "docker-compose.prod.yml" ] && check_pass "docker-compose.prod.yml" || check_fail "docker-compose.prod.yml nao encontrado"
[ -f "deploy/nginx/portal.conf" ] && check_pass "deploy/nginx/portal.conf" || check_fail "deploy/nginx/portal.conf nao encontrado"

log_section "Estrutura do Projeto"

[ -d "src" ] && check_pass "Diretorio src/" || check_fail "src/ nao encontrado"
[ -d "public" ] && check_pass "Diretorio public/" || check_warn "public/ nao encontrado"
[ -d ".next" ] && check_pass "Build existe (.next/)" || check_warn "Build nao encontrado - execute 'npm run build' antes do deploy"

log_section "Configuracao Next.js"

if [ -f "next.config.js" ]; then
    if grep -q "output.*standalone" next.config.js; then
        check_pass "output: 'standalone' configurado"
    else
        check_fail "output: 'standalone' nao configurado no next.config.js"
    fi

    if grep -q "poweredByHeader.*false" next.config.js; then
        check_pass "poweredByHeader desabilitado"
    else
        check_warn "poweredByHeader nao desabilitado"
    fi
fi

log_section "Variaveis de Ambiente"

if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

REQUIRED_VARS=(
    "DATABASE_URL"
    "CRON_API_SECRET"
    "AUTH_SESSION_SECRET"
    "UPLOADS_DIR"
)

OPTIONAL_VARS=(
    "NEXT_PUBLIC_SITE_URL"
    "EDITORIAL_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -n "${!var:-}" ]; then
        check_pass "$var esta definida"
    else
        check_fail "$var nao esta definida (obrigatoria)"
    fi
done

for var in "${OPTIONAL_VARS[@]}"; do
    if [ -n "${!var:-}" ]; then
        check_pass "$var esta definida"
    else
        check_warn "$var nao esta definida (opcional)"
    fi
done

log_section "Dependencias"

if [ -d "node_modules" ]; then
    check_pass "node_modules/ existe"
    [ -d "node_modules/sharp" ] && check_pass "sharp instalado" || check_warn "sharp nao encontrado em node_modules"
    [ -d "node_modules/next" ] && check_pass "next instalado" || check_fail "next nao encontrado"
else
    check_fail "node_modules/ nao encontrado - execute 'npm install'"
fi

log_section "Build de Producao"

if [ -d ".next" ]; then
    [ -d ".next/standalone" ] && check_pass "Standalone build existe" || check_fail "Standalone build nao encontrado"

    if [ -f ".next/BUILD_ID" ]; then
        BUILD_ID=$(cat .next/BUILD_ID)
        check_pass "BUILD_ID: ${BUILD_ID:0:8}..."
    fi

    if [ -f ".next/server/app/api/health/route.js" ]; then
        check_pass "Health check endpoint no build"
    else
        check_warn "Health check endpoint nao encontrado no build"
    fi
else
    check_fail "Diretorio .next nao encontrado"
fi

log_section "Compose e Nginx"

if docker compose -f docker-compose.prod.yml config >/dev/null 2>&1; then
    check_pass "docker-compose.prod.yml valido"
else
    check_fail "docker-compose.prod.yml invalido"
fi

if grep -q "server_name cenariointernacional.com.br" deploy/nginx/portal.conf; then
    check_pass "portal.conf contem server_name principal"
else
    check_warn "portal.conf nao contem o server_name esperado"
fi

log_section "Health Check"

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null | grep -q "200"; then
    check_pass "Health check web retorna 200"
else
    check_warn "Web nao esta respondendo em localhost:3000/api/health"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health 2>/dev/null | grep -q "200"; then
    check_pass "Health check api retorna 200"
else
    check_warn "API nao esta respondendo em localhost:4000/api/health"
fi

echo ""
echo "========================================"
echo "  Resumo"
echo "========================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}OK todos os checks passaram${NC}"
    echo ""
    echo "Pronto para deploy Docker + Nginx."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}WARN $WARNINGS warning(s)${NC}"
    echo ""
    if [ "$STRICT_MODE" = true ]; then
        echo "Modo strict ativado - corrija os warnings antes do deploy."
        exit 1
    else
        echo "Deploy possivel, mas revise os warnings."
        exit 0
    fi
else
    echo -e "${RED}FAIL $ERRORS erro(s) e $WARNINGS warning(s)${NC}"
    echo ""
    echo "Corrija os erros antes do deploy."
    exit 1
fi
