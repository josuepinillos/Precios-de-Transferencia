create table if not exists public.sunat_due_dates (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  ruc text not null check (ruc ~ '^[0-9]{11}$'),
  condition text not null default 'general' check (condition in ('general', 'good_taxpayer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_id)
);

create index if not exists sunat_due_dates_task_id_idx
on public.sunat_due_dates(task_id);

create index if not exists sunat_due_dates_ruc_idx
on public.sunat_due_dates(ruc);

drop trigger if exists set_sunat_due_dates_updated_at on public.sunat_due_dates;
create trigger set_sunat_due_dates_updated_at
before update on public.sunat_due_dates
for each row
execute function public.set_updated_at();

alter table public.sunat_due_dates enable row level security;
alter table public.sunat_due_dates replica identity full;

grant select, insert, update on table public.sunat_due_dates to anon, authenticated;

drop policy if exists "Allow public sunat due date reads" on public.sunat_due_dates;
create policy "Allow public sunat due date reads"
on public.sunat_due_dates for select
to anon, authenticated
using (true);

drop policy if exists "Allow public sunat due date inserts" on public.sunat_due_dates;
create policy "Allow public sunat due date inserts"
on public.sunat_due_dates for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow public sunat due date updates" on public.sunat_due_dates;
create policy "Allow public sunat due date updates"
on public.sunat_due_dates for update
to anon, authenticated
using (true)
with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sunat_due_dates'
  ) then
    alter publication supabase_realtime add table public.sunat_due_dates;
  end if;
end;
$$;
