create table if not exists public.translation_cache (
  cache_key text primary key,
  source_language text not null,
  target_language text not null,
  source_text text not null,
  translated_text text not null,
  context text not null default 'website',
  created_at timestamptz not null default now()
);

create index if not exists translation_cache_lookup
  on public.translation_cache (source_language, target_language, context);

alter table public.translation_cache enable row level security;
