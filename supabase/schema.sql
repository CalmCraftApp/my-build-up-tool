-- my_build_up_tool_daily_tasks
create table my_build_up_tool_daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  date_jst date not null,
  task_text text not null,
  done boolean not null default false,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table my_build_up_tool_daily_tasks disable row level security;

create policy "Users can view own tasks"
  on my_build_up_tool_daily_tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on my_build_up_tool_daily_tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on my_build_up_tool_daily_tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on my_build_up_tool_daily_tasks for delete
  using (auth.uid() = user_id);

-- my_build_up_tool_rest_days
create table my_build_up_tool_rest_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  date_jst date not null unique,
  created_at timestamptz not null default now()
);

alter table my_build_up_tool_rest_days disable row level security;

create policy "Users can view own rest days"
  on my_build_up_tool_rest_days for select
  using (auth.uid() = user_id);

create policy "Users can insert own rest days"
  on my_build_up_tool_rest_days for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own rest days"
  on my_build_up_tool_rest_days for delete
  using (auth.uid() = user_id);

-- my_build_up_tool_work_hours
create table my_build_up_tool_work_hours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  date_jst date not null unique,
  work_hours_part integer,
  work_minutes_part integer,
  comment text,
  updated_at timestamptz not null default now()
);

alter table my_build_up_tool_work_hours disable row level security;

create policy "Users can view own work hours"
  on my_build_up_tool_work_hours for select
  using (auth.uid() = user_id);

create policy "Users can insert own work hours"
  on my_build_up_tool_work_hours for insert
  with check (auth.uid() = user_id);

create policy "Users can update own work hours"
  on my_build_up_tool_work_hours for update
  using (auth.uid() = user_id);

-- my_build_up_tool_daily_checklist
-- 注: このアプリはログイン機能がなく auth.uid() は常にNULLのため、
-- user_id / RLSは付けていない(daily_tasks等の user_id も実際は未使用)。
create table my_build_up_tool_daily_checklist (
  id uuid primary key default gen_random_uuid(),
  date_jst date not null,
  item_key text not null,
  checked boolean not null default false,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (date_jst, item_key)
);

alter table my_build_up_tool_daily_checklist disable row level security;

-- my_build_up_tool_daily_titles
create table my_build_up_tool_daily_titles (
  id uuid primary key default gen_random_uuid(),
  date_jst date not null,
  title text not null,
  created_at timestamptz default now()
);

alter table my_build_up_tool_daily_titles enable row level security;

create policy "Allow all"
  on my_build_up_tool_daily_titles for all
  using (true)
  with check (true);
