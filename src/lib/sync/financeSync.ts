import { db } from '@/lib/db/db'
import { supabase } from '@/lib/supabase/client'
import { readPending, markSynced } from './pendingSync'
import type {
  FinanceAccount,
  FinanceAccountTipo,
  FinanceMovimiento,
  FinanceMovimientoTipo,
  FinanceGoal,
  FinanceIncomePeriod,
} from '@/types/finance'
import type { FinanceCategoria } from '@modules/finance/categorias'
import type { Medio, Moneda } from '@modules/finance/extraccion'
import type { EntityTable } from 'dexie'

/**
 * Fase 1 (sync Supabase) — el motor de sync vive en `src/lib`, no dentro
 * del módulo Finanzas: opera directo sobre `db` (la misma instancia Dexie
 * compartida que ya usa financeRepository.ts) y sobre el cliente Supabase,
 * dos dependencias que dependency-cruiser ya autoriza fuera de `src/modules`
 * (ver .dependency-cruiser.cjs — `db.ts` es la excepción universal; el
 * cliente de Supabase nunca necesita entrar a un módulo). Esto evita tocar
 * financeRepository.ts más de lo estrictamente necesario (el borrado
 * lógico) y evita agregar una regla de boundaries nueva.
 *
 * Cada tabla mapea su fila Dexie (camelCase) a una fila Supabase
 * (snake_case) — ver supabase/finance_schema.sql para el DDL real. Nunca se
 * sincroniza `pendingSync` (es un flag puramente local).
 */

interface AccountRow {
  id: string
  user_id: string
  nombre: string
  tipo: FinanceAccountTipo
  saldo: number
  created_at: string
  updated_at: string
}

interface MovimientoRow {
  id: string
  user_id: string
  tipo: FinanceMovimientoTipo
  monto: number
  concepto: string
  categoria: FinanceCategoria | null
  moneda: Moneda
  medio: Medio
  idea_id: string | null
  fecha: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  compra_id: string | null
  cuota_numero: number | null
  cuota_total: number | null
  monto_original: number | null
  periodo_id: string | null
}

interface GoalRow {
  id: string
  user_id: string
  texto: string
  objetivo: number
  actual: number
  created_at: string
  updated_at: string
}

interface PeriodoRow {
  id: string
  user_id: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  orden: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface TableSync<Local extends { id: string; pendingSync: boolean }, Remote extends { id: string }> {
  supabaseTable: string
  dexieTable: EntityTable<Local, 'id'>
  toRow(userId: string, local: Local): Remote
  fromRow(row: Remote): Local
}

const accountsSync: TableSync<FinanceAccount, AccountRow> = {
  supabaseTable: 'finance_accounts',
  dexieTable: db.financeAccounts,
  toRow: (userId, a) => ({
    id: a.id,
    user_id: userId,
    nombre: a.nombre,
    tipo: a.tipo,
    saldo: a.saldo,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  }),
  fromRow: (row) => ({
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    saldo: row.saldo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
  }),
}

const movimientosSync: TableSync<FinanceMovimiento, MovimientoRow> = {
  supabaseTable: 'finance_movimientos',
  dexieTable: db.financeMovimientos,
  toRow: (userId, m) => ({
    id: m.id,
    user_id: userId,
    tipo: m.tipo,
    monto: m.monto,
    concepto: m.concepto,
    categoria: m.categoria,
    moneda: m.moneda,
    medio: m.medio,
    idea_id: m.ideaId ?? null,
    fecha: m.fecha,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
    deleted_at: m.deletedAt ?? null,
    compra_id: m.compraId ?? null,
    cuota_numero: m.cuotaNumero ?? null,
    cuota_total: m.cuotaTotal ?? null,
    monto_original: m.montoOriginal ?? null,
    periodo_id: m.periodoId ?? null,
  }),
  fromRow: (row) => ({
    id: row.id,
    tipo: row.tipo,
    monto: row.monto,
    concepto: row.concepto,
    categoria: row.categoria,
    moneda: row.moneda,
    medio: row.medio,
    ...(row.idea_id ? { ideaId: row.idea_id } : {}),
    fecha: row.fecha,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
    ...(row.compra_id ? { compraId: row.compra_id } : {}),
    ...(row.cuota_numero != null ? { cuotaNumero: row.cuota_numero } : {}),
    ...(row.cuota_total != null ? { cuotaTotal: row.cuota_total } : {}),
    ...(row.monto_original != null ? { montoOriginal: row.monto_original } : {}),
    ...(row.periodo_id ? { periodoId: row.periodo_id } : {}),
  }),
}

const goalsSync: TableSync<FinanceGoal, GoalRow> = {
  supabaseTable: 'finance_goals',
  dexieTable: db.financeGoals,
  toRow: (userId, g) => ({
    id: g.id,
    user_id: userId,
    texto: g.texto,
    objetivo: g.objetivo,
    actual: g.actual,
    created_at: g.createdAt,
    updated_at: g.updatedAt,
  }),
  fromRow: (row) => ({
    id: row.id,
    texto: row.texto,
    objetivo: row.objetivo,
    actual: row.actual,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
  }),
}

const periodosSync: TableSync<FinanceIncomePeriod, PeriodoRow> = {
  supabaseTable: 'finance_income_periods',
  dexieTable: db.financeIncomePeriods,
  toRow: (userId, p) => ({
    id: p.id,
    user_id: userId,
    nombre: p.nombre,
    fecha_inicio: p.fechaInicio,
    fecha_fin: p.fechaFin,
    orden: p.orden,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    deleted_at: p.deletedAt ?? null,
  }),
  fromRow: (row) => ({
    id: row.id,
    nombre: row.nombre,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    orden: row.orden,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
  }),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ALL_TABLES: TableSync<any, any>[] = [accountsSync, movimientosSync, goalsSync, periodosSync]

async function allFinanceTablesEmpty(): Promise<boolean> {
  const counts = await Promise.all(ALL_TABLES.map((t) => t.dexieTable.count()))
  return counts.every((count) => count === 0)
}

/** Sube todo lo que quedó marcado `pendingSync: true` desde la última corrida. Se llama cada vez que hay conexión y sesión activa. */
export async function pushFinancePending(userId: string): Promise<void> {
  if (!supabase) return
  for (const table of ALL_TABLES) {
    const pendientes = await readPending(table.dexieTable)
    if (pendientes.length === 0) continue
    const rows = pendientes.map((local) => table.toRow(userId, local))
    const { error } = await supabase.from(table.supabaseTable).upsert(rows, { onConflict: 'id' })
    if (error) {
      console.error(`[sync] push falló en ${table.supabaseTable}:`, error.message)
      continue
    }
    await markSynced(
      table.dexieTable,
      pendientes.map((row) => row.id),
    )
  }
}

/** Dispositivo nuevo / reinstalación: Dexie está vacía pero la cuenta puede tener datos reales en Supabase. */
export async function hydrateFinanceFromSupabase(userId: string): Promise<void> {
  if (!supabase) return
  for (const table of ALL_TABLES) {
    const { data, error } = await supabase.from(table.supabaseTable).select('*').eq('user_id', userId)
    if (error) {
      console.error(`[sync] hidratación falló en ${table.supabaseTable}:`, error.message)
      continue
    }
    if (!data || data.length === 0) continue
    const locales = data.map((row) => table.fromRow(row))
    await table.dexieTable.bulkPut(locales)
  }
}

/** Primer login con datos locales previos (creados sin sesión): sube todo lo que ya existe en Dexie, tabla por tabla. */
export async function migrateFinanceOnFirstLogin(userId: string): Promise<string[]> {
  if (!supabase) return []
  const tablasConfirmadas: string[] = []
  for (const table of ALL_TABLES) {
    const locales = await table.dexieTable.toArray()
    if (locales.length === 0) {
      tablasConfirmadas.push(table.supabaseTable)
      continue
    }
    const rows = locales.map((local) => table.toRow(userId, local))
    const { error } = await supabase.from(table.supabaseTable).upsert(rows, { onConflict: 'id' })
    if (error) {
      console.error(`[sync] migración falló en ${table.supabaseTable}:`, error.message)
      continue
    }
    await markSynced(
      table.dexieTable,
      locales.map((row) => row.id),
    )
    tablasConfirmadas.push(table.supabaseTable)
  }
  return tablasConfirmadas
}

export { allFinanceTablesEmpty }
