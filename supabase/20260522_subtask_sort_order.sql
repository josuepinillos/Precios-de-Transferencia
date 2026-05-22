alter table public.subtasks
add column if not exists sort_order integer;

with ordered as (
  select
    id,
    row_number() over (
      partition by task_id
      order by created_at asc, id asc
    ) as rn
  from public.subtasks
  where sort_order is null
)
update public.subtasks s
set sort_order = ordered.rn
from ordered
where s.id = ordered.id;

alter table public.subtasks
alter column sort_order set not null;

alter table public.subtasks
alter column sort_order set default 0;

create index if not exists subtasks_task_sort_order_idx
on public.subtasks(task_id, sort_order, created_at);
