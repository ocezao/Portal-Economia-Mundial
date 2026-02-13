#!/usr/bin/env node
/**
 * Servidor MCP - Cenario Internacional
 * 
 * Funcionalidades:
 * - Analytics/Tracking (leitura completa)
 * - Gerenciamento de Conteúdo (CRUD de artigos com categorias/tags)
 * - Dados de Mercado (Finnhub)
 * - Métricas de Engajamento
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

// Logger seguro para MCP server
const logger = {
  error: (...args: unknown[]): void => {
    // Em produção, sanitizar para não expor dados sensíveis
    if (process.env.NODE_ENV === 'production') {
      const sanitized = args.map(arg => {
        if (arg instanceof Error) return arg.message;
        if (typeof arg === 'object' && arg !== null) return '[Object]';
        return arg;
      });
      // eslint-disable-next-line no-console
      console.error('[Error]', ...sanitized);
    } else {
      // eslint-disable-next-line no-console
      console.error(...args);
    }
  },
  info: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.error(...args); // MCP usa stderr para logs
  }
};

// Carrega variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../../.env");

try {
  const envConfig = readFileSync(envPath, 'utf8');
  const envVars = dotenv.parse(envConfig);
  Object.assign(process.env, envVars);
} catch {
  dotenv.config();
}

// Configuração do Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  logger.error("❌ Erro: Variáveis do Supabase não configuradas");
  process.exit(1);
}

// Cliente Supabase com service role (acesso total)
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================
// SCHEMAS DE VALIDAÇÃO (ZOD)
// ============================================

const GetAnalyticsSchema = z.object({
  startDate: z.string().optional().describe("Data inicial (YYYY-MM-DD)"),
  endDate: z.string().optional().describe("Data final (YYYY-MM-DD)"),
  eventType: z.string().optional().describe("Tipo de evento (page_view, article_read, etc)"),
  limit: z.number().default(100).describe("Limite de resultados"),
});

const GetArticleStatsSchema = z.object({
  slug: z.string().describe("Slug do artigo"),
  period: z.enum(["7d", "30d", "90d", "all"]).default("30d").describe("Período de análise"),
});

const GetTopArticlesSchema = z.object({
  limit: z.number().default(10).describe("Número de artigos"),
  period: z.enum(["24h", "7d", "30d", "all"]).default("7d").describe("Período"),
  metric: z.enum(["views", "engagement", "shares"]).default("views").describe("Métrica de ordenação"),
});

const GetUserSessionsSchema = z.object({
  userId: z.string().optional().describe("ID do usuário específico (opcional)"),
  limit: z.number().default(50).describe("Limite de sessões"),
  startDate: z.string().optional().describe("Data inicial"),
  endDate: z.string().optional().describe("Data final"),
});

// Schema completo de criação de artigo
const CreateArticleSchema = z.object({
  // Campos obrigatórios
  title: z.string().min(5).describe("Título do artigo (obrigatório)"),
  excerpt: z.string().min(10).describe("Resumo/lead do artigo (obrigatório) - aparece na listagem"),
  content: z.string().min(50).describe("Conteúdo completo em Markdown/HTML (obrigatório)"),
  category: z.string().describe("Categoria: economia, geopolitica, tecnologia, mercados (obrigatório)"),
  authorId: z.string().describe("ID/slug do autor (obrigatório)"),
  authorName: z.string().describe("Nome do autor para exibição (obrigatório)"),
  
  // Campos opcionais de conteúdo
  titleEn: z.string().optional().describe("Título em inglês (opcional - para tradução)"),
  excerptEn: z.string().optional().describe("Resumo em inglês (opcional)"),
  contentEn: z.string().optional().describe("Conteúdo em inglês (opcional)"),
  
  // SEO e metadados
  metaDescription: z.string().max(160).optional().describe("Meta description para SEO (max 160 chars)"),
  keywords: z.array(z.string()).default([]).describe("Palavras-chave para SEO"),
  
  // Categorização
  tags: z.array(z.string()).default([]).describe("Tags do artigo (ex: ['inflação', 'BC', 'economia'])"),
  
  // Mídia
  coverImage: z.string().default("/images/news/default.webp").describe("URL da imagem de capa"),
  
  // Configurações de publicação
  featured: z.boolean().default(false).describe("Destacar na home page"),
  breaking: z.boolean().default(false).describe("Marcar como breaking news (urgente)"),
  status: z.enum(["draft", "published", "scheduled"]).default("draft").describe("Status do artigo"),
  scheduledFor: z.string().optional().describe("Data de agendamento (ISO 8601, ex: 2025-02-10T10:00:00Z)"),
  
  // Métricas iniciais (opcional)
  views: z.number().default(0).describe("Views iniciais (default: 0)"),
  likes: z.number().default(0).describe("Likes iniciais (default: 0)"),
  shares: z.number().default(0).describe("Shares iniciais (default: 0)"),
});

const UpdateArticleSchema = z.object({
  slug: z.string().describe("Slug do artigo a ser atualizado (obrigatório)"),
  title: z.string().min(5).optional().describe("Novo título"),
  excerpt: z.string().min(10).optional().describe("Novo resumo"),
  content: z.string().min(50).optional().describe("Novo conteúdo"),
  titleEn: z.string().optional().describe("Título em inglês"),
  excerptEn: z.string().optional().describe("Resumo em inglês"),
  contentEn: z.string().optional().describe("Conteúdo em inglês"),
  category: z.string().optional().describe("Nova categoria (vai recriar a relação)"),
  tags: z.array(z.string()).optional().describe("Novas tags (vai substituir as existentes)"),
  metaDescription: z.string().max(160).optional().describe("Nova meta description"),
  keywords: z.array(z.string()).optional().describe("Novas palavras-chave SEO"),
  coverImage: z.string().optional().describe("Nova imagem de capa"),
  status: z.enum(["draft", "published", "scheduled"]).optional().describe("Novo status"),
  featured: z.boolean().optional().describe("Destacar na home"),
  breaking: z.boolean().optional().describe("Marcar como breaking"),
  scheduledFor: z.string().optional().describe("Nova data de agendamento"),
});

const DeleteArticleSchema = z.object({
  slug: z.string().describe("Slug do artigo a ser deletado"),
});

const GetMarketQuoteSchema = z.object({
  symbol: z.string().describe("Símbolo da ação (ex: AAPL, PETR4, BTC)"),
});

const GetMarketNewsSchema = z.object({
  category: z.enum(["general", "forex", "crypto", "merger"]).default("general").describe("Categoria"),
  limit: z.number().default(10).describe("Limite de notícias"),
});

const GetEarningsCalendarSchema = z.object({
  from: z.string().describe("Data inicial (YYYY-MM-DD)"),
  to: z.string().describe("Data final (YYYY-MM-DD)"),
  symbol: z.string().optional().describe("Símbolo específico (opcional)"),
});

const SearchArticlesSchema = z.object({
  query: z.string().describe("Termo de busca"),
  status: z.enum(["all", "published", "draft", "scheduled"]).default("all").describe("Status"),
  category: z.string().optional().describe("Filtrar por categoria"),
  limit: z.number().default(20).describe("Limite de resultados"),
});

const GetDashboardMetricsSchema = z.object({
  period: z.enum(["24h", "7d", "30d"]).default("7d").describe("Período"),
});

// ============================================
// TIPOS
// ============================================

type AnalyticsEvent = {
  event_type: string;
  properties?: { depth?: number };
};

type Article = {
  id: string;
  slug: string;
  title: string;
  published_at: string;
  views: number;
  likes: number;
  shares: number;
  comments_count: number;
};

type Session = {
  user_id: string;
};

// ============================================
// UTILITÁRIOS
// ============================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function generateSlug(title: string): string {
  const baseSlug = slugify(title);
  const timestamp = Date.now().toString(36).slice(-4);
  return `${baseSlug}-${timestamp}`;
}

// Type guards
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// ============================================
// DEFINIÇÃO DAS FERRAMENTAS MCP
// ============================================

const TOOLS: Tool[] = [
  // ========== ANALYTICS / TRACKING ==========
  {
    name: "get_analytics_events",
    description: "Busca eventos de tracking/analytics com filtros de data, tipo e limite",
    inputSchema: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "Data inicial (YYYY-MM-DD)" },
        endDate: { type: "string", description: "Data final (YYYY-MM-DD)" },
        eventType: { type: "string", description: "Tipo: page_view, article_read_start, article_read_complete, scroll_depth, engagement_pulse, session_start" },
        limit: { type: "number", default: 100 },
      },
    },
  },
  {
    name: "get_article_stats",
    description: "Estatísticas detalhadas de um artigo: views, tempo de leitura, taxa de conclusão, scroll depth, likes, shares",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug do artigo (ex: bitcoin-etf, fed-aumenta-juros)" },
        period: { type: "string", enum: ["7d", "30d", "90d", "all"], default: "30d" },
      },
      required: ["slug"],
    },
  },
  {
    name: "get_top_articles",
    description: "Artigos mais populares ordenados por views, engajamento ou compartilhamentos",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", default: 10 },
        period: { type: "string", enum: ["24h", "7d", "30d", "all"], default: "7d" },
        metric: { type: "string", enum: ["views", "engagement", "shares"], default: "views" },
      },
    },
  },
  {
    name: "get_user_sessions",
    description: "Sessões de usuários com métricas de engajamento, device, browser, páginas visitadas",
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string", description: "ID do usuário específico (opcional)" },
        limit: { type: "number", default: 50 },
        startDate: { type: "string", description: "Data inicial (YYYY-MM-DD)" },
        endDate: { type: "string", description: "Data final (YYYY-MM-DD)" },
      },
    },
  },
  {
    name: "get_dashboard_metrics",
    description: "Métricas agregadas do dashboard: pageviews totais, usuários ativos, artigos publicados, média de páginas por sessão",
    inputSchema: {
      type: "object",
      properties: {
        period: { type: "string", enum: ["24h", "7d", "30d"], default: "7d" },
      },
    },
  },
  {
    name: "get_traffic_sources",
    description: "Fontes de tráfego: orgânico, direct, social, referral, email",
    inputSchema: {
      type: "object",
      properties: {
        period: { type: "string", enum: ["24h", "7d", "30d"], default: "7d" },
      },
    },
  },

  // ========== GERENCIAMENTO DE CONTEÚDO ==========
  {
    name: "create_article",
    description: `Cria um novo artigo/post no portal com todas as configurações: título, resumo, conteúdo, categoria, tags, autor, imagem de capa, SEO (meta description, keywords), tradução (inglês), status (draft/published/scheduled), destaque e breaking news.`,
    inputSchema: {
      type: "object",
      properties: {
        // Obrigatórios
        title: { type: "string", description: "Título do artigo (obrigatório)" },
        excerpt: { type: "string", description: "Resumo/lead do artigo - aparece na listagem (obrigatório)" },
        content: { type: "string", description: "Conteúdo completo em Markdown/HTML (obrigatório)" },
        category: { type: "string", description: "Categoria: economia, geopolitica, tecnologia, mercados (obrigatório)" },
        authorId: { type: "string", description: "ID ou slug do autor (obrigatório)" },
        authorName: { type: "string", description: "Nome do autor para exibição (obrigatório)" },
        
        // Tradução (opcional)
        titleEn: { type: "string", description: "Título em inglês (opcional)" },
        excerptEn: { type: "string", description: "Resumo em inglês (opcional)" },
        contentEn: { type: "string", description: "Conteúdo em inglês (opcional)" },
        
        // SEO
        metaDescription: { type: "string", maxLength: 160, description: "Meta description para SEO - max 160 caracteres (opcional)" },
        keywords: { type: "array", items: { type: "string" }, description: "Palavras-chave para SEO (opcional)" },
        
        // Categorização
        tags: { type: "array", items: { type: "string" }, description: "Tags do artigo - ex: ['inflação', 'BC', 'economia'] (opcional)" },
        
        // Mídia
        coverImage: { type: "string", default: "/images/news/default.webp", description: "URL da imagem de capa (opcional)" },
        
        // Configurações
        featured: { type: "boolean", default: false, description: "Destacar na home page (opcional)" },
        breaking: { type: "boolean", default: false, description: "Marcar como breaking news/urgente (opcional)" },
        status: { type: "string", enum: ["draft", "published", "scheduled"], default: "draft", description: "Status do artigo (opcional)" },
        scheduledFor: { type: "string", description: "Data de agendamento ISO 8601 - ex: 2025-02-10T10:00:00Z (opcional)" },
        
        // Métricas iniciais
        views: { type: "number", default: 0, description: "Views iniciais (opcional)" },
        likes: { type: "number", default: 0, description: "Likes iniciais (opcional)" },
        shares: { type: "number", default: 0, description: "Shares iniciais (opcional)" },
      },
      required: ["title", "excerpt", "content", "category", "authorId", "authorName"],
    },
  },
  {
    name: "update_article",
    description: "Atualiza um artigo existente. Permite modificar: título, resumo, conteúdo, tradução, categoria, tags, SEO, imagem, status, destaque e breaking.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug do artigo a ser atualizado (obrigatório)" },
        title: { type: "string", description: "Novo título (opcional)" },
        excerpt: { type: "string", description: "Novo resumo (opcional)" },
        content: { type: "string", description: "Novo conteúdo (opcional)" },
        titleEn: { type: "string", description: "Novo título em inglês (opcional)" },
        excerptEn: { type: "string", description: "Novo resumo em inglês (opcional)" },
        contentEn: { type: "string", description: "Novo conteúdo em inglês (opcional)" },
        category: { type: "string", description: "Nova categoria - vai recriar a relação (opcional)" },
        tags: { type: "array", items: { type: "string" }, description: "Novas tags - substitui as existentes (opcional)" },
        metaDescription: { type: "string", maxLength: 160, description: "Nova meta description (opcional)" },
        keywords: { type: "array", items: { type: "string" }, description: "Novas palavras-chave SEO (opcional)" },
        coverImage: { type: "string", description: "Nova imagem de capa (opcional)" },
        status: { type: "string", enum: ["draft", "published", "scheduled"], description: "Novo status (opcional)" },
        featured: { type: "boolean", description: "Destacar na home (opcional)" },
        breaking: { type: "boolean", description: "Marcar como breaking (opcional)" },
        scheduledFor: { type: "string", description: "Nova data de agendamento (opcional)" },
      },
      required: ["slug"],
    },
  },
  {
    name: "delete_article",
    description: "Remove permanentemente um artigo do portal (incluindo suas relações de categoria e tags)",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug do artigo a ser deletado" },
      },
      required: ["slug"],
    },
  },
  {
    name: "search_articles",
    description: "Busca artigos por termo no título, resumo ou conteúdo. Permite filtrar por status e categoria.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Termo de busca (obrigatório)" },
        status: { type: "string", enum: ["all", "published", "draft", "scheduled"], default: "all", description: "Filtrar por status (opcional)" },
        category: { type: "string", description: "Filtrar por categoria (opcional)" },
        limit: { type: "number", default: 20, description: "Limite de resultados (opcional)" },
      },
      required: ["query"],
    },
  },
  {
    name: "list_articles",
    description: "Lista artigos com filtros avançados: status, categoria, autor, paginação",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["all", "published", "draft", "scheduled"], default: "published", description: "Status (opcional)" },
        category: { type: "string", description: "Filtrar por categoria (opcional)" },
        author: { type: "string", description: "Filtrar por autor (opcional)" },
        limit: { type: "number", default: 20, description: "Limite (opcional)" },
        offset: { type: "number", default: 0, description: "Offset para paginação (opcional)" },
      },
    },
  },
  {
    name: "publish_article",
    description: "Publica um artigo imediatamente (mesmo se estiver em draft), com opções de destacar na home e marcar como breaking news",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug do artigo (obrigatório)" },
        makeFeatured: { type: "boolean", default: false, description: "Destacar na home (opcional)" },
        makeBreaking: { type: "boolean", default: false, description: "Marcar como breaking news (opcional)" },
      },
      required: ["slug"],
    },
  },
  {
    name: "get_article_by_slug",
    description: "Busca um artigo específico pelo slug, retornando todos os dados incluindo categoria, tags e traduções",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug do artigo" },
      },
      required: ["slug"],
    },
  },

  // ========== DADOS DE MERCADO (FINNHUB) ==========
  {
    name: "get_market_quote",
    description: "Cotação em tempo real de uma ação/ativo: preço atual, alta, baixa, abertura, fechamento anterior, variação percentual",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Símbolo: AAPL, MSFT, PETR4, BTCUSD" },
      },
      required: ["symbol"],
    },
  },
  {
    name: "get_market_news",
    description: "Notícias de mercado em tempo real da Finnhub por categoria",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["general", "forex", "crypto", "merger"], default: "general", description: "Categoria de notícias" },
        limit: { type: "number", default: 10, description: "Limite de notícias" },
      },
    },
  },
  {
    name: "get_earnings_calendar",
    description: "Calendário de resultados trimestrais (earnings) das empresas",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "Data inicial (YYYY-MM-DD) - obrigatório" },
        to: { type: "string", description: "Data final (YYYY-MM-DD) - obrigatório" },
        symbol: { type: "string", description: "Símbolo específico (opcional)" },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "get_stock_recommendations",
    description: "Recomendações de analistas para uma ação: buy, hold, sell com período",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Símbolo da ação (ex: AAPL)" },
      },
      required: ["symbol"],
    },
  },
];

// ============================================
// HANDLERS DAS FERRAMENTAS
// ============================================

async function handleGetAnalyticsEvents(args: z.infer<typeof GetAnalyticsSchema>) {
  let query = supabase
    .from("analytics_events")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(args.limit);

  if (args.startDate) {
    query = query.gte("timestamp", new Date(args.startDate).toISOString());
  }
  if (args.endDate) {
    query = query.lte("timestamp", new Date(args.endDate).toISOString());
  }
  if (args.eventType) {
    query = query.eq("event_type", args.eventType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function handleGetArticleStats(args: z.infer<typeof GetArticleStatsSchema>) {
  // Busca artigo
  const { data: article } = await supabase
    .from("news_articles")
    .select("id, slug, title, views, likes, shares, comments_count, published_at")
    .eq("slug", args.slug)
    .single();

  if (!article) throw new Error("Artigo não encontrado");

  // Busca eventos específicos do artigo
  const startDate = new Date();
  if (args.period === "7d") startDate.setDate(startDate.getDate() - 7);
  else if (args.period === "30d") startDate.setDate(startDate.getDate() - 30);
  else if (args.period === "90d") startDate.setDate(startDate.getDate() - 90);
  else startDate.setFullYear(2000);

  const { data: events } = await supabase
    .from("analytics_events")
    .select("*")
    .eq("article_id", article.id)
    .gte("timestamp", startDate.toISOString());

  // Calcula métricas
  const eventsList = Array.isArray(events) ? events as AnalyticsEvent[] : [];
  const pageViews = eventsList.filter(e => e.event_type === "page_view").length;
  const readStarts = eventsList.filter(e => e.event_type === "article_read_start").length;
  const readCompletes = eventsList.filter(e => e.event_type === "article_read_complete").length;
  const scrollDepthEvents = eventsList.filter(e => e.event_type === "scroll_depth");
  const avgScrollDepth = scrollDepthEvents.length > 0
    ? scrollDepthEvents.reduce((acc, e) => acc + (e.properties?.depth ?? 0), 0) / scrollDepthEvents.length
    : 0;

  return {
    article: {
      id: article.id,
      slug: article.slug,
      title: article.title,
      publishedAt: article.published_at,
    },
    metrics: {
      totalViews: article.views,
      periodViews: pageViews,
      readStarts,
      readCompletes,
      completionRate: readStarts > 0 ? ((readCompletes / readStarts) * 100).toFixed(2) + "%" : "0%",
      avgScrollDepth: avgScrollDepth ? avgScrollDepth.toFixed(2) + "%" : "N/A",
      likes: article.likes,
      shares: article.shares,
      comments: article.comments_count,
    },
    events: eventsList,
  };
}

async function handleGetTopArticles(args: z.infer<typeof GetTopArticlesSchema>) {
  const { data, error } = await supabase
    .from("news_articles")
    .select("slug, title, excerpt, category, views, likes, shares, published_at, cover_image")
    .eq("status", "published")
    .order(args.metric === "views" ? "views" : args.metric === "shares" ? "shares" : "views", { ascending: false })
    .limit(args.limit);

  if (error) throw error;
  return data ?? [];
}

async function handleGetUserSessions(args: z.infer<typeof GetUserSessionsSchema>) {
  let query = supabase
    .from("analytics_sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(args.limit);

  if (args.userId) query = query.eq("user_id", args.userId);
  if (args.startDate) query = query.gte("started_at", new Date(args.startDate).toISOString());
  if (args.endDate) query = query.lte("started_at", new Date(args.endDate).toISOString());

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function handleGetDashboardMetrics(args: z.infer<typeof GetDashboardMetricsSchema>) {
  const days = args.period === "24h" ? 1 : args.period === "7d" ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Total de pageviews
  const { count: pageviews } = await supabase
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "page_view")
    .gte("timestamp", startDate.toISOString());

  // Sessões únicas
  const { count: sessions } = await supabase
    .from("analytics_sessions")
    .select("*", { count: "exact", head: true })
    .gte("started_at", startDate.toISOString());

  // Usuários ativos (únicos)
  const { data: activeUsers } = await supabase
    .from("analytics_events")
    .select("user_id")
    .gte("timestamp", startDate.toISOString())
    .not("user_id", "is", null);

  const uniqueUsers = new Set((activeUsers as Session[] | null)?.map(e => e.user_id)).size;

  // Artigos publicados no período
  const { count: articlesPublished } = await supabase
    .from("news_articles")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .gte("published_at", startDate.toISOString());

  return {
    period: args.period,
    metrics: {
      pageviews: pageviews ?? 0,
      sessions: sessions ?? 0,
      uniqueUsers,
      articlesPublished: articlesPublished ?? 0,
      avgPagesPerSession: sessions ? ((pageviews ?? 0) / sessions).toFixed(2) : "0",
    },
  };
}

// ============================================
// CRUD ARTIGOS COMPLETO
// ============================================

interface ArticleUpdate {
  title?: string;
  excerpt?: string;
  content?: string;
  title_en?: string | null;
  excerpt_en?: string | null;
  content_en?: string | null;
  meta_description?: string | null;
  seo_keywords?: string[];
  cover_image?: string;
  status?: string;
  is_featured?: boolean;
  is_breaking?: boolean;
  reading_time?: number;
  updated_at?: string;
}

async function handleCreateArticle(args: z.infer<typeof CreateArticleSchema>) {
  const slug = generateSlug(args.title);
  const readingTime = Math.ceil(args.content.split(/\s+/).length / 200);

  // 1. Insere o artigo
  const { data: article, error: articleError } = await supabase
    .from("news_articles")
    .insert({
      slug,
      title: args.title,
      title_en: args.titleEn || null,
      excerpt: args.excerpt,
      excerpt_en: args.excerptEn || null,
      content: args.content,
      content_en: args.contentEn || null,
      meta_description: args.metaDescription || null,
      seo_keywords: args.keywords || [],
      author_id: args.authorId,
      author_name: args.authorName,
      cover_image: args.coverImage,
      is_featured: args.featured,
      is_breaking: args.breaking,
      status: args.status,
      published_at: args.status === "published" ? new Date().toISOString() : args.scheduledFor || null,
      reading_time: readingTime,
      views: args.views,
      likes: args.likes,
      shares: args.shares,
      comments_count: 0,
    })
    .select()
    .single();

  if (articleError) throw articleError;
  if (!article) throw new Error("Erro ao criar artigo");

  const articleId = isRecord(article) && isString(article.id) ? article.id : '';

  // 2. Cria/Busca categoria e relaciona
  if (args.category) {
    const categorySlug = slugify(args.category);
    
    // Busca ou cria categoria
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();

    if (isRecord(category) && isString(category.id)) {
      await supabase.from("news_article_categories").insert({
        article_id: articleId,
        category_id: category.id,
      });
    } else {
      // Cria nova categoria
      const { data: newCategory } = await supabase
        .from("categories")
        .insert({ name: args.category, slug: categorySlug })
        .select()
        .single();
      
      if (isRecord(newCategory) && isString(newCategory.id)) {
        await supabase.from("news_article_categories").insert({
          article_id: articleId,
          category_id: newCategory.id,
        });
      }
    }
  }

  // 3. Cria/Busca tags e relaciona
  if (args.tags && args.tags.length > 0) {
    for (const tagName of args.tags) {
      const tagSlug = slugify(tagName);
      
      // Upsert tag
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ name: tagName, slug: tagSlug }, { onConflict: "slug" })
        .select()
        .single();

      if (isRecord(tag) && isString(tag.id)) {
        await supabase.from("news_article_tags").insert({
          article_id: articleId,
          tag_id: tag.id,
        });
      }
    }
  }

  return { 
    success: true, 
    article: {
      id: articleId,
      slug: isRecord(article) && isString(article.slug) ? article.slug : slug,
      title: isRecord(article) && isString(article.title) ? article.title : args.title,
      status: isRecord(article) && isString(article.status) ? article.status : args.status,
      category: args.category,
      tags: args.tags,
    }, 
    url: `/noticias/${slug}/` 
  };
}

async function handleUpdateArticle(args: z.infer<typeof UpdateArticleSchema>) {
  // Busca o artigo primeiro para pegar o ID
  const { data: existingArticle } = await supabase
    .from("news_articles")
    .select("id")
    .eq("slug", args.slug)
    .single();

  if (!isRecord(existingArticle) || !isString(existingArticle.id)) {
    throw new Error("Artigo não encontrado");
  }

  const updates: ArticleUpdate = {};
  
  if (args.title) updates.title = args.title;
  if (args.excerpt) updates.excerpt = args.excerpt;
  if (args.content) {
    updates.content = args.content;
    updates.reading_time = Math.ceil(args.content.split(/\s+/).length / 200);
  }
  if (args.titleEn !== undefined) updates.title_en = args.titleEn;
  if (args.excerptEn !== undefined) updates.excerpt_en = args.excerptEn;
  if (args.contentEn !== undefined) updates.content_en = args.contentEn;
  if (args.metaDescription !== undefined) updates.meta_description = args.metaDescription;
  if (args.keywords) updates.seo_keywords = args.keywords;
  if (args.coverImage) updates.cover_image = args.coverImage;
  if (args.status) updates.status = args.status;
  if (typeof args.featured === "boolean") updates.is_featured = args.featured;
  if (typeof args.breaking === "boolean") updates.is_breaking = args.breaking;
  updates.updated_at = new Date().toISOString();

  // Atualiza artigo
  const { data: article, error } = await supabase
    .from("news_articles")
    .update(updates)
    .eq("slug", args.slug)
    .select()
    .single();

  if (error) throw error;

  // Atualiza categoria (remove antiga, adiciona nova)
  if (args.category) {
    await supabase
      .from("news_article_categories")
      .delete()
      .eq("article_id", existingArticle.id);

    const categorySlug = slugify(args.category);
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();

    if (isRecord(category) && isString(category.id)) {
      await supabase.from("news_article_categories").insert({
        article_id: existingArticle.id,
        category_id: category.id,
      });
    }
  }

  // Atualiza tags (substitui todas)
  if (args.tags) {
    await supabase
      .from("news_article_tags")
      .delete()
      .eq("article_id", existingArticle.id);

    for (const tagName of args.tags) {
      const tagSlug = slugify(tagName);
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ name: tagName, slug: tagSlug }, { onConflict: "slug" })
        .select()
        .single();

      if (isRecord(tag) && isString(tag.id)) {
        await supabase.from("news_article_tags").insert({
          article_id: existingArticle.id,
          tag_id: tag.id,
        });
      }
    }
  }

  return { success: true, article };
}

async function handleDeleteArticle(args: z.infer<typeof DeleteArticleSchema>) {
  // As relações em news_article_categories e news_article_tags 
  // devem ter ON DELETE CASCADE configurado no banco
  const { error } = await supabase
    .from("news_articles")
    .delete()
    .eq("slug", args.slug);

  if (error) throw error;
  return { success: true, message: `Artigo "${args.slug}" deletado com sucesso` };
}

async function handleSearchArticles(args: z.infer<typeof SearchArticlesSchema>) {
  let query = supabase
    .from("news_articles")
    .select(`
      *,
      news_article_categories(categories(name, slug)),
      news_article_tags(tags(name, slug))
    `)
    .or(`title.ilike.%${args.query}%,excerpt.ilike.%${args.query}%,content.ilike.%${args.query}%`)
    .limit(args.limit);

  if (args.status !== "all") {
    query = query.eq("status", args.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

interface GetArticleBySlugArgs {
  slug: string;
}

async function handleGetArticleBySlug(args: GetArticleBySlugArgs) {
  const { data, error } = await supabase
    .from("news_articles")
    .select(`
      *,
      news_article_categories(categories(name, slug)),
      news_article_tags(tags(name, slug))
    `)
    .eq("slug", args.slug)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Artigo não encontrado");
  return data;
}

interface PublishArticleArgs {
  slug: string;
  makeFeatured?: boolean;
  makeBreaking?: boolean;
}

async function handlePublishArticle(args: PublishArticleArgs) {
  const updates: ArticleUpdate = {
    status: "published",
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (args.makeFeatured) updates.is_featured = true;
  if (args.makeBreaking) updates.is_breaking = true;

  const { data, error } = await supabase
    .from("news_articles")
    .update(updates)
    .eq("slug", args.slug)
    .select()
    .single();

  if (error) throw error;
  
  const articleTitle = isRecord(data) && isString(data.title) ? data.title : args.slug;
  
  return { 
    success: true, 
    message: `Artigo "${articleTitle}" publicado com sucesso`,
    article: data,
    url: `/noticias/${args.slug}/`
  };
}

// ============================================
// DADOS DE MERCADO (FINNHUB)
// ============================================

async function handleGetMarketQuote(args: z.infer<typeof GetMarketQuoteSchema>) {
  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${args.symbol}&token=${FINNHUB_API_KEY}`
  );
  if (!response.ok) throw new Error("Erro ao buscar cotação");
  return await response.json();
}

async function handleGetMarketNews(args: z.infer<typeof GetMarketNewsSchema>) {
  const response = await fetch(
    `https://finnhub.io/api/v1/news?category=${args.category}&token=${FINNHUB_API_KEY}`
  );
  if (!response.ok) throw new Error("Erro ao buscar notícias");
  const data = await response.json();
  return Array.isArray(data) ? data.slice(0, args.limit) : [];
}

async function handleGetEarningsCalendar(args: z.infer<typeof GetEarningsCalendarSchema>) {
  let url = `https://finnhub.io/api/v1/calendar/earnings?from=${args.from}&to=${args.to}&token=${FINNHUB_API_KEY}`;
  if (args.symbol) url += `&symbol=${args.symbol}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error("Erro ao buscar calendário");
  const data = await response.json();
  
  if (isRecord(data) && Array.isArray(data.earningsCalendar)) {
    return data.earningsCalendar;
  }
  return [];
}

interface GetStockRecommendationsArgs {
  symbol: string;
}

async function handleGetStockRecommendations(args: GetStockRecommendationsArgs) {
  const response = await fetch(
    `https://finnhub.io/api/v1/stock/recommendation?symbol=${args.symbol}&token=${FINNHUB_API_KEY}`
  );
  if (!response.ok) throw new Error("Erro ao buscar recomendações");
  return await response.json();
}

// ============================================
// SERVIDOR MCP
// ============================================

const server = new Server(
  {
    name: "cin-news-server",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Tipo para argumentos de ferramentas
interface ListArticlesArgs {
  status?: "all" | "published" | "draft" | "scheduled";
  category?: string;
  limit?: number;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      // Analytics
      case "get_analytics_events":
        result = await handleGetAnalyticsEvents(GetAnalyticsSchema.parse(args));
        break;
      case "get_article_stats":
        result = await handleGetArticleStats(GetArticleStatsSchema.parse(args));
        break;
      case "get_top_articles":
        result = await handleGetTopArticles(GetTopArticlesSchema.parse(args));
        break;
      case "get_user_sessions":
        result = await handleGetUserSessions(GetUserSessionsSchema.parse(args));
        break;
      case "get_dashboard_metrics":
        result = await handleGetDashboardMetrics(GetDashboardMetricsSchema.parse(args));
        break;
      case "get_traffic_sources":
        result = { message: "Funcionalidade em desenvolvimento" };
        break;

      // Gerenciamento de Conteúdo
      case "create_article":
        result = await handleCreateArticle(CreateArticleSchema.parse(args));
        break;
      case "update_article":
        result = await handleUpdateArticle(UpdateArticleSchema.parse(args));
        break;
      case "delete_article":
        result = await handleDeleteArticle(DeleteArticleSchema.parse(args));
        break;
      case "search_articles":
        result = await handleSearchArticles(SearchArticlesSchema.parse(args));
        break;
      case "list_articles": {
        const listArgs = args as ListArticlesArgs;
        result = await handleSearchArticles({ 
          query: "", 
          status: listArgs.status || "published", 
          category: listArgs.category,
          limit: listArgs.limit || 20 
        });
        break;
      }
      case "get_article_by_slug":
        result = await handleGetArticleBySlug(args as GetArticleBySlugArgs);
        break;
      case "publish_article":
        result = await handlePublishArticle(args as PublishArticleArgs);
        break;

      // Dados de Mercado
      case "get_market_quote":
        result = await handleGetMarketQuote(GetMarketQuoteSchema.parse(args));
        break;
      case "get_market_news":
        result = await handleGetMarketNews(GetMarketNewsSchema.parse(args));
        break;
      case "get_earnings_calendar":
        result = await handleGetEarningsCalendar(GetEarningsCalendarSchema.parse(args));
        break;
      case "get_stock_recommendations":
        result = await handleGetStockRecommendations(args as GetStockRecommendationsArgs);
        break;

      default:
        throw new Error(`Ferramenta "${name}" não encontrada`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Inicia servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("✅ Servidor MCP CIN v1.1.0 iniciado via stdio");
}

main().catch((error) => {
  logger.error("❌ Erro fatal:", error);
  process.exit(1);
});
