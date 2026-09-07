-- Fase 4 (sync Supabase) — cuarto módulo: Asuntos + Biblioteca.
--
-- Mismo problema base que missions_schema.sql: ni Asuntos ni Biblioteca son
-- entidades independientes en el modelo local — son filas de la tabla Dexie
-- compartida `ideas` (src/types/idea.ts) con `destino IN ('asuntos',
-- 'biblioteca')`, la misma tabla que usan Hoy, Misiones, Hábitos, Trading,
-- Agenda y Archivo. El motor de sync (ideasSync.ts) filtra por esos dos
-- destinos explícitamente en Dexie antes de subir/bajar filas acá.
--
-- A diferencia de Misiones, acá SÍ conviene una tabla única en vez de una
-- por destino: Asuntos y Biblioteca comparten casi todo el shape de Idea
-- (texto, estado, prioridad, contraparte) sin campos propios que ameriten
-- separarlos — la columna `destino` (constrained al subset sincronizado)
-- discrimina, igual que en Dexie.
--
-- 'hoy' (Umbral + Diario) queda deliberadamente afuera de esta tabla por
-- ahora — decisión explícita del sprint: no tiene mecanismo de borrado real
-- (usa moveSheet a 'archivador', nunca remove()) y arrastra el módulo
-- Diario, que no estaba en el alcance original. Puede sumarse después con
-- su propia fila en `syncMeta` si se decide sincronizarlo.
--
-- subtareas NO viaja acá: según el comentario del propio tipo (idea.ts),
-- ese campo es exclusivo de Misiones, y ni AsuntosScreen.tsx ni
-- FrasesScreen.tsx lo usan.
--
-- fecha/hora viajan como texto (no date/time) a propósito: passthrough
-- exacto de los strings locales ("YYYY-MM-DD", "HH:MM"), sin conversión de
-- tipo ni de zona horaria.
create table if not exists ideas (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  destino text not null check (destino in ('asuntos', 'biblioteca')),
  texto text not null,
  fecha text not null,
  hora text not null,
  origen text not null,
  estado text,
  prioridad text,
  contraparte text,
  current_furniture text not null,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists idx_ideas_user_id on ideas(user_id);
create index if not exists idx_ideas_user_destino on ideas(user_id, destino);

alter table ideas enable row level security;

drop policy if exists "ideas_select_own" on ideas;
create policy "ideas_select_own" on ideas
  for select using (auth.uid() = user_id);

drop policy if exists "ideas_insert_own" on ideas;
create policy "ideas_insert_own" on ideas
  for insert with check (auth.uid() = user_id);

drop policy if exists "ideas_update_own" on ideas;
create policy "ideas_update_own" on ideas
  for update using (auth.uid() = user_id);

drop policy if exists "ideas_delete_own" on ideas;
create policy "ideas_delete_own" on ideas
  for delete using (auth.uid() = user_id);
