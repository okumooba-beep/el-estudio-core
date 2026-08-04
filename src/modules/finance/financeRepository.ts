import { db } from '@/lib/db/db'
import { generateId } from '@shared-kernel/id'
import type { Repository } from '@shared-kernel/persistence/Repository'
import type { FinanceCategoria } from './categorias'
import type { Medio, Moneda } from './extraccion'
import type { FinanceAccount, FinanceAccountTipo, FinanceMovimiento, FinanceMovimientoTipo, FinanceGoal } from '@/types/finance'

/**
 * Threshold Experience V1 — mismo patrón que operacionRepository.ts:
 * una tabla Dexie propia por entidad, mismo contrato Repository<T>
 * (list), add/update con la forma real de cada una. Tres repositorios
 * chicos en un solo archivo porque las tres viven bajo el mismo módulo
 * y ninguna necesita más que list/add(/update) — separarlas en tres
 * archivos sería más archivos sin más claridad (Regla 8).
 */
export interface NuevaFinanceAccount {
  nombre: string
  tipo: FinanceAccountTipo
  saldo: number
}

export interface FinanceAccountRepository extends Repository<FinanceAccount> {
  add(input: NuevaFinanceAccount): Promise<FinanceAccount>
  update(id: string, patch: Partial<Omit<FinanceAccount, 'id' | 'createdAt'>>): Promise<FinanceAccount>
}

class DexieFinanceAccountRepository implements FinanceAccountRepository {
  async list(): Promise<FinanceAccount[]> {
    const cuentas = await db.financeAccounts.toArray()
    return cuentas.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async add(input: NuevaFinanceAccount): Promise<FinanceAccount> {
    const now = new Date().toISOString()
    const cuenta: FinanceAccount = {
      id: generateId(),
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      saldo: input.saldo,
      createdAt: now,
      updatedAt: now,
      pendingSync: true,
    }
    await db.financeAccounts.add(cuenta)
    return cuenta
  }

  async update(id: string, patch: Partial<Omit<FinanceAccount, 'id' | 'createdAt'>>): Promise<FinanceAccount> {
    await db.financeAccounts.update(id, { ...patch, updatedAt: new Date().toISOString(), pendingSync: true })
    const updated = await db.financeAccounts.get(id)
    if (!updated) throw new Error(`Cuenta ${id} no encontrada`)
    return updated
  }
}

export interface NuevaFinanceMovimiento {
  tipo: FinanceMovimientoTipo
  monto: number
  concepto: string
  categoria: FinanceCategoria
  moneda: Moneda
  medio: Medio
  /** La hoja del Umbral de la que salió, si vino de una captura. */
  ideaId?: string
  /** YYYY-MM-DD. Por defecto hoy — una captura vieja conserva su día. */
  fecha?: string
}

export interface FinanceMovimientoRepository extends Repository<FinanceMovimiento> {
  add(input: NuevaFinanceMovimiento): Promise<FinanceMovimiento>
}

class DexieFinanceMovimientoRepository implements FinanceMovimientoRepository {
  async list(): Promise<FinanceMovimiento[]> {
    const movimientos = await db.financeMovimientos.toArray()
    return movimientos.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async add(input: NuevaFinanceMovimiento): Promise<FinanceMovimiento> {
    const now = new Date()
    const movimiento: FinanceMovimiento = {
      id: generateId(),
      tipo: input.tipo,
      monto: input.monto,
      concepto: input.concepto.trim(),
      categoria: input.categoria,
      moneda: input.moneda,
      medio: input.medio,
      ...(input.ideaId ? { ideaId: input.ideaId } : {}),
      fecha: input.fecha ?? now.toISOString().slice(0, 10),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      pendingSync: true,
    }
    await db.financeMovimientos.add(movimiento)
    return movimiento
  }
}

export interface NuevaFinanceGoal {
  texto: string
  objetivo: number
}

export interface FinanceGoalRepository extends Repository<FinanceGoal> {
  add(input: NuevaFinanceGoal): Promise<FinanceGoal>
  update(id: string, patch: Partial<Omit<FinanceGoal, 'id' | 'createdAt'>>): Promise<FinanceGoal>
}

class DexieFinanceGoalRepository implements FinanceGoalRepository {
  async list(): Promise<FinanceGoal[]> {
    const goals = await db.financeGoals.toArray()
    return goals.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async add(input: NuevaFinanceGoal): Promise<FinanceGoal> {
    const now = new Date().toISOString()
    const goal: FinanceGoal = {
      id: generateId(),
      texto: input.texto.trim(),
      objetivo: input.objetivo,
      actual: 0,
      createdAt: now,
      updatedAt: now,
      pendingSync: true,
    }
    await db.financeGoals.add(goal)
    return goal
  }

  async update(id: string, patch: Partial<Omit<FinanceGoal, 'id' | 'createdAt'>>): Promise<FinanceGoal> {
    await db.financeGoals.update(id, { ...patch, updatedAt: new Date().toISOString(), pendingSync: true })
    const updated = await db.financeGoals.get(id)
    if (!updated) throw new Error(`Meta ${id} no encontrada`)
    return updated
  }
}

export const financeAccountRepository: FinanceAccountRepository = new DexieFinanceAccountRepository()
export const financeMovimientoRepository: FinanceMovimientoRepository = new DexieFinanceMovimientoRepository()
export const financeGoalRepository: FinanceGoalRepository = new DexieFinanceGoalRepository()
