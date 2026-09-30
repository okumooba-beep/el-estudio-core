-- Fase 6 (IA en el bolsillo) — punto 2/5: reflexión semanal con IA.
--
-- Una fila por usuario por semana calendario (lunes de esa semana, en
-- `semana_inicio`). A diferencia de `recordatorios` (Fase 2), que solo
-- dispara un push efímero, esto persiste la nota generada por la IA para
-- que el usuario la pueda releer al entrar a Misiones/Hábitos/Finanzas —
-- de ahí una columna de texto por mueble en vez de un texto único: cada
-- mueble muestra su propio párrafo, no la reflexión entera.
--
-- `metricas` guarda los números reales que la Edge Function calculó antes
-- de llamar a la API de Claude (misiones completadas, % de hábitos, gasto
-- total/por categoría vs. semana anterior) — no se vuelven a recalcular
-- para mostrar el banner, y sirve de auditoría si la nota generada suena
-- rara.
--
-- `leida_*_en` es server-side (no localStorage, a diferencia de
-- PhraseSlot.tsx) porque el usuario puede abrir la PWA en más de un
-- dispositivo (ver push_schema.sql) y el banner debe desaparecer en todos
-- una vez leído en cualquiera.
create table if not exists reflexiones_semanales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  semana_inicio date not null,
  nota_misiones text not null,
  nota_habitos text not null,
  nota_finanzas text not null,
  metricas jsonb not null default '{}'::jsonb,
  leida_misiones_en timestamptz,
  leida_habitos_en timestamptz,
  leida_finanzas_en timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, semana_inicio)
);

create index if not exists idx_reflexiones_semanales_user_id on reflexiones_semanales(user_id);

alter table reflexiones_semanales enable row level security;

drop policy if exists "reflexiones_semanales_select_own" on reflexiones_semanales;
create policy "reflexiones_semanales_select_own" on reflexiones_semanales
  for select using (auth.uid() = user_id);

-- No hay policy de insert para el usuario: la Edge Function
-- weekly-reflection escribe con la service_role key (mismo criterio que
-- dispatch-reminders), nunca el cliente.

drop policy if exists "reflexiones_semanales_update_own" on reflexiones_semanales;
create policy "reflexiones_semanales_update_own" on reflexiones_semanales
  for update using (auth.uid() = user_id);
