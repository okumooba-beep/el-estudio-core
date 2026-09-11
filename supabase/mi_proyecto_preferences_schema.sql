-- "Mi proyecto" — nombre elegido por cada usuario para su espacio genérico
-- (ej. "Omantra", "Auto"). Misma forma que room_preferences (ver
-- room_preferences_schema.sql): una fila por usuario, upsert por
-- `onConflict: 'user_id'`. Tabla propia porque es una preferencia
-- distinta a la del fondo de la habitación (mismo razonamiento pedido en
-- el sprint: no mezclar dos preferencias que cambian por motivos
-- distintos).
create table if not exists mi_proyecto_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default 'Mi proyecto',
  updated_at timestamptz not null default now()
);

alter table mi_proyecto_preferences enable row level security;

drop policy if exists "mi_proyecto_preferences_select_own" on mi_proyecto_preferences;
create policy "mi_proyecto_preferences_select_own" on mi_proyecto_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "mi_proyecto_preferences_insert_own" on mi_proyecto_preferences;
create policy "mi_proyecto_preferences_insert_own" on mi_proyecto_preferences
  for insert with check (auth.uid() = user_id);

drop policy if exists "mi_proyecto_preferences_update_own" on mi_proyecto_preferences;
create policy "mi_proyecto_preferences_update_own" on mi_proyecto_preferences
  for update using (auth.uid() = user_id);

drop policy if exists "mi_proyecto_preferences_delete_own" on mi_proyecto_preferences;
create policy "mi_proyecto_preferences_delete_own" on mi_proyecto_preferences
  for delete using (auth.uid() = user_id);
