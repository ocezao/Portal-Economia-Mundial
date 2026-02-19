/**
 * API Client for Article Management
 * Uses server-side API route to bypass RLS with Service Role Key
 */

import { supabase } from '@/lib/supabaseClient';

const API_BASE = '/api/articles/';

async function callArticleApi(action: string, payload: Record<string, unknown> = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error('Sessao invalida. Faça login novamente.');
  }

  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || 'Erro na API');
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
  const result = await callArticleApi('create', articleData);
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
