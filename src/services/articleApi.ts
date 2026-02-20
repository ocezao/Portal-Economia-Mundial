/**
 * API Client for Article Management
 * Uses server-side API route to bypass RLS with Service Role Key
 */

import { supabase } from '@/lib/supabaseClient';

const API_BASE = '/api/articles/';

async function callArticleApi(action: string, payload: Record<string, unknown> = {}) {
  const { data, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error:', sessionError);
    throw new Error(`Erro de sessão: ${sessionError.message}`);
  }
  
  const token = data.session?.access_token;

  if (!token) {
    throw new Error('Sessao invalida. Faça login novamente.');
  }

  let response: Response;
  try {
    response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch (fetchError) {
    console.error('Fetch error:', fetchError);
    throw new Error(`Erro de rede: ${fetchError instanceof Error ? fetchError.message : 'Unknown'}`);
  }

  const text = await response.text();
  
  // Check if response is HTML (error page)
  if (text.trim().startsWith('<') && !text.trim().startsWith('{') && !text.trim().startsWith('[')) {
    console.error('HTML response received:', text.substring(0, 200));
    throw new Error(`Erro do servidor: ${response.status} ${response.statusText}. Tente fazer logout e login novamente.`);
  }

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text);
  } catch {
    console.error('Invalid JSON:', text.substring(0, 200));
    throw new Error(`Resposta invalida do servidor: ${text.substring(0, 100)}`);
  }

  if (!response.ok) {
    throw new Error(json.error as string || `Erro: ${response.status}`);
  }

  return json;
}

export async function createArticleApi(articleData: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  authorId: string;
  author: string;
  tags?: string[];
  coverImage: string;
  featured?: boolean;
  breaking?: boolean;
  readingTime?: number;
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
}) {
  console.log('Creating article via API:', articleData.title);
  const result = await callArticleApi('create', articleData);
  console.log('Article created successfully:', result);
  return result;
}

export async function updateArticleApi(
  slug: string,
  updates: Partial<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    authorId: string;
    author: string;
    tags: string[];
    coverImage: string;
    featured: boolean;
    breaking: boolean;
  }>
) {
  const result = await callArticleApi('update', { slug, ...updates });
  return result;
}

export async function deleteArticleApi(slug: string) {
  const result = await callArticleApi('delete', { slug });
  return result;
}
