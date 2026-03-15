-- ============================================================
-- BaskeNote / バスケノート  —  Supabase Schema
-- Run this in Supabase > SQL Editor
-- ============================================================

-- ===== practice_logs =====
create table if not exists practice_logs (
  id         uuid primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
alter table practice_logs enable row level security;
create policy "practice_logs: own rows only"
  on practice_logs for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ===== game_records =====
create table if not exists game_records (
  id         uuid primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
alter table game_records enable row level security;
create policy "game_records: own rows only"
  on game_records for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ===== goals =====
create table if not exists goals (
  id         uuid primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
alter table goals enable row level security;
create policy "goals: own rows only"
  on goals for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ===== skill_records (one row per user) =====
create table if not exists skill_records (
  user_id    uuid references auth.users(id) on delete cascade primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table skill_records enable row level security;
create policy "skill_records: own row only"
  on skill_records for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ===== formations =====
create table if not exists formations (
  id         uuid primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
alter table formations enable row level security;
create policy "formations: own rows only"
  on formations for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
