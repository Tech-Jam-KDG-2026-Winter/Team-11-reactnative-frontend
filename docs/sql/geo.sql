/*
  Supabase + PostGIS すれ違い通信（近い状態が続くなら1件にまとめる）完全SQL

  やること
  - 1分に1回: 位置情報を保存（履歴: user_location_logs、最新: user_locations_current）
  - 1分に1回: 半径250m以内のペアを検出し encounter_sessions を upsert（継続は1行更新）
  - 位置履歴は7日で削除（encounter_sessions は残す）

  注意
  - create extension が失敗する場合は、Supabase Dashboard で拡張機能を有効化してから再実行
  - cron.schedule は pg_cron が有効な場合に使えます（Supabase Cron）
*/

----------------------------------------
-- 0) Extensions
----------------------------------------
create extension if not exists postgis;
create extension if not exists pg_cron;

----------------------------------------
-- 1) Tables
----------------------------------------

-- 1-1) 位置履歴（7日で削除）
create table if not exists public.user_location_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  pos geography(point, 4326) not null,
  accuracy_m integer
);

create index if not exists user_location_logs_user_time_idx
  on public.user_location_logs (user_id, recorded_at desc);

create index if not exists user_location_logs_time_idx
  on public.user_location_logs (recorded_at);

create index if not exists user_location_logs_pos_gist
  on public.user_location_logs using gist (pos);


-- 1-2) 最新位置（近接計算の入力）
create table if not exists public.user_locations_current (
  user_id uuid primary key references auth.users(id) on delete cascade,
  recorded_at timestamptz not null,
  pos geography(point, 4326) not null,
  accuracy_m integer
);

create index if not exists user_locations_current_time_idx
  on public.user_locations_current (recorded_at desc);

create index if not exists user_locations_current_pos_gist
  on public.user_locations_current using gist (pos);


-- 1-3) すれ違いセッション（継続は1件にまとめ、履歴として残す）
create table if not exists public.encounter_sessions (
  id bigserial primary key,
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,

  started_at timestamptz not null,
  last_seen_at timestamptz not null,
  ended_at timestamptz null,

  seen_minutes integer not null default 1,

  min_distance_m numeric(8,2) not null,
  last_distance_m numeric(8,2) not null,

  last_a_recorded_at timestamptz not null,
  last_b_recorded_at timestamptz not null,

  constraint encounter_user_order_chk check (user_a < user_b)
);

-- active(ended_at is null) は同一ペアで1行だけ
create unique index if not exists encounter_sessions_active_uniq
  on public.encounter_sessions (user_a, user_b)
  where ended_at is null;

create index if not exists encounter_sessions_a_idx
  on public.encounter_sessions (user_a, last_seen_at desc);

create index if not exists encounter_sessions_b_idx
  on public.encounter_sessions (user_b, last_seen_at desc);

create index if not exists encounter_sessions_last_seen_idx
  on public.encounter_sessions (ended_at, last_seen_at desc);


----------------------------------------
-- 2) RLS + Grants
----------------------------------------

-- RLS 有効化
alter table public.user_location_logs enable row level security;
alter table public.user_locations_current enable row level security;
alter table public.encounter_sessions enable row level security;

-- 権限（RLSとは別にGRANTが必要）
grant usage on schema public to anon, authenticated;

grant select, insert on public.user_location_logs to authenticated;
grant select, insert, update on public.user_locations_current to authenticated;
grant select on public.encounter_sessions to authenticated;

-- bigserial のシーケンス権限
grant usage, select on sequence public.user_location_logs_id_seq to authenticated;
grant usage, select on sequence public.encounter_sessions_id_seq to authenticated;

-- user_location_logs: 本人だけ select/insert
drop policy if exists logs_select_own on public.user_location_logs;
create policy logs_select_own
on public.user_location_logs
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists logs_insert_own on public.user_location_logs;
create policy logs_insert_own
on public.user_location_logs
for insert
to authenticated
with check (user_id = auth.uid());

-- user_locations_current: 本人だけ select/insert/update
drop policy if exists current_select_own on public.user_locations_current;
create policy current_select_own
on public.user_locations_current
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists current_insert_own on public.user_locations_current;
create policy current_insert_own
on public.user_locations_current
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists current_update_own on public.user_locations_current;
create policy current_update_own
on public.user_locations_current
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- encounter_sessions: 当事者だけ select
drop policy if exists encounters_select_participant on public.encounter_sessions;
create policy encounters_select_participant
on public.encounter_sessions
for select
to authenticated
using (user_a = auth.uid() or user_b = auth.uid());

-- encounter_sessions はユーザーから insert/update/delete を許可しない（ポリシーを作らない）


----------------------------------------
-- 3) RPC: 位置情報の記録（履歴insert + 最新upsert）
----------------------------------------
drop function if exists public.record_location(double precision, double precision, integer, timestamptz);

create or replace function public.record_location(
  p_lat double precision,
  p_lon double precision,
  p_accuracy_m integer default null,
  p_recorded_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  g geography(point, 4326);
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  g := (st_setsrid(st_makepoint(p_lon, p_lat), 4326))::geography;

  insert into public.user_location_logs(user_id, recorded_at, pos, accuracy_m)
  values (uid, p_recorded_at, g, p_accuracy_m);

  insert into public.user_locations_current(user_id, recorded_at, pos, accuracy_m)
  values (uid, p_recorded_at, g, p_accuracy_m)
  on conflict (user_id) do update
    set recorded_at = excluded.recorded_at,
        pos = excluded.pos,
        accuracy_m = excluded.accuracy_m;
end $$;

-- クライアントから実行できるように
grant execute on function public.record_location(double precision, double precision, integer, timestamptz)
to authenticated;


----------------------------------------
-- 4) 毎分ジョブ: すれ違い検出（セッションupsert + 終了処理）
----------------------------------------
drop function if exists public.run_encounter_tick(integer, interval, interval);

create or replace function public.run_encounter_tick(
  p_radius_m integer default 250,
  p_fresh_within interval default interval '2 minutes',
  p_grace interval default interval '2 minutes'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 多重実行防止（念のため）
  if not pg_try_advisory_lock(987654321) then
    return;
  end if;

  -- 近接ペア抽出（最新位置のみ）
  with pairs as (
    select
      a.user_id as user_a,
      b.user_id as user_b,
      now() as seen_at,
      a.recorded_at as a_recorded_at,
      b.recorded_at as b_recorded_at,
      round(st_distance(a.pos, b.pos)::numeric, 2) as distance_m
    from public.user_locations_current a
    join public.user_locations_current b
      on a.user_id < b.user_id
     and st_dwithin(a.pos, b.pos, p_radius_m)
    where a.recorded_at >= now() - p_fresh_within
      and b.recorded_at >= now() - p_fresh_within
  )
  insert into public.encounter_sessions (
    user_a, user_b,
    started_at, last_seen_at, ended_at,
    seen_minutes,
    min_distance_m, last_distance_m,
    last_a_recorded_at, last_b_recorded_at
  )
  select
    user_a, user_b,
    seen_at, seen_at, null,
    1,
    distance_m, distance_m,
    a_recorded_at, b_recorded_at
  from pairs
  on conflict (user_a, user_b) where ended_at is null
  do update set
    last_seen_at = excluded.last_seen_at,
    seen_minutes = encounter_sessions.seen_minutes + 1,
    last_distance_m = excluded.last_distance_m,
    min_distance_m = least(encounter_sessions.min_distance_m, excluded.last_distance_m),
    last_a_recorded_at = excluded.last_a_recorded_at,
    last_b_recorded_at = excluded.last_b_recorded_at;

  -- 一定時間検出されなかった active セッションを終了
  update public.encounter_sessions
    set ended_at = last_seen_at
  where ended_at is null
    and last_seen_at < now() - p_grace;

  perform pg_advisory_unlock(987654321);
end $$;

-- クライアントからは実行させない
revoke execute on function public.run_encounter_tick(integer, interval, interval)
from public, anon, authenticated;


----------------------------------------
-- 5) 位置履歴の7日削除（encounter_sessionsは削除しない）
----------------------------------------
drop function if exists public.prune_location_logs(interval);

create or replace function public.prune_location_logs(
  p_keep interval default interval '7 days'
)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.user_location_logs
  where recorded_at < now() - p_keep;
$$;

revoke execute on function public.prune_location_logs(interval)
from public, anon, authenticated;


----------------------------------------
-- 6) Cron スケジュール（毎分tick / 毎日削除）
----------------------------------------
-- 既存があれば削除して作り直し
select cron.unschedule('encounter_tick_every_minute')
where exists (select 1 from cron.job where jobname = 'encounter_tick_every_minute');

select cron.unschedule('prune_location_logs_daily')
where exists (select 1 from cron.job where jobname = 'prune_location_logs_daily');

-- 毎分: 近接検出（半径250m、最新2分、終了猶予2分）
select cron.schedule(
  'encounter_tick_every_minute',
  '* * * * *',
  $$select public.run_encounter_tick(250, interval '2 minutes', interval '2 minutes');$$
);

-- 毎日: 位置履歴を7日より古いものを削除（例: 03:10）
select cron.schedule(
  'prune_location_logs_daily',
  '10 3 * * *',
  $$select public.prune_location_logs(interval '7 days');$$
);


----------------------------------------
-- 7) 便利: 自分のすれ違い一覧ビュー（任意）
----------------------------------------
drop view if exists public.my_encounters;

create view public.my_encounters as
select
  es.id,
  case when es.user_a = auth.uid() then es.user_b else es.user_a end as other_user_id,
  es.started_at,
  es.last_seen_at,
  es.ended_at,
  es.seen_minutes,
  es.min_distance_m,
  es.last_distance_m
from public.encounter_sessions es
where es.user_a = auth.uid() or es.user_b = auth.uid();

grant select on public.my_encounters to authenticated;
