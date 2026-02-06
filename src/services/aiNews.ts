/**
 * Cliente para geração de notícia via Edge Function
 */

import { supabase } from '@/lib/supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ai-news`;

export type AiNewsResponse = {
  title: string;
  subtitle: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  excerpt: string;
  contentHtml: string;
  category: 'economia' | 'geopolitica' | 'tecnologia';
  author?: string;
  sources?: Array<{ title: string; url: string; source: string; publishedAt: string }>;
};

export async function generateAiNews(input: {
  topic?: string;
  category?: 'economia' | 'geopolitica' | 'tecnologia';
  questions?: string;
}): Promise<AiNewsResponse> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) throw new Error('Sessão inválida');

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'generate',
      topic: input.topic,
      category: input.category,
      questions: input.questions,
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || 'Erro ao gerar notícia');
  }

  return json.data as AiNewsResponse;
}
