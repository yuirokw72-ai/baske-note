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

-- ===== formations: team_id column =====
alter table formations add column if not exists team_id uuid;
-- (FK to teams added after teams table is created below)
create index if not exists idx_formations_team_id on formations(team_id);

-- ===== coach_relationships =====
create table if not exists coach_relationships (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid references auth.users(id) on delete cascade not null,
  coach_id    uuid references auth.users(id) on delete set null,
  token       text unique not null,
  status      text not null default 'pending'
                check (status in ('pending', 'accepted', 'revoked')),
  coach_name  text,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  accepted_at timestamptz
);
alter table coach_relationships enable row level security;
create index if not exists idx_cr_token     on coach_relationships(token);
create index if not exists idx_cr_player_id on coach_relationships(player_id);
create index if not exists idx_cr_coach_id  on coach_relationships(coach_id);

-- 選手が自分の関係を全管理
create policy "cr: player all" on coach_relationships
  for all using (auth.uid() = player_id) with check (auth.uid() = player_id);
-- コーチが自分の担当行を読む
create policy "cr: coach read" on coach_relationships
  for select using (auth.uid() = coach_id);
-- 未承認トークンを誰でも読める（承認画面表示用）
create policy "cr: read pending" on coach_relationships
  for select using (status = 'pending' and expires_at > now());
-- コーチがcoach_idを自分にセットして承認
create policy "cr: accept" on coach_relationships
  for update
  using  (status = 'pending' and expires_at > now() and coach_id is null)
  with check (auth.uid() = coach_id);

-- ===== teams =====
create table if not exists teams (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  created_by   uuid references auth.users(id) on delete cascade not null,
  invite_token text unique not null,
  created_at   timestamptz not null default now()
);
alter table teams enable row level security;
create index if not exists idx_teams_token      on teams(invite_token);
create index if not exists idx_teams_created_by on teams(created_by);

-- メンバーまたは作成者が読む
create policy "teams: member read" on teams
  for select using (
    auth.uid() = created_by or
    exists (select 1 from team_members where team_id = teams.id and user_id = auth.uid())
  );
-- 誰でもinvite_tokenで検索できる（参加画面用）
create policy "teams: read by token" on teams
  for select using (true);
-- 作成者のみ作成・更新・削除
create policy "teams: creator all" on teams
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- ===== team_members =====
create table if not exists team_members (
  id        uuid primary key default gen_random_uuid(),
  team_id   uuid references teams(id) on delete cascade not null,
  user_id   uuid references auth.users(id) on delete cascade not null,
  role      text not null default 'player' check (role in ('coach', 'player')),
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);
alter table team_members enable row level security;
create index if not exists idx_tm_team_id on team_members(team_id);
create index if not exists idx_tm_user_id on team_members(user_id);

-- メンバーが同チームのメンバー一覧を読む
create policy "tm: read" on team_members
  for select using (
    exists (select 1 from team_members tm2 where tm2.team_id = team_members.team_id and tm2.user_id = auth.uid())
  );
-- 自分が参加
create policy "tm: self insert" on team_members
  for insert with check (auth.uid() = user_id);
-- 自分が退会
create policy "tm: self delete" on team_members
  for delete using (auth.uid() = user_id);
-- コーチがメンバーを除名
create policy "tm: coach delete" on team_members
  for delete using (
    exists (select 1 from team_members tm2 where tm2.team_id = team_members.team_id and tm2.user_id = auth.uid() and tm2.role = 'coach')
  );

-- ===== team_shared_records =====
create table if not exists team_shared_records (
  id          uuid primary key default gen_random_uuid(),
  record_id   text not null,
  record_type text not null check (record_type in ('practice', 'game')),
  team_id     uuid references teams(id) on delete cascade not null,
  player_id   uuid references auth.users(id) on delete cascade not null,
  shared_at   timestamptz not null default now(),
  unique (record_id, record_type, team_id)
);
alter table team_shared_records enable row level security;
create index if not exists idx_tsr_team_id   on team_shared_records(team_id);
create index if not exists idx_tsr_player_id on team_shared_records(player_id);
create index if not exists idx_tsr_record_id on team_shared_records(record_id);

-- チームメンバーが共有記録メタデータを読む
create policy "tsr: team read" on team_shared_records
  for select using (
    exists (select 1 from team_members where team_id = team_shared_records.team_id and user_id = auth.uid())
  );
-- 記録オーナーが共有・共有解除
create policy "tsr: player manage" on team_shared_records
  for all using (auth.uid() = player_id) with check (auth.uid() = player_id);

-- ===== formations team FK (now that teams table exists) =====
alter table formations
  add constraint if not exists fk_formations_team
  foreign key (team_id) references teams(id) on delete cascade;

-- チームメンバーがチームフォーメーションを読む
create policy "f: team member read" on formations
  for select using (
    team_id is not null and
    exists (select 1 from team_members where team_id = formations.team_id and user_id = auth.uid())
  );
-- チームコーチが作成
create policy "f: team coach insert" on formations
  for insert with check (
    team_id is not null and
    exists (select 1 from team_members where team_id = formations.team_id and user_id = auth.uid() and role = 'coach')
  );
-- チームコーチが更新
create policy "f: team coach update" on formations
  for update using (
    team_id is not null and user_id = auth.uid() and
    exists (select 1 from team_members where team_id = formations.team_id and user_id = auth.uid() and role = 'coach')
  );
-- チームコーチが削除
create policy "f: team coach delete" on formations
  for delete using (
    team_id is not null and
    exists (select 1 from team_members where team_id = formations.team_id and user_id = auth.uid() and role = 'coach')
  );

-- ===== practice_logs: coach access policies =====
-- 個人コーチが担当選手の記録を読む
create policy "pl: personal coach read" on practice_logs for select
  using (exists (
    select 1 from coach_relationships cr
    where cr.player_id = practice_logs.user_id
      and cr.coach_id  = auth.uid()
      and cr.status    = 'accepted'
  ));
-- 個人コーチがFBを更新
create policy "pl: personal coach update" on practice_logs for update
  using (exists (
    select 1 from coach_relationships cr
    where cr.player_id = practice_logs.user_id
      and cr.coach_id  = auth.uid()
      and cr.status    = 'accepted'
  ));
-- チームメンバーが共有記録を読む
create policy "pl: team member read shared" on practice_logs for select
  using (exists (
    select 1 from team_shared_records tsr
    join team_members tm on tm.team_id = tsr.team_id
    where tsr.record_id   = practice_logs.id::text
      and tsr.record_type = 'practice'
      and tm.user_id      = auth.uid()
  ));
-- チームコーチが共有記録にFBを更新
create policy "pl: team coach update shared" on practice_logs for update
  using (exists (
    select 1 from team_shared_records tsr
    join team_members tm on tm.team_id = tsr.team_id
    where tsr.record_id   = practice_logs.id::text
      and tsr.record_type = 'practice'
      and tm.user_id      = auth.uid()
      and tm.role         = 'coach'
  ));

-- ===== game_records: coach access policies =====
create policy "gr: personal coach read" on game_records for select
  using (exists (
    select 1 from coach_relationships cr
    where cr.player_id = game_records.user_id
      and cr.coach_id  = auth.uid()
      and cr.status    = 'accepted'
  ));
create policy "gr: personal coach update" on game_records for update
  using (exists (
    select 1 from coach_relationships cr
    where cr.player_id = game_records.user_id
      and cr.coach_id  = auth.uid()
      and cr.status    = 'accepted'
  ));
create policy "gr: team member read shared" on game_records for select
  using (exists (
    select 1 from team_shared_records tsr
    join team_members tm on tm.team_id = tsr.team_id
    where tsr.record_id   = game_records.id::text
      and tsr.record_type = 'game'
      and tm.user_id      = auth.uid()
  ));
create policy "gr: team coach update shared" on game_records for update
  using (exists (
    select 1 from team_shared_records tsr
    join team_members tm on tm.team_id = tsr.team_id
    where tsr.record_id   = game_records.id::text
      and tsr.record_type = 'game'
      and tm.user_id      = auth.uid()
      and tm.role         = 'coach'
  ));
