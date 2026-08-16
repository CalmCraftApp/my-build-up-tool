-- 注: このアプリはログイン機能がなく auth.uid() は常にNULLのため、
-- 全テーブルRLSは有効のまま「Allow all」ポリシーで全許可にしている。
-- (disable row level security はSupabase側で自動的に再有効化されることがあるため使わない)
-- 将来ログイン機能を追加する場合は、Allow allポリシーを外して
-- auth.uid() = user_id 方式のポリシーに戻すこと。
--
-- コンソリデートされたSupabaseプロジェクトを複数アプリで共有しているため、
-- テーブル名にプレフィックスを付ける代わりに、このアプリ専用の
-- my_build_up_tool スキーマにテーブルを分離している。
-- スキーマ作成後、Supabase Dashboard の
-- Project Settings > Data API > Exposed schemas に
-- my_build_up_tool を追加しないと API から見えないので注意。

create schema if not exists my_build_up_tool;

grant usage on schema my_build_up_tool to anon, authenticated, service_role;
alter default privileges in schema my_build_up_tool
  grant all on tables to anon, authenticated, service_role;

-- daily_tasks
create table my_build_up_tool.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  date_jst date not null,
  task_text text not null,
  done boolean not null default false,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table my_build_up_tool.daily_tasks enable row level security;

create policy "Allow all"
  on my_build_up_tool.daily_tasks for all
  using (true)
  with check (true);

-- rest_days
create table my_build_up_tool.rest_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  date_jst date not null unique,
  created_at timestamptz not null default now()
);

alter table my_build_up_tool.rest_days enable row level security;

create policy "Allow all"
  on my_build_up_tool.rest_days for all
  using (true)
  with check (true);

-- work_hours
create table my_build_up_tool.work_hours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  date_jst date not null unique,
  work_hours_part integer,
  work_minutes_part integer,
  comment text,
  updated_at timestamptz not null default now()
);

alter table my_build_up_tool.work_hours enable row level security;

create policy "Allow all"
  on my_build_up_tool.work_hours for all
  using (true)
  with check (true);

-- daily_checklist
create table my_build_up_tool.daily_checklist (
  id uuid primary key default gen_random_uuid(),
  date_jst date not null,
  item_key text not null,
  checked boolean not null default false,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (date_jst, item_key)
);

alter table my_build_up_tool.daily_checklist enable row level security;

create policy "Allow all"
  on my_build_up_tool.daily_checklist for all
  using (true)
  with check (true);

-- daily_titles
create table my_build_up_tool.daily_titles (
  id uuid primary key default gen_random_uuid(),
  date_jst date not null,
  title text not null,
  created_at timestamptz default now()
);

alter table my_build_up_tool.daily_titles enable row level security;

create policy "Allow all"
  on my_build_up_tool.daily_titles for all
  using (true)
  with check (true);
