// ============================================================
// MÓDULO COMPARTILHADO: Autenticação para Edge Functions
// Data: 2025-02-08
// Autor: DBA Specialist
// ============================================================

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Logger seguro para edge functions
const logger = {
  error: (...args: unknown[]): void => {
    const isDev = Deno.env.get("DENO_ENV") === "development";
    if (isDev) {
      console.error(...args);
    } else {
      // Em produção, sanitizar para não expor dados sensíveis
      const sanitized = args.map(arg => {
        if (arg instanceof Error) return arg.message;
        if (typeof arg === "object" && arg !== null) return "[Object]";
        return arg;
      });
      console.error("[Error]", ...sanitized);
    }
  }
};

// Configuração do cliente admin (service role)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// CORS headers padrão para todas as edge functions
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Cliente admin singleton
let adminClient: SupabaseClient | null = null;

/**
 * Retorna o cliente Supabase com service role key
 */
export function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados");
    }
    adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  }
  return adminClient;
}

/**
 * Extrai e valida o token de autenticação do header Authorization
 */
export function extractAuthToken(req: Request): string | null {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token || null;
}

/**
 * Obtém o usuário autenticado a partir do token JWT
 */
export async function getAuthUser(req: Request): Promise<{ id: string; email?: string } | null> {
  const token = extractAuthToken(req);
  if (!token) return null;

  const admin = getAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  
  if (error || !data.user) return null;
  
  return {
    id: data.user.id,
    email: data.user.email,
  };
}

/**
 * Verifica se o usuário autenticado é administrador
 * Retorna objeto com resultado da verificação
 */
export async function requireAdmin(req: Request): Promise<
  | { ok: true; user: { id: string; email?: string } }
  | { ok: false; status: number; message: string }
> {
  const user = await getAuthUser(req);
  
  if (!user) {
    return { ok: false, status: 401, message: "Não autenticado" };
  }

  const admin = getAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    logger.error("Erro ao verificar perfil:", error);
    return { ok: false, status: 500, message: "Erro interno ao verificar permissões" };
  }

  if (profile?.role !== "admin") {
    return { ok: false, status: 403, message: "Sem permissão" };
  }

  return { ok: true, user };
}

/**
 * Helper para criar respostas JSON padronizadas
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      "Content-Type": "application/json", 
      ...corsHeaders 
    },
  });
}

/**
 * Helper para criar resposta de erro sanitizada (não vaza detalhes internos)
 */
export function errorResponse(error: unknown, status = 500): Response {
  // Em produção, não expor detalhes do erro interno
  const isDev = Deno.env.get("DENO_ENV") === "development";
  
  let message = "Erro interno do servidor";
  
  if (isDev && error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  }
  
  // Log do erro real para debugging (apenas no servidor)
  logger.error("[Edge Function Error]", error);
  
  return jsonResponse({ error: message }, status);
}

/**
 * Helper para validar método HTTP
 */
export function validateMethod(
  req: Request, 
  allowedMethods: string[] = ["POST"]
): { valid: true } | { valid: false; response: Response } {
  // Sempre permitir OPTIONS para CORS preflight
  if (req.method === "OPTIONS") {
    return { valid: true };
  }
  
  if (!allowedMethods.includes(req.method)) {
    return {
      valid: false,
      response: jsonResponse({ error: "Método não permitido" }, 405),
    };
  }
  
  return { valid: true };
}

/**
 * Helper para parsear JSON do body com tratamento de erro
 */
export async function parseBody<T = Record<string, unknown>>(
  req: Request
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  try {
    const data = await req.json();
    return { ok: true, data: data as T };
  } catch {
    return { 
      ok: false, 
      response: jsonResponse({ error: "JSON inválido" }, 400) 
    };
  }
}
