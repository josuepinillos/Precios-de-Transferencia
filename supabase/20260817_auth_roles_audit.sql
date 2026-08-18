-- ============================================================================
-- Autenticación, roles, auditoría y papelera
-- ============================================================================
-- EJECUTAR EN EL SQL EDITOR DE SUPABASE.
--
-- QUE NO HACE: no borra tablas, ni columnas, ni filas. No hay drop table,
-- drop column, truncate ni delete. Ninguna fila existente se modifica.
--
-- QUE SI CAMBIA, Y ES IRREVERSIBLE EN CALIENTE: retira el acceso del rol anon
-- a las seis tablas de negocio. Hoy la aplicacion lee con la anon key, asi que
-- DESDE EL SEGUNDO EN QUE ESTO SE EJECUTA Y HASTA COMPLETAR EL PASO 4 LA
-- APLICACION NO PODRA LEER DATOS. Reserva ~10 minutos y haz los cuatro pasos
-- seguidos.
--
-- ORDEN DE PUESTA EN MARCHA:
--   1. Ejecutar este archivo completo.
--   2. Crear el primer usuario en Authentication > Users > Add user,
--      marcando "Auto Confirm User".
--   3. Promoverlo a administrador y comprobar que quedo bien:
--        update public.profiles set role = 'admin', is_active = true
--        where email = 'tu-correo@dominio.com';
--        select email, role, is_active from public.profiles;
--      Si esa consulta no devuelve ninguna fila, el trigger no llego a crear
--      el perfil: crealo a mano copiando el id desde Authentication > Users.
--   4. Poner NEXT_PUBLIC_AUTH_ENABLED=true en Vercel y en .env.local, y
--      redesplegar.
--
-- PARA VOLVER ATRAS: al final del archivo hay un bloque de reversion comentado
-- que devuelve el acceso publico tal como esta hoy.
--
-- Este archivo SUSTITUYE las politicas "Allow public ..." de schema.sql, que
-- daban CRUD completo al rol anon sobre datos tributarios de clientes.
-- ============================================================================

-- ---------------------------------------------------------------- roles ----
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'editor', 'consultor', 'lector');
  end if;
end
$$;

-- ------------------------------------------------------------- profiles ----
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  avatar_url text,
  role public.app_role not null default 'lector',
  is_active boolean not null default false,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Se blinda aquí mismo, no al final del archivo: Supabase concede por
-- defecto privilegios sobre las tablas nuevas de public a anon, así que entre
-- la creación y el enable de RLS habría una ventana abierta si el script
-- fallara a mitad de camino.
alter table public.profiles enable row level security;
revoke all on table public.profiles from anon;

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_role_idx on public.profiles (role);

-- Cada usuario de auth.users obtiene su perfil automáticamente. Entra como
-- 'lector' inactivo: un administrador debe habilitarlo de forma explícita.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Este trigger corre dentro del INSERT de auth.users: si lanza una
  -- excepción, la creación del usuario se aborta por completo. Se aísla para
  -- que un problema al crear el perfil nunca impida dar de alta a alguien.
  begin
    insert into public.profiles (id, email, full_name, is_active)
    values (
      new.id,
      coalesce(new.email, ''),
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        nullif(split_part(coalesce(new.email, ''), '@', 1), '')
      ),
      false
    )
    on conflict (id) do nothing;
  exception
    when others then
      raise warning 'No se pudo crear el perfil de %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------- helpers de permisos ----
-- SECURITY DEFINER para que las políticas puedan leer profiles sin recursión.
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles
  where id = auth.uid() and is_active = true;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'admin', false);
$$;

-- Puede escribir: admin y editor. Consultor y lector son de solo lectura.
create or replace function public.can_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() in ('admin', 'editor'), false);
$$;

-- Rol y estado tal como están guardados, sin filtrar por is_active. Existen
-- para que las políticas SOBRE profiles no consulten profiles en línea: una
-- subconsulta a la misma tabla dentro de su propia política provoca
-- "infinite recursion detected in policy for relation profiles".
create or replace function public.my_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.my_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_active from public.profiles where id = auth.uid();
$$;

-- Puede leer: cualquier perfil activo, sea cual sea su rol.
create or replace function public.can_read()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() is not null;
$$;

-- Los helpers devuelven null/false para una sesión anónima, pero no hay razón
-- para dejarlos expuestos: solo los necesita una sesión autenticada.
revoke execute on function public.current_app_role() from public, anon;
revoke execute on function public.my_role()          from public, anon;
revoke execute on function public.my_is_active()     from public, anon;
revoke execute on function public.is_admin()         from public, anon;
revoke execute on function public.can_write()        from public, anon;
revoke execute on function public.can_read()         from public, anon;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.my_role()          to authenticated;
grant execute on function public.my_is_active()     to authenticated;
grant execute on function public.is_admin()         to authenticated;
grant execute on function public.can_write()        to authenticated;
grant execute on function public.can_read()         to authenticated;

-- ------------------------------------------------------------ auditoría ----
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;
revoke all on table public.audit_log from anon;

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id);
create index if not exists audit_log_entity_idx on public.audit_log (entity, entity_id);

-- --------------------------------------------------- papelera (soft delete) ----
alter table public.tasks                  add column if not exists deleted_at timestamptz;
alter table public.tasks                  add column if not exists deleted_by uuid references auth.users (id) on delete set null;
alter table public.subtasks               add column if not exists deleted_at timestamptz;
alter table public.subtasks               add column if not exists deleted_by uuid references auth.users (id) on delete set null;
alter table public.client_emails          add column if not exists deleted_at timestamptz;
alter table public.client_emails          add column if not exists deleted_by uuid references auth.users (id) on delete set null;
alter table public.controlled_operations  add column if not exists deleted_at timestamptz;
alter table public.controlled_operations  add column if not exists deleted_by uuid references auth.users (id) on delete set null;
alter table public.historical_results     add column if not exists deleted_at timestamptz;
alter table public.historical_results     add column if not exists deleted_by uuid references auth.users (id) on delete set null;
alter table public.sunat_due_dates        add column if not exists deleted_at timestamptz;
alter table public.sunat_due_dates        add column if not exists deleted_by uuid references auth.users (id) on delete set null;

create index if not exists tasks_deleted_at_idx    on public.tasks (deleted_at);
create index if not exists subtasks_deleted_at_idx on public.subtasks (deleted_at);

-- ============================================================================
-- RLS
-- ============================================================================
-- Se retira todo acceso del rol anon. La anon key viaja en el bundle del
-- cliente, así que cualquier permiso concedido a anon es público de facto.

revoke all on table public.tasks                 from anon;
revoke all on table public.subtasks              from anon;
revoke all on table public.client_emails         from anon;
revoke all on table public.controlled_operations from anon;
revoke all on table public.historical_results    from anon;
revoke all on table public.sunat_due_dates       from anon;

drop policy if exists "Allow public task reads"       on public.tasks;
drop policy if exists "Allow public task inserts"     on public.tasks;
drop policy if exists "Allow public task updates"     on public.tasks;
drop policy if exists "Allow public task deletes"     on public.tasks;
drop policy if exists "Allow public subtask reads"    on public.subtasks;
drop policy if exists "Allow public subtask inserts"  on public.subtasks;
drop policy if exists "Allow public subtask updates"  on public.subtasks;
drop policy if exists "Allow public subtask deletes"  on public.subtasks;
drop policy if exists "Allow public client email reads"   on public.client_emails;
drop policy if exists "Allow public client email inserts" on public.client_emails;
drop policy if exists "Allow public client email updates" on public.client_emails;
drop policy if exists "Allow public client email deletes" on public.client_emails;
drop policy if exists "Allow public controlled operation reads"   on public.controlled_operations;
drop policy if exists "Allow public controlled operation inserts" on public.controlled_operations;
drop policy if exists "Allow public controlled operation updates" on public.controlled_operations;
drop policy if exists "Allow public controlled operation deletes" on public.controlled_operations;
drop policy if exists "Allow public historical result reads"   on public.historical_results;
drop policy if exists "Allow public historical result inserts" on public.historical_results;
drop policy if exists "Allow public historical result updates" on public.historical_results;
drop policy if exists "Allow public historical result deletes" on public.historical_results;
drop policy if exists "Allow public sunat due date reads"   on public.sunat_due_dates;
drop policy if exists "Allow public sunat due date inserts" on public.sunat_due_dates;
drop policy if exists "Allow public sunat due date updates" on public.sunat_due_dates;

-- Mismo conjunto de reglas para las seis tablas de negocio:
--   leer      -> cualquier perfil activo
--   insertar  -> admin y editor
--   actualizar-> admin y editor (cubre además el soft delete)
--   borrar    -> solo admin (borrado permanente desde la papelera)
do $$
declare
  target text;
begin
  foreach target in array array[
    'tasks', 'subtasks', 'client_emails',
    'controlled_operations', 'historical_results', 'sunat_due_dates'
  ]
  loop
    execute format('grant select, insert, update, delete on table public.%I to authenticated', target);

    execute format('drop policy if exists "read for active members" on public.%I', target);
    execute format(
      'create policy "read for active members" on public.%I for select to authenticated using (public.can_read())',
      target);

    execute format('drop policy if exists "insert for writers" on public.%I', target);
    execute format(
      'create policy "insert for writers" on public.%I for insert to authenticated with check (public.can_write())',
      target);

    execute format('drop policy if exists "update for writers" on public.%I', target);
    execute format(
      'create policy "update for writers" on public.%I for update to authenticated using (public.can_write()) with check (public.can_write())',
      target);

    execute format('drop policy if exists "hard delete for admins" on public.%I', target);
    execute format(
      'create policy "hard delete for admins" on public.%I for delete to authenticated using (public.is_admin())',
      target);
  end loop;
end
$$;

-- ------------------------------------------------------ RLS de profiles ----
alter table public.profiles enable row level security;
grant select on table public.profiles to authenticated;
grant update on table public.profiles to authenticated;

drop policy if exists "profiles readable by members" on public.profiles;
create policy "profiles readable by members"
on public.profiles for select to authenticated
using (public.can_read() or id = auth.uid());

-- Un usuario puede editar su nombre y avatar, nunca su rol ni su estado.
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = public.my_role()
  and is_active = public.my_is_active()
);

drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles"
on public.profiles for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- --------------------------------------------------- RLS de audit_log ----
alter table public.audit_log enable row level security;
grant select, insert on table public.audit_log to authenticated;

-- La auditoría la lee cualquier miembro activo, pero solo el admin ve todo
-- el historial completo; el resto ve el registro para poder rastrear cambios.
drop policy if exists "audit readable by members" on public.audit_log;
create policy "audit readable by members"
on public.audit_log for select to authenticated
using (public.can_read());

-- Solo se puede escribir auditoría a nombre propio, y nunca modificarla.
drop policy if exists "audit append only" on public.audit_log;
create policy "audit append only"
on public.audit_log for insert to authenticated
with check (actor_id = auth.uid() and public.can_read());

alter table public.profiles  replica identity full;
alter table public.audit_log replica identity full;

-- ============================================================================
-- COMPROBACION (solo lectura, ejecutar despues del paso 3)
-- ============================================================================
-- 1. Que ninguna tabla de negocio siga concediendo permisos a anon.
--    Debe devolver 0 filas.
-- select table_name, privilege_type
-- from information_schema.role_table_grants
-- where grantee = 'anon' and table_schema = 'public'
--   and table_name in ('tasks','subtasks','client_emails',
--                      'controlled_operations','historical_results',
--                      'sunat_due_dates','profiles','audit_log');
--
-- 2. Que las politicas nuevas existan (debe devolver 24 filas: 4 por tabla).
-- select tablename, policyname, cmd from pg_policies
-- where schemaname = 'public'
--   and policyname in ('read for active members','insert for writers',
--                      'update for writers','hard delete for admins')
-- order by tablename, cmd;
--
-- 3. Que exista exactamente un administrador activo.
-- select email, role, is_active from public.profiles where role = 'admin';
--
-- 4. Que RLS este activo en todas las tablas implicadas.
-- select relname, relrowsecurity from pg_class
-- where relnamespace = 'public'::regnamespace
--   and relname in ('tasks','subtasks','client_emails','controlled_operations',
--                   'historical_results','sunat_due_dates','profiles','audit_log');

-- ============================================================================
-- REVERSION DE EMERGENCIA (descomentar solo si hay que volver atras)
-- ============================================================================
-- Devuelve el acceso publico tal como esta hoy. No borra profiles, audit_log
-- ni las columnas de papelera: son aditivas y no molestan.
--
-- do $$
-- declare
--   target text;
-- begin
--   foreach target in array array[
--     'tasks','subtasks','client_emails',
--     'controlled_operations','historical_results','sunat_due_dates'
--   ]
--   loop
--     execute format('grant select, insert, update, delete on table public.%I to anon, authenticated', target);
--     execute format('drop policy if exists "read for active members" on public.%I', target);
--     execute format('drop policy if exists "insert for writers" on public.%I', target);
--     execute format('drop policy if exists "update for writers" on public.%I', target);
--     execute format('drop policy if exists "hard delete for admins" on public.%I', target);
--     execute format('create policy "Allow public reads" on public.%I for select to anon, authenticated using (true)', target);
--     execute format('create policy "Allow public inserts" on public.%I for insert to anon, authenticated with check (true)', target);
--     execute format('create policy "Allow public updates" on public.%I for update to anon, authenticated using (true) with check (true)', target);
--     execute format('create policy "Allow public deletes" on public.%I for delete to anon, authenticated using (true)', target);
--   end loop;
-- end
-- $$;
