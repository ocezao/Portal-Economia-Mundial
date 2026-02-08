# 🤖 MCP Server - Portal Econômico Mundial

Servidor MCP (Model Context Protocol) completo para integração com Codex CLI e outros clientes MCP.

---

## ✨ Funcionalidades

### 📊 Analytics & Tracking (Leitura Completa)
- `get_analytics_events` - Eventos de tracking com filtros
- `get_article_stats` - Estatísticas detalhadas por artigo
- `get_top_articles` - Artigos mais populares
- `get_user_sessions` - Sessões de usuários
- `get_dashboard_metrics` - Métricas agregadas do dashboard
- `get_traffic_sources` - Fontes de tráfego

### 📝 Gerenciamento de Conteúdo (CRUD Completo)
- `create_article` - **Criar artigo com todos os campos**:
  - ✅ Título, resumo, conteúdo
  - ✅ **Tradução** (título, resumo, conteúdo em inglês)
  - ✅ **SEO** (meta description, keywords)
  - ✅ **Categoria e Tags** (relacionamentos automáticos)
  - ✅ Imagem de capa
  - ✅ Status (draft/published/scheduled)
  - ✅ Destaque e Breaking News
  - ✅ Métricas iniciais
- `update_article` - Atualizar qualquer campo do artigo
- `delete_article` - Remover artigo
- `search_articles` - Buscar por termo com filtros
- `list_articles` - Listar com filtros avançados
- `get_article_by_slug` - Buscar artigo completo
- `publish_article` - Publicar/agendar artigo

### 📈 Dados de Mercado (Finnhub)
- `get_market_quote` - Cotações em tempo real
- `get_market_news` - Notícias de mercado
- `get_earnings_calendar` - Calendário de resultados
- `get_stock_recommendations` - Recomendações de analistas

---

## 🚀 Instalação Rápida

```bash
cd mcp-server
chmod +x setup.sh
./setup.sh
```

📚 **[Guia de Instalação Completo](./INSTALL.md)**

---

## ⚙️ Configuração

### Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
NEXT_PUBLIC_FINNHUB_API_KEY=sua-chave-finnhub
```

> ⚠️ **IMPORTANTE**: Use a `SUPABASE_SERVICE_ROLE_KEY`, não a anon key!

### Codex CLI

Edite `~/.codex/config.toml`:

```toml
[[servers]]
name = "pem"
type = "stdio"
command = "ssh"
args = [
  "usuario@seu-servidor.com",
  "cd /var/www/pem/mcp-server && node dist/index.js"
]
```

---

## 📝 Exemplos de Uso

### Criar Artigo Completo
```
"Crie um artigo sobre inflação no Brasil:
- Título: 'Inflação supera expectativas'
- Autor: Ana Silva
- Categoria: economia
- Tags: inflação, IPCA, BC
- Meta description: 'IPCA registra alta de 0,42%'
- Keywords: inflação, IPCA, Brasil
- Destaque na home: sim"

→ create_article(
  title: "Inflação supera expectativas",
  excerpt: "IPCA registra alta de 0,42%...",
  content: "# Inflação no Brasil...",
  category: "economia",
  authorId: "ana-silva",
  authorName: "Ana Silva",
  tags: ["inflação", "IPCA", "BC"],
  metaDescription: "IPCA registra alta de 0,42%",
  keywords: ["inflação", "IPCA", "Brasil"],
  featured: true
)
```

### Atualizar SEO e Tags
```
"Atualize o artigo 'bitcoin-etf':
- Nova meta description
- Tags: bitcoin, ETF, cripto
- Título em inglês"

→ update_article(
  slug: "bitcoin-etf",
  metaDescription: "Novo texto SEO...",
  tags: ["bitcoin", "ETF", "cripto"],
  titleEn: "Bitcoin ETF Guide"
)
```

### Analytics
```
"Quais os 10 artigos mais lidos esta semana?"
→ get_top_articles(limit: 10, period: "7d")

"Estatísticas do artigo 'fed-juros'"
→ get_article_stats(slug: "fed-juros")
```

### Dados de Mercado
```
"Cotação do Bitcoin agora"
→ get_market_quote(symbol: "BINANCE:BTCUSDT")

"Próximos earnings"
→ get_earnings_calendar(from: "2025-02-10", to: "2025-02-28")
```

---

## 📁 Estrutura

```
mcp-server/
├── src/
│   └── index.ts              # Servidor MCP principal
├── dist/                     # Código compilado
├── package.json              # Dependências
├── tsconfig.json             # Config TypeScript
├── setup.sh                  # Script de instalação
├── INSTALL.md                # Guia de instalação
└── README.md                 # Este arquivo
```

---

## 🔧 Comandos

```bash
# Desenvolvimento com auto-reload
npm run dev

# Build
npm run build

# Produção
npm start

# Lint
npm run lint
```

---

## 📚 Documentação

- [Documentação Completa](../docs/20-mcp-server.md)
- [Guia de Instalação](./INSTALL.md)
- [MCP Protocol](https://modelcontextprotocol.io/)

---

## 🔐 Segurança

- Usa Service Role Key (acesso total controlado)
- Conexão stdio (local ou via SSH)
- Validação Zod em todas as entradas

---

## 📝 Changelog

### v1.1.0
- ✅ Campos completos de artigo (tradução, SEO, tags)
- ✅ Categorias e tags com relacionamentos
- ✅ Novas ferramentas: `get_article_by_slug`, `list_articles`

### v1.0.0
- ✅ Lançamento inicial

---

**Versão:** 1.1.0  
**Última atualização:** 07/02/2026
