-- Fase 4 (sync Supabase) — Agenda.
--
-- Dos tablas propias de Dexie (agendaEventos y agendaBloques,
-- src/types/agenda.ts) — cada una con su propia fila en `syncMeta`
-- (agenda-sync cubre ambas, un solo motor agendaSync.ts, igual que
-- financeSync.ts ya cubre varias tablas de Finanzas).
--
-- agenda_eventos.idea_id referencia el `id` de la Idea (destino
-- 'agenda') de la que nació el evento — sin foreign key, mismo motivo
-- que habit_checks.habit_id: motores de sync independientes, sin orden
-- garantizado entre el push de Ideas y el de Agenda. Sin mecanismo de
-- borrado real hoy (AgendaEventoRepository solo expone list/add/update)
-- — no hay `deleted_at` en esta tabla.
--
-- agenda_bloques SÍ tiene `deleted_at`: `agendaBloqueRepository.remove()`
-- hoy hace un `db.agendaBloques.delete(id)` real (documentado como
-- intencional, para resolver un conflicto de horario) — pero un borrado
-- local sin tombstone nunca llega a Supabase ni a otro dispositivo, así
-- que este sprint convierte `remove()` a `deletedAt` (mismo patrón que
-- Asuntos/Biblioteca/Misiones). `archivado` sigue siendo el archivado
-- suave de siempre (Sprint 010) — `deleted_at` es un concepto aparte,
-- más definitivo.
create table if not exists agenda_eventos (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  texto text not null,
  fecha text not null,
  hora text,
  alarma boolean not null default false,
  completado boolean not null default false,
  prioridad text not null,
  aviso text not null,
  idea_id uuid not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_agenda_eventos_user_id on agenda_eventos(user_id);

alter table agenda_eventos enable row level security;

drop policy if exists "agenda_eventos_select_own" on agenda_eventos;
create policy "agenda_eventos_select_own" on agenda_eventos
  for select using (auth.uid() = user_id);

drop policy if exists "agenda_eventos_insert_own" on agenda_eventos;
create policy "agenda_eventos_insert_own" on agenda_eventos
  for insert with check (auth.uid() = user_id);

drop policy if exists "agenda_eventos_update_own" on agenda_eventos;
create policy "agenda_eventos_update_own" on agenda_eventos
  for update using (auth.uid() = user_id);

drop policy if exists "agenda_eventos_delete_own" on agenda_eventos;
create policy "agenda_eventos_delete_own" on agenda_eventos
  for delete using (auth.uid() = user_id);

create table if not exists agenda_bloques (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  texto text not null,
  dia text not null,
  hora text,
  alarma boolean not null default false,
  completado boolean not null default false,
  archivado boolean not null default false,
  protegido boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists idx_agenda_bloques_user_id on agenda_bloques(user_id);

alter table agenda_bloques enable row level security;

drop policy if exists "agenda_bloques_select_own" on agenda_bloques;
create policy "agenda_bloques_select_own" on agenda_bloques
  for select using (auth.uid() = user_id);

drop policy if exists "agenda_bloques_insert_own" on agenda_bloques;
create policy "agenda_bloques_insert_own" on agenda_bloques
  for insert with check (auth.uid() = user_id);

drop policy if exists "agenda_bloques_update_own" on agenda_bloques;
create policy "agenda_bloques_update_own" on agenda_bloques
  for update using (auth.uid() = user_id);

drop policy if exists "agenda_bloques_delete_own" on agenda_bloques;
create policy "agenda_bloques_delete_own" on agenda_bloques
  for delete using (auth.uid() = user_id);
