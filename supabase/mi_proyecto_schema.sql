-- "Mi proyecto" — espacio genérico reutilizable (carpetas + notas), mismo
-- motor que Notas (ver src/components/notes-engine/) sobre un par de
-- tablas propio, para que los dos espacios nunca compartan datos.
--
-- Ejecutar manualmente en el SQL Editor de Supabase (o vía `supabase db push`
-- si el proyecto está linkeado localmente). Este repo no tiene credenciales ni
-- CLI de Supabase conectados, así que este archivo no se aplica solo.
--
-- Columnas y tipos calcados de los mappers en src/lib/sync/miProyectoSync.ts
-- (FolderRow, NoteRow) — mismo esquema que notes_folders/notes_notes (ver
-- notes_schema.sql), solo cambia el nombre de tabla.

create table if not exists mi_proyecto_folders (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  pin_hash text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists mi_proyecto_notes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid not null,
  titulo text not null,
  contenido text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists mi_proyecto_folders_user_id_idx on mi_proyecto_folders(user_id);
create index if not exists mi_proyecto_notes_user_id_idx on mi_proyecto_notes(user_id);

alter table mi_proyecto_folders enable row level security;
alter table mi_proyecto_notes enable row level security;

drop policy if exists "select own mi_proyecto folders" on mi_proyecto_folders;
drop policy if exists "insert own mi_proyecto folders" on mi_proyecto_folders;
drop policy if exists "update own mi_proyecto folders" on mi_proyecto_folders;
drop policy if exists "delete own mi_proyecto folders" on mi_proyecto_folders;
create policy "select own mi_proyecto folders" on mi_proyecto_folders for select using (auth.uid() = user_id);
create policy "insert own mi_proyecto folders" on mi_proyecto_folders for insert with check (auth.uid() = user_id);
create policy "update own mi_proyecto folders" on mi_proyecto_folders for update using (auth.uid() = user_id);
create policy "delete own mi_proyecto folders" on mi_proyecto_folders for delete using (auth.uid() = user_id);

drop policy if exists "select own mi_proyecto notes" on mi_proyecto_notes;
drop policy if exists "insert own mi_proyecto notes" on mi_proyecto_notes;
drop policy if exists "update own mi_proyecto notes" on mi_proyecto_notes;
drop policy if exists "delete own mi_proyecto notes" on mi_proyecto_notes;
create policy "select own mi_proyecto notes" on mi_proyecto_notes for select using (auth.uid() = user_id);
create policy "insert own mi_proyecto notes" on mi_proyecto_notes for insert with check (auth.uid() = user_id);
create policy "update own mi_proyecto notes" on mi_proyecto_notes for update using (auth.uid() = user_id);
create policy "delete own mi_proyecto notes" on mi_proyecto_notes for delete using (auth.uid() = user_id);
