-- Fase 1 — Finanzas como piloto de sync (El Estudio Core)
--
-- Ejecutar manualmente en el SQL Editor de Supabase (o vía `supabase db push`
-- si el proyecto está linkeado localmente). Este repo no tiene credenciales ni
-- CLI de Supabase conectados, así que este archivo no se aplica solo.
--
-- Columnas y tipos calcados de los mappers en src/lib/sync/financeSync.ts
-- (AccountRow, MovimientoRow, GoalRow, PeriodoRow) — cualquier cambio ahí debe
-- reflejarse acá.

create table if not exists finance_accounts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  tipo text not null,
  saldo numeric not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists finance_movimientos (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  monto numeric not null,
  concepto text not null,
  categoria text,
  moneda text not null,
  medio text not null,
  idea_id uuid,
  fecha timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  compra_id uuid,
  cuota_numero integer,
  cuota_total integer,
  monto_original numeric,
  periodo_id uuid
);

create table if not exists finance_goals (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  texto text not null,
  objetivo numeric not null,
  actual numeric not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists finance_income_periods (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz not null,
  orden integer not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists finance_accounts_user_id_idx on finance_accounts(user_id);
create index if not exists finance_movimientos_user_id_idx on finance_movimientos(user_id);
create index if not exists finance_goals_user_id_idx on finance_goals(user_id);
create index if not exists finance_income_periods_user_id_idx on finance_income_periods(user_id);

alter table finance_accounts enable row level security;
alter table finance_movimientos enable row level security;
alter table finance_goals enable row level security;
alter table finance_income_periods enable row level security;

drop policy if exists "select own accounts" on finance_accounts;
drop policy if exists "insert own accounts" on finance_accounts;
drop policy if exists "update own accounts" on finance_accounts;
drop policy if exists "delete own accounts" on finance_accounts;
create policy "select own accounts" on finance_accounts for select using (auth.uid() = user_id);
create policy "insert own accounts" on finance_accounts for insert with check (auth.uid() = user_id);
create policy "update own accounts" on finance_accounts for update using (auth.uid() = user_id);
create policy "delete own accounts" on finance_accounts for delete using (auth.uid() = user_id);

drop policy if exists "select own movimientos" on finance_movimientos;
drop policy if exists "insert own movimientos" on finance_movimientos;
drop policy if exists "update own movimientos" on finance_movimientos;
drop policy if exists "delete own movimientos" on finance_movimientos;
create policy "select own movimientos" on finance_movimientos for select using (auth.uid() = user_id);
create policy "insert own movimientos" on finance_movimientos for insert with check (auth.uid() = user_id);
create policy "update own movimientos" on finance_movimientos for update using (auth.uid() = user_id);
create policy "delete own movimientos" on finance_movimientos for delete using (auth.uid() = user_id);

drop policy if exists "select own goals" on finance_goals;
drop policy if exists "insert own goals" on finance_goals;
drop policy if exists "update own goals" on finance_goals;
drop policy if exists "delete own goals" on finance_goals;
create policy "select own goals" on finance_goals for select using (auth.uid() = user_id);
create policy "insert own goals" on finance_goals for insert with check (auth.uid() = user_id);
create policy "update own goals" on finance_goals for update using (auth.uid() = user_id);
create policy "delete own goals" on finance_goals for delete using (auth.uid() = user_id);

drop policy if exists "select own income periods" on finance_income_periods;
drop policy if exists "insert own income periods" on finance_income_periods;
drop policy if exists "update own income periods" on finance_income_periods;
drop policy if exists "delete own income periods" on finance_income_periods;
create policy "select own income periods" on finance_income_periods for select using (auth.uid() = user_id);
create policy "insert own income periods" on finance_income_periods for insert with check (auth.uid() = user_id);
create policy "update own income periods" on finance_income_periods for update using (auth.uid() = user_id);
create policy "delete own income periods" on finance_income_periods for delete using (auth.uid() = user_id);
