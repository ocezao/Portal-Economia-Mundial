alter table public.app_errors
  add column if not exists referrer text;

