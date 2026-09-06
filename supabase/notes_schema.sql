-- Fase 4 — Notas como segundo módulo de sync (El Estudio Core)
--
-- Ejecutar manualmente en el SQL Editor de Supabase (o vía `supabase db push`
-- si el proyecto está linkeado localmente). Este repo no tiene credenciales ni
-- CLI de Supabase conectados, así que este archivo no se aplica solo.
--
-- Columnas y tipos calcados de los mappers en src/lib/sync/notesSync.ts
-- (FolderRow, NoteRow) — cualquier cambio ahí debe reflejarse acá.
--
-- `deleted_at` existe en las dos tablas (a diferencia de finance_accounts /
-- finance_goals en finance_schema.sql, que no lo tienen porque no son
-- borrables desde la UI): tanto carpetas como notas sí se pueden borrar, y
-- necesitan tombstone para que ese borrado se propague al resto de
-- dispositivos — mismo patrón que finance_movimientos / finance_income_periods.

create table if not exists notes_folders (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  pin_hash text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists notes_notes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid not null,
  titulo text not null,
  contenido text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists notes_folders_user_id_idx on notes_folders(user_id);
create index if not exists notes_notes_user_id_idx on notes_notes(user_id);

alter table notes_folders enable row level security;
alter table notes_notes enable row level security;

drop policy if exists "select own notes folders" on notes_folders;
drop policy if exists "insert own notes folders" on notes_folders;
drop policy if exists "update own notes folders" on notes_folders;
drop policy if exists "delete own notes folders" on notes_folders;
create policy "select own notes folders" on notes_folders for select using (auth.uid() = user_id);
create policy "insert own notes folders" on notes_folders for insert with check (auth.uid() = user_id);
create policy "update own notes folders" on notes_folders for update using (auth.uid() = user_id);
create policy "delete own notes folders" on notes_folders for delete using (auth.uid() = user_id);

drop policy if exists "select own notes" on notes_notes;
drop policy if exists "insert own notes" on notes_notes;
drop policy if exists "update own notes" on notes_notes;
drop policy if exists "delete own notes" on notes_notes;
create policy "select own notes" on notes_notes for select using (auth.uid() = user_id);
create policy "insert own notes" on notes_notes for insert with check (auth.uid() = user_id);
create policy "update own notes" on notes_notes for update using (auth.uid() = user_id);
create policy "delete own notes" on notes_notes for delete using (auth.uid() = user_id);
