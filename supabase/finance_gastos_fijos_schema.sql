-- "Gastos fijos mensuales" — exclusivo de Finanzas general (El Estudio Core)
--
-- Ejecutar manualmente en el SQL Editor de Supabase (o vía `supabase db push`
-- si el proyecto está linkeado localmente). Este repo no tiene credenciales ni
-- CLI de Supabase conectados, así que este archivo no se aplica solo.
--
-- Columnas y tipos calcados del mapper en src/lib/sync/financeSync.ts
-- (GastoFijoRow) — cualquier cambio ahí debe reflejarse acá. Sin
-- `deleted_at`: un gasto fijo no se borra, solo se desactiva (`activo`).

create table if not exists finance_gastos_fijos (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  palabra_clave text not null,
  categoria text,
  monto_esperado numeric,
  activo boolean not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists finance_gastos_fijos_user_id_idx on finance_gastos_fijos(user_id);

alter table finance_gastos_fijos enable row level security;

drop policy if exists "select own gastos fijos" on finance_gastos_fijos;
drop policy if exists "insert own gastos fijos" on finance_gastos_fijos;
drop policy if exists "update own gastos fijos" on finance_gastos_fijos;
drop policy if exists "delete own gastos fijos" on finance_gastos_fijos;
create policy "select own gastos fijos" on finance_gastos_fijos for select using (auth.uid() = user_id);
create policy "insert own gastos fijos" on finance_gastos_fijos for insert with check (auth.uid() = user_id);
create policy "update own gastos fijos" on finance_gastos_fijos for update using (auth.uid() = user_id);
create policy "delete own gastos fijos" on finance_gastos_fijos for delete using (auth.uid() = user_id);
