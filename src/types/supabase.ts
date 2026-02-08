/**
 * Tipos do Supabase para o projeto
 * Atualizado: 2025-02-08
 * 
 * Este arquivo contém os tipos das funções RPC e tabelas do Supabase
 */

// ============================================================
// PARÂMETROS E RETORNOS DAS FUNÇÕES RPC
// ============================================================

export interface UpsertArticleTagsParams {
  p_article_id: string;
  p_tag_names: string[];
}

export interface GetArticlesByCategoryParams {
  p_category_slug: string;
  p_limit?: number;
  p_offset?: number;
}

export interface GetRelatedArticlesParams {
  p_current_slug: string;
  p_category_slug: string;
  p_limit?: number;
}

export interface SearchArticlesParams {
  p_query: string;
  p_limit?: number;
}

export interface RelatedArticleResult {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string;
  author_name: string;
  published_at: string;
  reading_time: number;
  views: number;
}

export interface SearchArticleResult {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string;
  author_name: string;
  published_at: string;
  category_slug: string;
  rank: number;
}

// ============================================================
// TIPOS DE TABELAS
// ============================================================

export interface CommentRow {
  id: string;
  article_slug: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  user_id: string;
  parent_id: string | null;
  likes: number;
  created_at: string;
  updated_at: string;
}

export interface NewsArticleRow {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  excerpt: string;
  excerpt_en: string | null;
  content: string;
  content_en: string | null;
  cover_image: string;
  author_id: string | null;
  author_name: string;
  status: 'draft' | 'scheduled' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  reading_time: number;
  is_featured: boolean;
  is_breaking: boolean;
  views: number;
  likes: number;
  shares: number;
  comments_count: number;
}

// ============================================================
// DATABASE TYPES (para o cliente Supabase)
// ============================================================

export interface Database {
  public: {
    Tables: {
      comments: {
        Row: CommentRow;
        Insert: Omit<CommentRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CommentRow, 'id'>>;
      };
      news_articles: {
        Row: NewsArticleRow;
        Insert: Omit<NewsArticleRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<NewsArticleRow, 'id'>>;
      };
    };
    Functions: {
      upsert_article_tags: {
        Args: UpsertArticleTagsParams;
        Returns: void;
      };
      get_articles_by_category: {
        Args: GetArticlesByCategoryParams;
        Returns: NewsArticleRow[];
      };
      get_related_articles: {
        Args: GetRelatedArticlesParams;
        Returns: RelatedArticleResult[];
      };
      search_articles: {
        Args: SearchArticlesParams;
        Returns: SearchArticleResult[];
      };
      update_article_comments_count: {
        Args: { p_article_slug: string };
        Returns: void;
      };
      increment_article_views: {
        Args: { p_article_slug: string };
        Returns: void;
      };
      like_comment: {
        Args: { comment_id: string; user_id: string };
        Returns: void;
      };
      search_news_articles_ids: {
        Args: { q: string; lim: number };
        Returns: { id: string }[];
      };
    };
  };
}
