# 🤖 MCP Server - Model Context Protocol

Servidor MCP completo para integração com Codex CLI, permitindo controle total do Cenario Internacional via interface de linguagem natural.

---

## 📋 Visão Geral

O **MCP Server CIN** é uma implementação do [Model Context Protocol](https://modelcontextprotocol.io/) que expõe as funcionalidades do portal para assistentes de IA como o Codex. Com ele, você pode:

- 📊 **Acessar Analytics**: Ler todos os dados de tracking e métricas
- 📝 **Gerenciar Conteúdo**: Criar, editar, publicar e excluir artigos com **todos os campos**
- 📈 **Consultar Dados de Mercado**: Acesso à API Finnhub em tempo real
- 🔍 **Buscar e Analisar**: Pesquisar artigos e estatísticas

---

## 🏗️ Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Codex CLI     │────▶│   MCP Server     │────▶│   Supabase      │
│   (Cliente)     │◄────│   (stdio/HTTP)   │◄────│   (Database)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   Finnhub API    │
                        │   (Dados mercado)│
                        └──────────────────┘
```

---

## 🚀 Instalação

### 1. Pré-requisitos

- Node.js 18+
- Acesso ao servidor onde o portal está hospedado
- Variáveis de ambiente configuradas (`.env`)

### 2. Instalação Automática

```bash
cd mcp-server
chmod +x setup.sh
./setup.sh
```

### 3. Instalação Manual

```bash
cd mcp-server
npm install
npm run build
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie ou verifique as seguintes variáveis no `.env`:

```env
# Supabase (Obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# Finnhub (Opcional - para dados de mercado)
NEXT_PUBLIC_FINNHUB_API_KEY=sua-chave-finnhub

# Site (Opcional)
NEXT_PUBLIC_SITE_URL=https://seusite.com
```

> ⚠️ **IMPORTANTE**: Use a `SUPABASE_SERVICE_ROLE_KEY` (service role), não a anon key! A service role tem acesso total necessário para o MCP funcionar.

### Configuração do Codex CLI

Edite o arquivo `~/.codex/config.toml`:

#### Opção A: Local (mesma máquina)
```toml
[[servers]]
name = "pem"
type = "stdio"
command = "node"
args = ["/caminho/completo/para/mcp-server/dist/index.js"]
```

#### Opção B: Remoto (via SSH)
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

#### Opção C: Com variáveis de ambiente
```toml
[[servers]]
name = "pem"
type = "stdio"
command = "node"
args = ["/caminho/para/mcp-server/dist/index.js"]

[servers.env]
NEXT_PUBLIC_SUPABASE_URL = "https://seu-projeto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "sua-chave"
NEXT_PUBLIC_FINNHUB_API_KEY = "sua-chave-finnhub"
```

---

## 🛠️ Ferramentas Disponíveis

### 📊 Analytics & Tracking

#### `get_analytics_events`
Busca eventos de tracking com filtros.

**Parâmetros:**
```json
{
  "startDate": "2025-02-01",    // Data inicial (YYYY-MM-DD)
  "endDate": "2025-02-07",      // Data final
  "eventType": "page_view",     // Tipo: page_view, article_read_start, etc
  "limit": 100                  // Máximo de resultados
}
```

**Exemplo de uso:**
```
"Mostre os eventos de page_view dos últimos 3 dias"
```

---

#### `get_article_stats`
Estatísticas detalhadas de um artigo específico.

**Parâmetros:**
```json
{
  "slug": "bitcoin-etf",        // Slug do artigo
  "period": "30d"               // Período: 7d, 30d, 90d, all
}
```

**Retorna:**
- Total de views
- Leituras iniciadas
- Leituras completadas
- Taxa de conclusão
- Profundidade média de scroll
- Likes, shares, comentários

**Exemplo de uso:**
```
"Como está performando o artigo sobre fed-juros?"
```

---

#### `get_top_articles`
Artigos mais populares.

**Parâmetros:**
```json
{
  "limit": 10,                  // Número de artigos
  "period": "7d",               // Período: 24h, 7d, 30d, all
  "metric": "views"             // Ordenar por: views, engagement, shares
}
```

**Exemplo de uso:**
```
"Quais os 5 artigos mais lidos esta semana?"
```

---

#### `get_user_sessions`
Sessões de usuários.

**Parâmetros:**
```json
{
  "userId": "uuid-opcional",    // ID específico (opcional)
  "limit": 50,                  // Limite de resultados
  "startDate": "2025-02-01",    // Filtro data inicial
  "endDate": "2025-02-07"       // Filtro data final
}
```

---

#### `get_dashboard_metrics`
Métricas agregadas do dashboard.

**Parâmetros:**
```json
{
  "period": "7d"                // 24h, 7d, 30d
}
```

**Retorna:**
- Pageviews
- Sessões
- Usuários únicos
- Artigos publicados
- Média de páginas por sessão

---

### 📝 Gerenciamento de Conteúdo

#### `create_article` ⭐ **NOVO - Campos Completos**

Cria um novo artigo com **todos os campos disponíveis**.

**Parâmetros:**

##### Obrigatórios
```json
{
  "title": "Título do Artigo",
  "excerpt": "Resumo do artigo que aparece na listagem",
  "content": "Conteúdo completo em Markdown ou HTML",
  "category": "economia",
  "authorId": "ana-silva",
  "authorName": "Ana Carolina Silva"
}
```

##### Tradução (Opcional)
```json
{
  "titleEn": "Title in English",
  "excerptEn": "English excerpt",
  "contentEn": "Full content in English"
}
```

##### SEO (Opcional)
```json
{
  "metaDescription": "Descrição para SEO (máx 160 caracteres)",
  "keywords": ["inflação", "BC", "economia"]
}
```

##### Categorização (Opcional)
```json
{
  "tags": ["inflação", "BC", "Selic", "economia"]
}
```

##### Mídia (Opcional)
```json
{
  "coverImage": "/images/news/inflacao.webp"
}
```

##### Configurações de Publicação (Opcional)
```json
{
  "featured": true,              // Destacar na home
  "breaking": false,             // Breaking news
  "status": "draft",             // draft, published, scheduled
  "scheduledFor": "2025-02-10T10:00:00Z"
}
```

##### Métricas Iniciais (Opcional)
```json
{
  "views": 0,
  "likes": 0,
  "shares": 0
}
```

**Exemplo Completo:**
```json
{
  "title": "Inflação no Brasil supera expectativas em janeiro",
  "excerpt": "IPCA registra alta de 0,42% no primeiro mês do ano, acima das projeções do mercado",
  "content": "# Inflação no Brasil\n\nO Índice Nacional de Preços ao Consumidor Amplo (IPCA)...",
  "category": "economia",
  "authorId": "ana-silva",
  "authorName": "Ana Carolina Silva",
  "titleEn": "Brazilian inflation exceeds expectations in January",
  "excerptEn": "IPCA records 0.42% increase in the first month of the year",
  "metaDescription": "IPCA registra alta de 0,42% em janeiro, acima das expectativas do mercado",
  "keywords": ["inflação", "IPCA", "Brasil", "economia"],
  "tags": ["inflação", "IPCA", "BC", "Selic", "economia"],
  "coverImage": "/images/news/inflacao-janeiro.webp",
  "featured": true,
  "breaking": false,
  "status": "published"
}
```

**Exemplo de uso:**
```
"Crie um artigo sobre inflação com Ana Silva como autora, 
categoria economia, tags 'inflação, IPCA, BC', 
meta description otimizada para SEO, e marque como destaque"
```

---

#### `update_article` ⭐ **NOVO - Atualização Completa**

Atualiza um artigo existente. Permite modificar qualquer campo.

**Parâmetros:**
```json
{
  "slug": "artigo-existente",     // Obrigatório
  "title": "Novo título",
  "excerpt": "Novo resumo",
  "content": "Novo conteúdo",
  "titleEn": "Novo título em inglês",
  "excerptEn": "Novo resumo em inglês",
  "contentEn": "Novo conteúdo em inglês",
  "metaDescription": "Nova meta description",
  "keywords": ["novas", "keywords"],
  "category": "nova-categoria",   // Vai recriar a relação
  "tags": ["novas", "tags"],      // Substitui as existentes
  "coverImage": "/images/nova.webp",
  "status": "published",
  "featured": true,
  "breaking": false,
  "scheduledFor": "2025-02-10T10:00:00Z"
}
```

**Exemplo de uso:**
```
"Atualize o artigo 'bitcoin-etf' mudando a categoria para 'tecnologia', 
adicionando tags 'bitcoin, ETF, cripto', e marcando como destaque"
```

---

#### `delete_article`
Remove um artigo permanentemente.

**Parâmetros:**
```json
{
  "slug": "artigo-a-remover"
}
```

**Exemplo de uso:**
```
"Delete o artigo 'rascunho-antigo'"
```

---

#### `search_articles` ⭐ **NOVO - Busca Avançada**
Busca artigos por termo com filtros.

**Parâmetros:**
```json
{
  "query": "termo de busca",
  "status": "published",          // all, published, draft, scheduled
  "category": "economia",         // Opcional
  "limit": 20
}
```

**Exemplo de uso:**
```
"Busque artigos sobre inflação no status draft"
```

---

#### `list_articles` ⭐ **NOVO - Listagem com Filtros**
Lista artigos com filtros e paginação.

**Parâmetros:**
```json
{
  "status": "published",
  "category": "economia",
  "author": "ana-silva",
  "limit": 20,
  "offset": 0
}
```

---

#### `get_article_by_slug` ⭐ **NOVO**
Busca um artigo completo pelo slug.

**Parâmetros:**
```json
{
  "slug": "bitcoin-etf"
}
```

**Retorna:** Artigo completo com categoria, tags e traduções.

---

#### `publish_article`
Publica um artigo imediatamente.

**Parâmetros:**
```json
{
  "slug": "artigo-para-publicar",
  "makeFeatured": true,           // Destacar na home
  "makeBreaking": false           // Marcar como breaking
}
```

**Exemplo de uso:**
```
"Publique o artigo 'alerta-mercado' como breaking news e destaque"
```

---

### 📈 Dados de Mercado (Finnhub)

#### `get_market_quote`
Cotação em tempo real.

**Parâmetros:**
```json
{
  "symbol": "AAPL"                // Símbolo da ação
}
```

**Exemplo de uso:**
```
"Qual a cotação atual da PETR4?"
```

---

#### `get_market_news`
Notícias de mercado.

**Parâmetros:**
```json
{
  "category": "general",          // general, forex, crypto, merger
  "limit": 10
}
```

**Exemplo de uso:**
```
"Últimas notícias do mercado de cripto"
```

---

#### `get_earnings_calendar`
Calendário de resultados trimestrais.

**Parâmetros:**
```json
{
  "from": "2025-02-01",
  "to": "2025-02-28",
  "symbol": "AAPL"                // Opcional
}
```

**Exemplo de uso:**
```
"Quais empresas divulgam resultados na próxima semana?"
```

---

#### `get_stock_recommendations`
Recomendações de analistas.

**Parâmetros:**
```json
{
  "symbol": "AAPL"
}
```

---

## 💡 Exemplos de Uso Avançado

### Cenário 1: Criar Artigo Completo
```
"Crie um artigo completo sobre a nova política do BC:
- Título: 'BC mantém Selic em 12,75% e sinaliza cortes graduais'
- Autor: Carlos Mendes
- Categoria: economia
- Tags: BC, Selic, política monetária, juros
- Meta description: 'Copom decide manter taxa básica de juros em 12,75% ao ano e indica redução gradual ao longo de 2025'
- Keywords: BC, Selic, COPOM, juros
- Destaque na home: sim
- Status: published"

→ create_article(
    title: "BC mantém Selic em 12,75% e sinaliza cortes graduais",
    excerpt: "Copom decide manter taxa básica de juros em 12,75% ao ano...",
    content: "# BC mantém Selic em 12,75%...",
    category: "economia",
    authorId: "carlos-mendes",
    authorName: "Carlos Mendes",
    tags: ["BC", "Selic", "política monetária", "juros"],
    metaDescription: "Copom decide manter taxa básica de juros em 12,75% ao ano e indica redução gradual ao longo de 2025",
    keywords: ["BC", "Selic", "COPOM", "juros"],
    featured: true,
    status: "published"
  )
```

### Cenário 2: Atualizar SEO e Categorização
```
"Atualize o artigo 'bitcoin-etf':
- Adicione meta description: 'Bitcoin ETF supera expectativas...'
- Mude tags para: bitcoin, ETF, criptomoedas, investimentos
- Adicione keywords para SEO
- Traduza o título para inglês: 'Bitcoin ETF exceeds expectations'"

→ update_article(
    slug: "bitcoin-etf",
    metaDescription: "Bitcoin ETF supera expectativas...",
    tags: ["bitcoin", "ETF", "criptomoedas", "investimentos"],
    keywords: ["bitcoin", "ETF", "cripto", "investimentos"],
    titleEn: "Bitcoin ETF exceeds expectations"
  )
```

### Cenário 3: Publicação Rápida
```
"Preciso publicar urgentemente uma notícia sobre o Fed. 
Crie um artigo com título 'Fed mantém taxa de juros em 5.25%', 
use Carlos Mendes como autor, marque como breaking e destaque na home."

→ create_article(...)
→ publish_article(slug: "fed-mantem-taxa", makeFeatured: true, makeBreaking: true)
```

### Cenário 4: Relatório de Analytics
```
"Gere um relatório de analytics dos últimos 7 dias: 
pageviews totais, top 10 artigos, e sessões por dia."

→ get_dashboard_metrics(period: "7d")
→ get_top_articles(limit: 10, period: "7d")
→ get_analytics_events(startDate: "2025-02-01", eventType: "session_start")
```

---

## 🔐 Segurança

### Autenticação

O MCP Server utiliza:
- **Service Role Key** do Supabase (acesso total ao banco)
- **Conexão stdio** (local ou via SSH) - mais seguro que HTTP exposto
- **Validação Zod** em todas as entradas

### Recomendações

1. **Nunca exponha o MCP via HTTP público** sem autenticação
2. **Use SSH** para acesso remoto ao servidor
3. **Restrinja a Service Role Key** apenas ao MCP Server
4. **Monitore logs** de acesso ao banco
5. **Configure rate limiting** se necessário

### Permissões no Supabase

O MCP usa as seguintes políticas RLS:

```sql
-- Service role tem acesso total
CREATE POLICY "Service role full access"
ON analytics_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

## 🔧 Troubleshooting

### Erro: "Variáveis do Supabase não configuradas"
**Causa:** `.env` não encontrado ou variáveis faltando
**Solução:**
```bash
# Verifique se o .env existe na raiz
ls -la ../.env

# Ou exporte manualmente
export NEXT_PUBLIC_SUPABASE_URL="..."
export SUPABASE_SERVICE_ROLE_KEY="..."
```

### Erro: "Erro ao buscar cotação"
**Causa:** Finnhub API key inválida ou sem créditos
**Solução:**
- Verifique sua chave em https://finnhub.io/dashboard
- Plano gratuito: 60 calls/minuto

### Erro: "Artigo não encontrado"
**Causa:** Slug incorreto ou artigo deletado
**Solução:** Use `search_articles` para encontrar o slug correto

### Categoria não aparece no artigo
**Causa:** A categoria foi criada mas a relação não foi feita
**Solução:** Use `update_article` com o campo `category` para recriar a relação

---

## 📁 Estrutura de Arquivos

```
mcp-server/
├── src/
│   └── index.ts              # Código fonte principal (v1.1.0)
├── dist/                     # Código compilado (gerado)
├── package.json              # Dependências
├── tsconfig.json             # Config TypeScript
├── setup.sh                  # Script de instalação
├── INSTALL.md                # Guia de instalação
├── README.md                 # Documentação rápida
└── .gitignore
```

---

## 🔄 Atualização

Para atualizar o MCP Server após mudanças no código:

```bash
cd mcp-server
git pull origin main  # Se usar git
npm install         # Se houver novas dependências
npm run build       # Recompila
```

---

## 📚 Referências

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP SDK TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
- [Supabase Service Role Key](https://supabase.com/docs/guides/api/api-keys)
- [Finnhub API Docs](https://finnhub.io/docs/api)

---

## 📝 Changelog

### v1.1.0 (07/02/2026)
- ✅ **Campos completos de artigo**: tradução (EN), SEO (metaDescription, keywords), métricas iniciais
- ✅ **Categorias e Tags funcionando**: Cria/busca automaticamente e cria relações
- ✅ **Novas ferramentas**: `get_article_by_slug`, `list_articles` com filtros avançados
- ✅ **Busca aprimorada**: `search_articles` com filtro de categoria

### v1.0.0 (07/02/2026)
- ✅ Lançamento inicial com 16 ferramentas
- ✅ Analytics completo
- ✅ CRUD básico de artigos
- ✅ Integração Finnhub

---

**Versão:** 1.1.0  
**Última atualização:** 07/02/2026  
**Mantenedor:** Cenario Internacional
