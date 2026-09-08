-- Sprint ROOM ("eliminar motor de luz + banco de fondos") — fondo de la
-- habitación elegido por cada usuario.
--
-- Igual que push_subscriptions (ver push_schema.sql), sin equivalente en
-- Dexie ni motor push/hydrate/migrate: la elección nace en el navegador,
-- ya persiste instantáneo en localStorage (src/lib/room/roomBackgrounds.ts)
-- y esto solo la refleja al resto de los dispositivos del mismo usuario.
--
-- A diferencia de push_subscriptions (una fila por dispositivo), acá es
-- una fila por usuario: el fondo es una preferencia de la persona, no del
-- dispositivo — el upsert va por `onConflict: 'user_id'`.
create table if not exists room_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  fondo_id text not null,
  updated_at timestamptz not null default now()
);

alter table room_preferences enable row level security;

drop policy if exists "room_preferences_select_own" on room_preferences;
create policy "room_preferences_select_own" on room_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "room_preferences_insert_own" on room_preferences;
create policy "room_preferences_insert_own" on room_preferences
  for insert with check (auth.uid() = user_id);

drop policy if exists "room_preferences_update_own" on room_preferences;
create policy "room_preferences_update_own" on room_preferences
  for update using (auth.uid() = user_id);

drop policy if exists "room_preferences_delete_own" on room_preferences;
create policy "room_preferences_delete_own" on room_preferences
  for delete using (auth.uid() = user_id);
