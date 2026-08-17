-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tasks Table
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  description text default '',
  subtasks jsonb default '[]',
  status text check (status in ('pending', 'in_progress', 'completed')) default 'pending',
  due_date timestamptz,
  start_date timestamptz,
  all_day boolean default true,
  recurrence_rule jsonb default null,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexing for fast range queries
create index idx_tasks_user_status on public.tasks (user_id, status);
create index idx_tasks_updated_at on public.tasks (updated_at);

-- Row Level Security (RLS)
alter table public.tasks enable row level security;

create policy "Users can manage their own tasks"
  on public.tasks
  for all using (auth.uid() = user_id);

-- Trigger function to automatically update updated_at on the server
create or replace function set_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger tasks_updated_at_trigger
  before update on public.tasks
  for each row
  execute procedure set_updated_at();

-- Realtime Publication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.tasks;
