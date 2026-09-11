-- Sprint "Ajustes → Módulos" — qué Espacios quiere ver cada usuario en su
-- propia grilla de Espacios (Spaces.tsx). Es una preferencia distinta a
-- room_preferences (esa es estética del fondo; esta es qué accesos se
-- muestran) y a mi_proyecto_preferences (esa es el nombre de un espacio
-- puntual) — mismo motivo por el que "Mi proyecto" no reusó room_preferences:
-- cada preferencia de usuario vive en su propia tabla angosta en vez de una
-- tabla genérica de configuración.
--
-- Una fila por usuario, igual que room_preferences/mi_proyecto_preferences:
-- `ocultos` es la lista de `path` (mismo valor que Space.path en
-- spaceRegistry.ts, ej. "/notas") que ese usuario decidió ocultar de su
-- grilla. Ocultar nunca borra datos — ver App.tsx/Spaces.tsx, que solo
-- filtran la lista a mostrar.
create table if not exists module_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ocultos jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table module_preferences enable row level security;

drop policy if exists "module_preferences_select_own" on module_preferences;
create policy "module_preferences_select_own" on module_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "module_preferences_insert_own" on module_preferences;
create policy "module_preferences_insert_own" on module_preferences
  for insert with check (auth.uid() = user_id);

drop policy if exists "module_preferences_update_own" on module_preferences;
create policy "module_preferences_update_own" on module_preferences
  for update using (auth.uid() = user_id);

drop policy if exists "module_preferences_delete_own" on module_preferences;
create policy "module_preferences_delete_own" on module_preferences
  for delete using (auth.uid() = user_id);
