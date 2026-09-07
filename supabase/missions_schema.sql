-- Fase 4 (sync Supabase) — tercer módulo: Misiones.
--
-- Particularidad frente a finance_schema.sql / notes_schema.sql: una misión
-- NO es una entidad independiente en el modelo local — es una fila de la
-- tabla Dexie compartida `ideas` (src/types/idea.ts) con `destino ===
-- 'misiones'`, la misma tabla que usan Hoy, Asuntos, Hábitos, Trading,
-- Agenda, Biblioteca y Archivo. Por eso esta tabla NO espeja `ideas`
-- completa (eso sincronizaría también esos otros destinos, fuera de
-- alcance) — solo espeja las columnas relevantes para Misiones, y el motor
-- de sync (missionsSync.ts) va a filtrar `destino === 'misiones'` del lado
-- Dexie antes de subir/bajar filas acá.
--
-- fecha/hora/programada_fecha/programada_hora viajan como texto (no date/
-- time) a propósito: son passthrough exacto de los strings locales
-- ("YYYY-MM-DD", "HH:MM"), sin conversión de tipo ni de zona horaria en
-- ningún sentido.
create table if not exists missions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  texto text not null,
  fecha text not null,
  hora text not null,
  origen text not null,
  estado text,
  programada_fecha text,
  programada_hora text,
  mision_principal boolean not null default false,
  subtareas jsonb not null default '[]'::jsonb,
  current_furniture text not null,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists idx_missions_user_id on missions(user_id);

alter table missions enable row level security;

drop policy if exists "missions_select_own" on missions;
create policy "missions_select_own" on missions
  for select using (auth.uid() = user_id);

drop policy if exists "missions_insert_own" on missions;
create policy "missions_insert_own" on missions
  for insert with check (auth.uid() = user_id);

drop policy if exists "missions_update_own" on missions;
create policy "missions_update_own" on missions
  for update using (auth.uid() = user_id);

drop policy if exists "missions_delete_own" on missions;
create policy "missions_delete_own" on missions
  for delete using (auth.uid() = user_id);
