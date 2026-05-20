create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assignee jsonb not null,
  due_date date not null,
  date_block date not null,
  empresa text not null default 'Empresa A',
  prioridad text not null default 'Media' check (prioridad in ('Alta', 'Media', 'Baja')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  assignee jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_emails (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  subject text not null,
  sender text not null default 'Sin remitente',
  email_date timestamptz not null,
  status text not null check (status in ('Enviado', 'Recibido')),
  outlook_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.controlled_operations (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  section text not null,
  operation_number text,
  related_party text,
  transaction_description text,
  transaction_code text,
  transaction_type text,
  currency text,
  amount_origin numeric,
  amount_pen numeric,
  created_at timestamptz not null default now()
);

create index if not exists client_emails_task_id_idx
on public.client_emails(task_id);

create index if not exists controlled_operations_task_id_idx
on public.controlled_operations(task_id);

create index if not exists controlled_operations_task_section_idx
on public.controlled_operations(task_id, section);

alter table if exists public.subtasks
add column if not exists assignee jsonb;

update public.subtasks subtask
set assignee = task.assignee
from public.tasks task
where subtask.task_id = task.id
  and subtask.assignee is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

drop trigger if exists set_subtasks_updated_at on public.subtasks;
create trigger set_subtasks_updated_at
before update on public.subtasks
for each row
execute function public.set_updated_at();

drop trigger if exists set_client_emails_updated_at on public.client_emails;
create trigger set_client_emails_updated_at
before update on public.client_emails
for each row
execute function public.set_updated_at();

alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.client_emails enable row level security;
alter table public.controlled_operations enable row level security;

alter table public.tasks replica identity full;
alter table public.subtasks replica identity full;
alter table public.client_emails replica identity full;
alter table public.controlled_operations replica identity full;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.tasks to anon, authenticated;
grant select, insert, update, delete on table public.subtasks to anon, authenticated;
grant select, insert, update, delete on table public.client_emails to anon, authenticated;
grant select, insert, update, delete on table public.controlled_operations to anon, authenticated;

drop policy if exists "Allow public task reads" on public.tasks;
create policy "Allow public task reads"
on public.tasks for select
to anon, authenticated
using (true);

drop policy if exists "Allow public task inserts" on public.tasks;
create policy "Allow public task inserts"
on public.tasks for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow public task updates" on public.tasks;
create policy "Allow public task updates"
on public.tasks for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow public task deletes" on public.tasks;
create policy "Allow public task deletes"
on public.tasks for delete
to anon, authenticated
using (true);

drop policy if exists "Allow public subtask reads" on public.subtasks;
create policy "Allow public subtask reads"
on public.subtasks for select
to anon, authenticated
using (true);

drop policy if exists "Allow public subtask inserts" on public.subtasks;
create policy "Allow public subtask inserts"
on public.subtasks for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow public subtask updates" on public.subtasks;
create policy "Allow public subtask updates"
on public.subtasks for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow public subtask deletes" on public.subtasks;
create policy "Allow public subtask deletes"
on public.subtasks for delete
to anon, authenticated
using (true);

drop policy if exists "Allow public client email reads" on public.client_emails;
create policy "Allow public client email reads"
on public.client_emails for select
to anon, authenticated
using (true);

drop policy if exists "Allow public client email inserts" on public.client_emails;
create policy "Allow public client email inserts"
on public.client_emails for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow public client email updates" on public.client_emails;
create policy "Allow public client email updates"
on public.client_emails for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow public client email deletes" on public.client_emails;
create policy "Allow public client email deletes"
on public.client_emails for delete
to anon, authenticated
using (true);

drop policy if exists "Allow public controlled operation reads" on public.controlled_operations;
create policy "Allow public controlled operation reads"
on public.controlled_operations for select
to anon, authenticated
using (true);

drop policy if exists "Allow public controlled operation inserts" on public.controlled_operations;
create policy "Allow public controlled operation inserts"
on public.controlled_operations for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow public controlled operation updates" on public.controlled_operations;
create policy "Allow public controlled operation updates"
on public.controlled_operations for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow public controlled operation deletes" on public.controlled_operations;
create policy "Allow public controlled operation deletes"
on public.controlled_operations for delete
to anon, authenticated
using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'subtasks'
  ) then
    alter publication supabase_realtime add table public.subtasks;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'client_emails'
  ) then
    alter publication supabase_realtime add table public.client_emails;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'controlled_operations'
  ) then
    alter publication supabase_realtime add table public.controlled_operations;
  end if;
end;
$$;
