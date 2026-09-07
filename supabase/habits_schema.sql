-- Fase 4 (sync Supabase) — Hábitos.
--
-- Tabla propia de Dexie (habitChecks, src/types/habitCheck.ts): un
-- registro por hábito+fecha, solo el circulito marcado/desmarcado — la
-- definición del hábito (el nombre) vive en `db.ideas` con
-- `destino = 'habitos'` y sincroniza aparte, vía ideasSync.ts ampliado
-- (ver ideas_add_habitos_agenda.sql). `habit_id` referencia el `id` de
-- esa Idea pero sin foreign key: los dos motores de sync corren
-- independientes y no hay garantía de orden entre uno y otro en cada
-- push, así que una FK acá podría rechazar un check válido que llegó
-- antes que su hábito.
--
-- Sin mecanismo de borrado real hoy (setChecked solo hace upsert por
-- habitId+fecha, nunca delete) — mismo caso que 'hoy': no hay
-- `deleted_at` porque no hay nada que borrar todavía.
--
-- fecha viaja como texto ("YYYY-MM-DD"), mismo criterio que el resto de
-- los esquemas: passthrough exacto del string local, sin conversión de
-- tipo ni de zona horaria.
create table if not exists habit_checks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null,
  fecha text not null,
  checked boolean not null,
  updated_at timestamptz not null
);

create index if not exists idx_habit_checks_user_id on habit_checks(user_id);
create index if not exists idx_habit_checks_user_habit on habit_checks(user_id, habit_id);

alter table habit_checks enable row level security;

drop policy if exists "habit_checks_select_own" on habit_checks;
create policy "habit_checks_select_own" on habit_checks
  for select using (auth.uid() = user_id);

drop policy if exists "habit_checks_insert_own" on habit_checks;
create policy "habit_checks_insert_own" on habit_checks
  for insert with check (auth.uid() = user_id);

drop policy if exists "habit_checks_update_own" on habit_checks;
create policy "habit_checks_update_own" on habit_checks
  for update using (auth.uid() = user_id);

drop policy if exists "habit_checks_delete_own" on habit_checks;
create policy "habit_checks_delete_own" on habit_checks
  for delete using (auth.uid() = user_id);
