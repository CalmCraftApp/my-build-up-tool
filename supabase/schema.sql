-- daily_tasks
create table daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  date_jst date not null,
  task_text text not null,
  done boolean not null default false,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table daily_tasks enable row level security;

create policy "Users can view own tasks"
  on daily_tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on daily_tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on daily_tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on daily_tasks for delete
  using (auth.uid() = user_id);

-- rest_days
create table rest_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  date_jst date not null,
  created_at timestamptz not null default now(),
  unique (user_id, date_jst)
);

alter table rest_days enable row level security;

create policy "Users can view own rest days"
  on rest_days for select
  using (auth.uid() = user_id);

create policy "Users can insert own rest days"
  on rest_days for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own rest days"
  on rest_days for delete
  using (auth.uid() = user_id);

-- work_hours
create table work_hours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  date_jst date not null,
  work_hours_part integer,
  work_minutes_part integer,
  comment text,
  updated_at timestamptz not null default now(),
  unique (user_id, date_jst)
);

alter table work_hours enable row level security;

create policy "Users can view own work hours"
  on work_hours for select
  using (auth.uid() = user_id);

create policy "Users can insert own work hours"
  on work_hours for insert
  with check (auth.uid() = user_id);

create policy "Users can update own work hours"
  on work_hours for update
  using (auth.uid() = user_id);

-- daily_checklist
-- 注: このアプリはログイン機能がなく auth.uid() は常にNULLのため、
-- user_id / RLSは付けていない(daily_tasks等の user_id も実際は未使用)。
create table daily_checklist (
  id uuid primary key default gen_random_uuid(),
  date_jst date not null,
  item_key text not null,
  checked boolean not null default false,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (date_jst, item_key)
);
