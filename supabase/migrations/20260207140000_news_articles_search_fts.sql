-- Full-text search support for news_articles
-- Adds a generated tsvector + GIN index and an RPC that returns ranked IDs.

do $$
begin
  -- Column
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'news_articles'
      and column_name = 'search_vector'
  ) then
    alter table public.news_articles
      add column search_vector tsvector
      generated always as (
        setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('portuguese', coalesce(excerpt, '')), 'B')
      ) stored;
  end if;
end $$;

-- Index
create index if not exists news_articles_search_vector_gin
  on public.news_articles using gin (search_vector);

-- RPC: ranked IDs
create or replace function public.search_news_articles_ids(q text, lim int default 30)
returns table(id uuid)
language sql
stable
as $$
  select na.id
  from public.news_articles na
  where na.status = 'published'
    and na.search_vector @@ websearch_to_tsquery('portuguese', q)
  order by ts_rank_cd(na.search_vector, websearch_to_tsquery('portuguese', q)) desc,
           na.published_at desc nulls last
  limit greatest(1, least(lim, 50));
$$;

