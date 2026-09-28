-- Jalankan sekali di Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username varchar(24) not null unique,
  email text unique,
  password_hash text not null,
  avatar_url text,
  bio text,
  xp integer not null default 0,
  rank text not null default 'Pendatang',
  banned boolean not null default false,
  created_at timestamptz not null default now()
);


create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  comic_id text not null,
  user_id uuid not null references public.users(id) on delete cascade,
  username varchar(24) not null,
  text varchar(500) not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_comic_created_idx on public.comments(comic_id, created_at desc);
create index if not exists comments_user_idx on public.comments(user_id);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  comic_id text not null,
  user_id uuid not null references public.users(id) on delete cascade,
  vote_type text not null check (vote_type in ('up','middle','down')),
  created_at timestamptz not null default now(),
  unique(comic_id, user_id)
);
create index if not exists votes_comic_idx on public.votes(comic_id);
create index if not exists votes_user_idx on public.votes(user_id);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  comic_id text not null,
  title text,
  cover text,
  type text,
  status text,
  created_at timestamptz not null default now(),
  unique(user_id, comic_id)
);

create table if not exists public.history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  comic_id text not null,
  comic_title text,
  cover text,
  chapter_id text,
  chapter_number text,
  chapters jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id, comic_id)
);

-- API memakai service-role key di server Vercel.
-- Jangan pernah menaruh SUPABASE_SERVICE_ROLE_KEY di Expo/client.
alter table public.users enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.history enable row level security;
