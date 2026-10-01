-- Fase 6 (IA en el bolsillo) — punto 4/5: inactividad.
--
-- Tabla nueva, sin equivalente en Dexie (mismo caso que push_subscriptions
-- en push_schema.sql): el cliente es la única fuente de "cuándo se abrió
-- la app" — no hay nada que sincronizar desde otro lado. Una fila por
-- usuario (no por dispositivo, a diferencia de push_subscriptions): lo
-- que importa acá es la última vez que ESE USUARIO estuvo activo en
-- cualquier dispositivo, no por cuál entró.
--
-- `auth.users.last_sign_in_at` no sirve para esto: solo se actualiza en
-- un login nuevo, no en cada apertura con una sesión ya persistida (el
-- caso normal de una PWA instalada) — por eso `ultima_apertura` la
-- escribe el cliente directamente, en cada resolución de sesión
-- (src/lib/actividad/registrarActividad.ts, llamado desde AuthContext).
--
-- `ultimo_aviso_inactividad` evita mandar el recordatorio de
-- 'inactividad' todos los días mientras el usuario sigue sin volver: la
-- Edge Function inactivity-check (Fase 6) solo lo actualiza ella misma
-- (con service_role), nunca el cliente.
create table if not exists actividad_usuarios (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ultima_apertura timestamptz not null default now(),
  ultimo_aviso_inactividad timestamptz,
  updated_at timestamptz not null default now()
);

alter table actividad_usuarios enable row level security;

drop policy if exists "actividad_usuarios_select_own" on actividad_usuarios;
create policy "actividad_usuarios_select_own" on actividad_usuarios
  for select using (auth.uid() = user_id);

drop policy if exists "actividad_usuarios_insert_own" on actividad_usuarios;
create policy "actividad_usuarios_insert_own" on actividad_usuarios
  for insert with check (auth.uid() = user_id);

drop policy if exists "actividad_usuarios_update_own" on actividad_usuarios;
create policy "actividad_usuarios_update_own" on actividad_usuarios
  for update using (auth.uid() = user_id);

-- Sin policy de delete: nada en la app borra esta fila (mismo criterio
-- que habit_checks/finance_income_periods sin mecanismo de borrado real).
