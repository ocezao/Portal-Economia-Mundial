#!/bin/bash
# Script de instalação do MCP Server PEM

set -e

echo "🚀 Instalando MCP Server - Portal Econômico Mundial"
echo ""

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js 18+ primeiro."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ necessário. Versão atual: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version)"

# Instala dependências
echo "📦 Instalando dependências..."
npm install

# Build
echo "🔨 Compilando..."
npm run build

# Verifica variáveis de ambiente
echo ""
echo "⚙️  Verificando configuração..."

if [ -f "../.env" ]; then
    echo "✅ Arquivo .env encontrado"
    
    # Carrega variáveis
    export $(grep -v '^#' ../.env | xargs)
    
    if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        echo "✅ SUPABASE_URL configurado"
    else
        echo "⚠️  SUPABASE_URL não encontrado no .env"
    fi
    
    if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo "✅ SUPABASE_SERVICE_ROLE_KEY configurado"
    else
        echo "⚠️  SUPABASE_SERVICE_ROLE_KEY não encontrado"
        echo "   Você precisa da Service Role Key (não a anon key!)"
    fi
    
    if [ -n "$NEXT_PUBLIC_FINNHUB_API_KEY" ]; then
        echo "✅ FINNHUB_API_KEY configurado"
    else
        echo "⚠️  FINNHUB_API_KEY não configurado (opcional para dados de mercado)"
    fi
else
    echo "⚠️  Arquivo .env não encontrado na raiz do projeto"
    echo "   Crie o arquivo .env baseado no .env.example"
fi

echo ""
echo "✅ Instalação completa!"
echo ""
echo "📚 Próximos passos:"
echo ""
echo "1. Configure o Codex CLI em ~/.codex/config.toml:"
echo ""
echo '[[servers]]'
echo 'name = "pem"'
echo 'type = "stdio"'
echo 'command = "node"'
echo "args = [\"$(pwd)/dist/index.js\"]"
echo ""
echo "2. Execute o servidor manualmente para testar:"
echo "   npm start"
echo ""
echo "3. Para desenvolvimento com auto-reload:"
echo "   npm run dev"
echo ""
