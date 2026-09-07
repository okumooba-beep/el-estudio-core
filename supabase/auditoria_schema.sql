-- Fase 4 (sync Supabase) — Auditoría.
--
-- Cuatro tablas propias de Dexie (auditRupturas, auditPremortems,
-- auditCorrecciones, auditConfig — src/types/auditoria.ts), todas bajo
-- un solo motor auditoriaSync.ts y una sola fila en `syncMeta`
-- (auditoria-sync), igual que Agenda.
--
-- audit_rupturas.origen_id y audit_correcciones.bloque_creado_id
-- referencian ids de Agenda (AgendaBloque/AgendaEvento) — sin foreign
-- key, mismo motivo que en agenda_schema.sql: motores de sync
-- independientes, sin orden garantizado. Ninguna de las dos tiene
-- mecanismo de borrado real (AuditRupturaRepository y
-- AuditCorreccionRepository no exponen delete) — sin `deleted_at`.
--
-- audit_premortems SÍ tiene `deleted_at`: `AuditPremortemRepository.delete()`
-- hoy hace un `db.auditPremortems.delete(id)` real, mismo problema que
-- agendaBloques.remove() — sin tombstone nunca llega a Supabase ni a
-- otro dispositivo, así que se convierte a `deletedAt`.
--
-- audit_correcciones tiene invariante "una fila por semana" ya aplicado
-- en la app (DexieAuditCorreccionRepository verifica antes de insertar)
-- — se refuerza acá con un unique(user_id, semana_id) para que dos
-- dispositivos no puedan crear dos correcciones de la misma semana en
-- paralelo sin que el conflicto quede visible.
--
-- audit_config es fila única por usuario (Dexie usa id fijo 'config',
-- pero eso no es único entre distintos usuarios) — acá la clave real es
-- `user_id`, no `id`: el motor de sync usa upsert con
-- onConflict: 'user_id' solo para esta tabla, a diferencia de todas las
-- demás que usan onConflict: 'id'.
create table if not exists audit_rupturas (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha text not null,
  texto text not null,
  tipo text not null,
  origen_id uuid,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_audit_rupturas_user_id on audit_rupturas(user_id);

alter table audit_rupturas enable row level security;

drop policy if exists "audit_rupturas_select_own" on audit_rupturas;
create policy "audit_rupturas_select_own" on audit_rupturas
  for select using (auth.uid() = user_id);

drop policy if exists "audit_rupturas_insert_own" on audit_rupturas;
create policy "audit_rupturas_insert_own" on audit_rupturas
  for insert with check (auth.uid() = user_id);

drop policy if exists "audit_rupturas_update_own" on audit_rupturas;
create policy "audit_rupturas_update_own" on audit_rupturas
  for update using (auth.uid() = user_id);

drop policy if exists "audit_rupturas_delete_own" on audit_rupturas;
create policy "audit_rupturas_delete_own" on audit_rupturas
  for delete using (auth.uid() = user_id);

create table if not exists audit_premortems (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  semana_id text not null,
  patron text not null,
  primera_senal text not null,
  cuando text not null,
  respuesta text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists idx_audit_premortems_user_id on audit_premortems(user_id);

alter table audit_premortems enable row level security;

drop policy if exists "audit_premortems_select_own" on audit_premortems;
create policy "audit_premortems_select_own" on audit_premortems
  for select using (auth.uid() = user_id);

drop policy if exists "audit_premortems_insert_own" on audit_premortems;
create policy "audit_premortems_insert_own" on audit_premortems
  for insert with check (auth.uid() = user_id);

drop policy if exists "audit_premortems_update_own" on audit_premortems;
create policy "audit_premortems_update_own" on audit_premortems
  for update using (auth.uid() = user_id);

drop policy if exists "audit_premortems_delete_own" on audit_premortems;
create policy "audit_premortems_delete_own" on audit_premortems
  for delete using (auth.uid() = user_id);

create table if not exists audit_correcciones (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  semana_id text not null,
  promesa text not null,
  ejecutado_real text not null,
  evidencia_producida text not null,
  capa_ruptura text not null,
  aprendizaje text not null,
  correccion_unica text not null,
  donde_en_calendario text not null,
  bloque_creado_id uuid,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (user_id, semana_id)
);

create index if not exists idx_audit_correcciones_user_id on audit_correcciones(user_id);

alter table audit_correcciones enable row level security;

drop policy if exists "audit_correcciones_select_own" on audit_correcciones;
create policy "audit_correcciones_select_own" on audit_correcciones
  for select using (auth.uid() = user_id);

drop policy if exists "audit_correcciones_insert_own" on audit_correcciones;
create policy "audit_correcciones_insert_own" on audit_correcciones
  for insert with check (auth.uid() = user_id);

drop policy if exists "audit_correcciones_update_own" on audit_correcciones;
create policy "audit_correcciones_update_own" on audit_correcciones
  for update using (auth.uid() = user_id);

drop policy if exists "audit_correcciones_delete_own" on audit_correcciones;
create policy "audit_correcciones_delete_own" on audit_correcciones
  for delete using (auth.uid() = user_id);

create table if not exists audit_config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  resultado_dominante text not null,
  rutinas_reconocidas jsonb not null default '[]'::jsonb,
  senal_roja jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

alter table audit_config enable row level security;

drop policy if exists "audit_config_select_own" on audit_config;
create policy "audit_config_select_own" on audit_config
  for select using (auth.uid() = user_id);

drop policy if exists "audit_config_insert_own" on audit_config;
create policy "audit_config_insert_own" on audit_config
  for insert with check (auth.uid() = user_id);

drop policy if exists "audit_config_update_own" on audit_config;
create policy "audit_config_update_own" on audit_config
  for update using (auth.uid() = user_id);

drop policy if exists "audit_config_delete_own" on audit_config;
create policy "audit_config_delete_own" on audit_config
  for delete using (auth.uid() = user_id);
