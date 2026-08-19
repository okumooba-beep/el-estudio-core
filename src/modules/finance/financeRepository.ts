import { db } from '@/lib/db/db'
import { generateId } from '@shared-kernel/id'
import type { Repository } from '@shared-kernel/persistence/Repository'
import type { FinanceCategoria } from './categorias'
import { dividirEnCuotas, fechaCuota, type Medio, type Moneda } from './extraccion'
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
  /** `null` cuando el léxico no reconoció la categoría: el movimiento nace "Por revisar" (Sprint 007). */
  categoria: FinanceCategoria | null
  moneda: Moneda
  medio: Medio
  /** La hoja del Umbral de la que salió, si vino de una captura. */
  ideaId?: string
  /** YYYY-MM-DD. Por defecto hoy — una captura vieja conserva su día. */
  fecha?: string
}

/**
 * Sprint 028 — lo que pide una compra financiada: el total, no el monto
 * por cuota (§6 del brief: "Gaste 87k ... 3 cuotas" son $87.000 en
 * total, no $87.000 x 3). `addCompra` es la única lógica que arma la
 * serie, para que el Umbral y "+ Movimiento" (NuevoMovimiento.tsx)
 * compartan exactamente el mismo cálculo (§13: "no duplicar la lógica").
 */
export interface NuevaCompraEnCuotas {
  concepto: string
  /** El total de la compra, tal cual lo dice el texto — se divide acá adentro, nunca antes. */
  montoTotal: number
  cantidadCuotas: number
  categoria: FinanceCategoria | null
  moneda: Moneda
  medio: Medio
  ideaId?: string
  /** YYYY-MM-DD de la compra — cuota 1. Por defecto hoy. */
  fecha?: string
}

export interface FinanceMovimientoRepository extends Repository<FinanceMovimiento> {
  add(input: NuevaFinanceMovimiento): Promise<FinanceMovimiento>
  /** Sprint 028 — una compra en cuotas nace como N movimientos, uno por mes, todos con el mismo compraId. */
  addCompra(input: NuevaCompraEnCuotas): Promise<FinanceMovimiento[]>
  /**
   * Sprint 007 — corrige la categoría de un movimiento "Por revisar"
   * con una interacción simple.
   *
   * Sprint 028 — si el movimiento pertenece a una compra en cuotas y el
   * patch cambia `categoria`, la corrección se propaga a las demás
   * cuotas de la misma compra (§9/§10/§18: todas las cuotas de una
   * operación comparten categoría; editar la categoría de una es editar
   * la operación entera, la única forma de edición que existe hoy en
   * Finanzas — no hay UI para editar monto/fecha/concepto de nada, así
   * que no hay otro campo cuya edición pueda desalinear el total). Por
   * eso devuelve todos los movimientos que terminaron afectados, no
   * solo el que se pidió corregir.
   */
  update(id: string, patch: Partial<Omit<FinanceMovimiento, 'id' | 'createdAt'>>): Promise<FinanceMovimiento[]>
  /**
   * Mini Sprint 029.1 (§7) — borra un movimiento individual. Nunca una
   * semana ni una categoría entera: siempre un solo id. Sin protección
   * de cuotas acá adentro a propósito: la decisión de qué se puede
   * borrar es de producto, no de datos, y todavía no está tomada para
   * una cuota (§10) — así que quien llama a esto (la UI) es quien nunca
   * ofrece el botón para un movimiento con `compraId`, no este método.
   */
  delete(id: string): Promise<void>
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

  async addCompra(input: NuevaCompraEnCuotas): Promise<FinanceMovimiento[]> {
    const compraId = generateId()
    const fechaCompra = input.fecha ?? new Date().toISOString().slice(0, 10)
    const montos = dividirEnCuotas(input.montoTotal, input.cantidadCuotas)
    const now = new Date().toISOString()
    const movimientos: FinanceMovimiento[] = montos.map((monto, indice) => ({
      id: generateId(),
      tipo: 'egreso',
      monto,
      concepto: input.concepto.trim(),
      categoria: input.categoria,
      moneda: input.moneda,
      medio: input.medio,
      ...(input.ideaId ? { ideaId: input.ideaId } : {}),
      fecha: fechaCuota(fechaCompra, indice),
      createdAt: now,
      updatedAt: now,
      pendingSync: true,
      compraId,
      cuotaNumero: indice + 1,
      cuotaTotal: input.cantidadCuotas,
      montoOriginal: input.montoTotal,
    }))
    await db.financeMovimientos.bulkAdd(movimientos)
    return movimientos
  }

  async update(id: string, patch: Partial<Omit<FinanceMovimiento, 'id' | 'createdAt'>>): Promise<FinanceMovimiento[]> {
    const actual = await db.financeMovimientos.get(id)
    if (!actual) throw new Error(`Movimiento ${id} no encontrado`)
    const now = new Date().toISOString()
    await db.financeMovimientos.update(id, { ...patch, updatedAt: now, pendingSync: true })
    let hermanas: FinanceMovimiento[] = []
    if (patch.categoria !== undefined && actual.compraId) {
      const compraId = actual.compraId
      await db.financeMovimientos
        .where('compraId')
        .equals(compraId)
        .and((movimiento) => movimiento.id !== id)
        .modify({ categoria: patch.categoria, updatedAt: now, pendingSync: true })
      hermanas = await db.financeMovimientos.where('compraId').equals(compraId).and((m) => m.id !== id).toArray()
    }
    const updated = await db.financeMovimientos.get(id)
    if (!updated) throw new Error(`Movimiento ${id} no encontrado`)
    return [updated, ...hermanas]
  }

  async delete(id: string): Promise<void> {
    await db.financeMovimientos.delete(id)
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
