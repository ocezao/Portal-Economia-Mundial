// Supabase Edge Function: ai-news
// Gera notícia (texto) usando GNews + OpenRouter

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  corsHeaders,
  jsonResponse,
  errorResponse,
  requireAdmin,
  parseBody,
  validateMethod,
} from "../_shared/auth.ts";

const GNEWS_API_KEY = Deno.env.get("GNEWS_API_KEY") ?? "";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const OPENROUTER_TEXT_MODEL = Deno.env.get("OPENROUTER_TEXT_MODEL") ?? "z-ai/glm-4.5-air:free";

const fetchGnews = async (params: { topic?: string; category?: string }) => {
  if (!GNEWS_API_KEY) throw new Error("GNEWS_API_KEY não configurada");

  const now = new Date();
  const to = now.toISOString();
  const from = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  const baseQuery = [
    "economia",
    "inflação",
    "juros",
    "PIB",
    "mercados",
    "banco central",
    "dólar",
    "petróleo",
    "China",
    "EUA",
    "Europa",
  ].join(" OR ");

  const category = params.category?.trim();
  const topic = params.topic?.trim();
  const query = [baseQuery, category, topic].filter(Boolean).join(" OR ");

  const url = new URL("https://gnews.io/api/v4/search");
  url.searchParams.set("q", query);
  url.searchParams.set("lang", "pt");
  url.searchParams.set("max", "10");
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("sortby", "publishedAt");
  url.searchParams.set("token", GNEWS_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`GNews error: ${response.status}`);
  }

  const data = await response.json();
  const articles = data?.articles ?? [];

  return articles.map((a: any) => ({
    title: a.title,
    description: a.description,
    content: a.content,
    url: a.url,
    source: a.source?.name ?? "",
    publishedAt: a.publishedAt,
  }));
};

const callOpenRouter = async (sources: any[], params: { topic?: string; category?: string; questions?: string }) => {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY não configurada");

  const prompt = `
Você é um jornalista econômico. Gere uma notícia ORIGINAL em pt-BR baseada APENAS nas fontes abaixo.
Requisitos:
- Escreva título, subtítulo, SEO title, SEO description, tags, resumo (excerpt) e conteúdo em HTML.
- Seja factual, cite dados reais das fontes.
- Se houver conflito, sinalize no texto.
- Não invente fatos.
- Categoria deve ser uma destas: economia | geopolitica | tecnologia.
- Tags entre 5 e 10.
 - Se o tema abaixo for informado, foque nele.
 - Se houver perguntas, responda no texto.

Tema solicitado: ${params.topic ?? "não especificado"}
Categoria sugerida: ${params.category ?? "não especificada"}
Perguntas do editor: ${params.questions ?? "nenhuma"}

Responda APENAS em JSON com este formato:
{
  "title": "...",
  "subtitle": "...",
  "seoTitle": "...",
  "seoDescription": "...",
  "tags": ["...", "..."],
  "excerpt": "...",
  "contentHtml": "<p>...</p>",
  "category": "economia",
  "author": "Redação PEM",
  "sources": [
    { "title": "...", "url": "...", "source": "...", "publishedAt": "..." }
  ]
}

Fontes (últimas 48h):
${JSON.stringify(sources, null, 2)}
`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://portaleconomicomundial.com",
      "X-Title": "Portal Economico Mundial",
    },
    body: JSON.stringify({
      model: OPENROUTER_TEXT_MODEL,
      messages: [
        { role: "system", content: "Você escreve notícias econômicas em pt-BR." },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "";

  return content;
};

const parseJson = (raw: string) => {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validar método
  const methodCheck = validateMethod(req, ["POST"]);
  if (!methodCheck.valid) {
    return methodCheck.response;
  }

  // Verificar autenticação e permissão de admin
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return jsonResponse({ error: auth.message }, auth.status);
  }

  // Parse do body
  const bodyResult = await parseBody(req);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  try {
    const body = bodyResult.data;
    const params = {
      topic: body.topic,
      category: body.category,
      questions: body.questions,
    };

    const sources = await fetchGnews(params);
    const raw = await callOpenRouter(sources, params);
    const parsed = parseJson(raw);

    return jsonResponse({ data: parsed });
  } catch (error) {
    return errorResponse(error, 500);
  }
});
