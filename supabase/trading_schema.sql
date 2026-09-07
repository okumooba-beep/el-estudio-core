-- Fase 4 (sync Supabase) — Trading.
--
-- Tabla propia de Dexie (operaciones, src/types/operacion.ts) — una
-- Operación nunca pasa por `ideas` (Sprint 3.5, parte 1), así que a
-- diferencia de Hábitos/Agenda esta es una sincronización simple, de
-- tabla única, sin ningún destino/Idea cruzado.
--
-- `imagen` (Blob | null) queda deliberadamente afuera: el propio tipo la
-- documenta como "todo local, nunca sube a internet" (Sprint 3.5, parte
-- 5). Un Blob no viaja tal cual en un upsert JSON — el resto de los
-- campos de una Operación sincroniza normal, la captura de pantalla
-- sigue existiendo solo en el dispositivo donde se sacó.
--
-- Sin mecanismo de borrado real hoy (operacionRepository solo expone
-- list/add/update) — no hay `deleted_at` porque no hay nada que borrar
-- todavía, mismo criterio que Hábitos.
create table if not exists operaciones (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha text not null,
  hora text not null,
  instrumento text not null,
  setup text not null,
  lado text not null,
  resultado_puntos numeric not null,
  resultado_usd numeric not null,
  resumen text not null default '',
  emociones text not null default '',
  aprendizajes text not null default '',
  checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_operaciones_user_id on operaciones(user_id);

alter table operaciones enable row level security;

drop policy if exists "operaciones_select_own" on operaciones;
create policy "operaciones_select_own" on operaciones
  for select using (auth.uid() = user_id);

drop policy if exists "operaciones_insert_own" on operaciones;
create policy "operaciones_insert_own" on operaciones
  for insert with check (auth.uid() = user_id);

drop policy if exists "operaciones_update_own" on operaciones;
create policy "operaciones_update_own" on operaciones
  for update using (auth.uid() = user_id);

drop policy if exists "operaciones_delete_own" on operaciones;
create policy "operaciones_delete_own" on operaciones
  for delete using (auth.uid() = user_id);
