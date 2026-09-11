-- Finanzas de "Mi proyecto" — mismo motor que Finanzas general (ver
-- src/components/finance-engine/) sobre un juego de tablas propio, para
-- que los dos espacios nunca compartan datos aunque reutilicen el mismo
-- esquema de columnas.
--
-- Ejecutar manualmente en el SQL Editor de Supabase (o vía `supabase db push`
-- si el proyecto está linkeado localmente). Este repo no tiene credenciales ni
-- CLI de Supabase conectados, así que este archivo no se aplica solo.
--
-- Columnas y tipos calcados de los mappers en src/lib/sync/miProyectoFinanceSync.ts
-- (AccountRow, MovimientoRow, GoalRow, PeriodoRow) — mismo esquema que
-- finance_accounts/finance_movimientos/finance_goals/finance_income_periods
-- (ver finance_schema.sql), solo cambia el nombre de tabla.

create table if not exists mi_proyecto_finanzas_accounts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  tipo text not null,
  saldo numeric not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists mi_proyecto_finanzas_movimientos (
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

create table if not exists mi_proyecto_finanzas_goals (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  texto text not null,
  objetivo numeric not null,
  actual numeric not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists mi_proyecto_finanzas_income_periods (
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

create index if not exists mi_proyecto_finanzas_accounts_user_id_idx on mi_proyecto_finanzas_accounts(user_id);
create index if not exists mi_proyecto_finanzas_movimientos_user_id_idx on mi_proyecto_finanzas_movimientos(user_id);
create index if not exists mi_proyecto_finanzas_goals_user_id_idx on mi_proyecto_finanzas_goals(user_id);
create index if not exists mi_proyecto_finanzas_income_periods_user_id_idx on mi_proyecto_finanzas_income_periods(user_id);

alter table mi_proyecto_finanzas_accounts enable row level security;
alter table mi_proyecto_finanzas_movimientos enable row level security;
alter table mi_proyecto_finanzas_goals enable row level security;
alter table mi_proyecto_finanzas_income_periods enable row level security;

drop policy if exists "select own mi_proyecto_finanzas_accounts" on mi_proyecto_finanzas_accounts;
drop policy if exists "insert own mi_proyecto_finanzas_accounts" on mi_proyecto_finanzas_accounts;
drop policy if exists "update own mi_proyecto_finanzas_accounts" on mi_proyecto_finanzas_accounts;
drop policy if exists "delete own mi_proyecto_finanzas_accounts" on mi_proyecto_finanzas_accounts;
create policy "select own mi_proyecto_finanzas_accounts" on mi_proyecto_finanzas_accounts for select using (auth.uid() = user_id);
create policy "insert own mi_proyecto_finanzas_accounts" on mi_proyecto_finanzas_accounts for insert with check (auth.uid() = user_id);
create policy "update own mi_proyecto_finanzas_accounts" on mi_proyecto_finanzas_accounts for update using (auth.uid() = user_id);
create policy "delete own mi_proyecto_finanzas_accounts" on mi_proyecto_finanzas_accounts for delete using (auth.uid() = user_id);

drop policy if exists "select own mi_proyecto_finanzas_movimientos" on mi_proyecto_finanzas_movimientos;
drop policy if exists "insert own mi_proyecto_finanzas_movimientos" on mi_proyecto_finanzas_movimientos;
drop policy if exists "update own mi_proyecto_finanzas_movimientos" on mi_proyecto_finanzas_movimientos;
drop policy if exists "delete own mi_proyecto_finanzas_movimientos" on mi_proyecto_finanzas_movimientos;
create policy "select own mi_proyecto_finanzas_movimientos" on mi_proyecto_finanzas_movimientos for select using (auth.uid() = user_id);
create policy "insert own mi_proyecto_finanzas_movimientos" on mi_proyecto_finanzas_movimientos for insert with check (auth.uid() = user_id);
create policy "update own mi_proyecto_finanzas_movimientos" on mi_proyecto_finanzas_movimientos for update using (auth.uid() = user_id);
create policy "delete own mi_proyecto_finanzas_movimientos" on mi_proyecto_finanzas_movimientos for delete using (auth.uid() = user_id);

drop policy if exists "select own mi_proyecto_finanzas_goals" on mi_proyecto_finanzas_goals;
drop policy if exists "insert own mi_proyecto_finanzas_goals" on mi_proyecto_finanzas_goals;
drop policy if exists "update own mi_proyecto_finanzas_goals" on mi_proyecto_finanzas_goals;
drop policy if exists "delete own mi_proyecto_finanzas_goals" on mi_proyecto_finanzas_goals;
create policy "select own mi_proyecto_finanzas_goals" on mi_proyecto_finanzas_goals for select using (auth.uid() = user_id);
create policy "insert own mi_proyecto_finanzas_goals" on mi_proyecto_finanzas_goals for insert with check (auth.uid() = user_id);
create policy "update own mi_proyecto_finanzas_goals" on mi_proyecto_finanzas_goals for update using (auth.uid() = user_id);
create policy "delete own mi_proyecto_finanzas_goals" on mi_proyecto_finanzas_goals for delete using (auth.uid() = user_id);

drop policy if exists "select own mi_proyecto_finanzas_income_periods" on mi_proyecto_finanzas_income_periods;
drop policy if exists "insert own mi_proyecto_finanzas_income_periods" on mi_proyecto_finanzas_income_periods;
drop policy if exists "update own mi_proyecto_finanzas_income_periods" on mi_proyecto_finanzas_income_periods;
drop policy if exists "delete own mi_proyecto_finanzas_income_periods" on mi_proyecto_finanzas_income_periods;
create policy "select own mi_proyecto_finanzas_income_periods" on mi_proyecto_finanzas_income_periods for select using (auth.uid() = user_id);
create policy "insert own mi_proyecto_finanzas_income_periods" on mi_proyecto_finanzas_income_periods for insert with check (auth.uid() = user_id);
create policy "update own mi_proyecto_finanzas_income_periods" on mi_proyecto_finanzas_income_periods for update using (auth.uid() = user_id);
create policy "delete own mi_proyecto_finanzas_income_periods" on mi_proyecto_finanzas_income_periods for delete using (auth.uid() = user_id);
