-- Fase 5 (push real) — Suscripciones Web Push.
--
-- Tabla nueva, sin equivalente en Dexie: a diferencia de Finanzas/Notas/
-- Misiones/Ideas/Hábitos/Trading/Agenda/Auditoría, esta tabla no espeja
-- una tabla local — el navegador es la única fuente de la suscripción
-- (`PushSubscription` que devuelve `pushManager.subscribe()`), y el
-- cliente la sube directo a Supabase apenas se crea. No hay necesidad de
-- cola offline (`pendingSync`) ni de motor `push/hydrate/migrate`: sin
-- conexión no se puede suscribir de entrada.
--
-- Una fila = un endpoint = una instalación de la PWA en un dispositivo
-- concreto (no una fila por usuario). Un mismo user_id puede tener varias
-- filas si tiene la PWA instalada en el celular y en otra máquina — el
-- envío de un recordatorio (Fase 2) le pega a todas las filas del
-- usuario, no a una sola.
--
-- `endpoint` es único a nivel global (no por usuario): identifica de
-- forma unívoca la suscripción del browser/dispositivo ante el push
-- service (Apple/Google/etc.), independiente de qué usuario esté
-- logueado. El upsert va por `onConflict: 'endpoint'` — si el mismo
-- dispositivo se resuscribe (o cambia de usuario logueado sin haber
-- revocado el permiso), la fila existente se actualiza en vez de
-- duplicarse.
--
-- Las claves del objeto `PushSubscription.keys` se llaman `p256dh` y
-- `auth` en la Push API — acá la segunda se guarda como `auth_key` para
-- no confundir la columna con el schema `auth` de Supabase (auth.users);
-- el mapeo de nombres lo hace el motor de sync del lado del cliente,
-- igual que `primera_senal` ↔ `primeraSeñal` en auditoria_schema.sql.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_id on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on push_subscriptions;
create policy "push_subscriptions_select_own" on push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_insert_own" on push_subscriptions;
create policy "push_subscriptions_insert_own" on push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_update_own" on push_subscriptions;
create policy "push_subscriptions_update_own" on push_subscriptions
  for update using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_delete_own" on push_subscriptions;
create policy "push_subscriptions_delete_own" on push_subscriptions
  for delete using (auth.uid() = user_id);
