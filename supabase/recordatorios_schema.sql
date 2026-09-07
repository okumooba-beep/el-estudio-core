-- Fase 2 (push real) — recordatorios: una fila por cada notificación push
-- programada (Agenda la crea en una fase futura, o se crea manualmente). El
-- cron de dispatch-reminders (cada 1 min) lee las que ya vencieron y no se
-- mandaron. Mismo formato que push_schema.sql (Fase 1): create table if not
-- exists, uuid PK, RLS con drop policy if exists antes de cada create.
create table if not exists recordatorios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origen_tipo text not null check (origen_tipo in ('agenda_evento', 'agenda_bloque', 'manual')),
  origen_id uuid,
  titulo text not null,
  cuerpo text not null,
  disparar_en timestamptz not null,
  enviado boolean not null default false,
  enviado_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recordatorios_user_id_idx on recordatorios(user_id);

-- Parcial: dispatch-reminders sólo consulta enviado = false, así que el
-- índice completo sobra en tamaño una vez que la mayoría de las filas ya se
-- mandaron — esto lo mantiene chico y rápido indefinidamente.
create index if not exists recordatorios_pendientes_idx on recordatorios(disparar_en) where enviado = false;

alter table recordatorios enable row level security;

drop policy if exists "recordatorios select own" on recordatorios;
create policy "recordatorios select own" on recordatorios
  for select using (auth.uid() = user_id);

drop policy if exists "recordatorios insert own" on recordatorios;
create policy "recordatorios insert own" on recordatorios
  for insert with check (auth.uid() = user_id);

drop policy if exists "recordatorios update own" on recordatorios;
create policy "recordatorios update own" on recordatorios
  for update using (auth.uid() = user_id);

drop policy if exists "recordatorios delete own" on recordatorios;
create policy "recordatorios delete own" on recordatorios
  for delete using (auth.uid() = user_id);
