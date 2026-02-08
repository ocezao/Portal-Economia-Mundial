/**
 * Cliente para geração de notícia via Edge Function
 */

import { supabase } from '@/lib/supabaseClient';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
  const supabaseUrl = SUPABASE_URL;
  const apikey = SUPABASE_ANON_KEY;

  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada');
  if (!apikey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada');

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) throw new Error('Sessão inválida');

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-news`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey,
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
