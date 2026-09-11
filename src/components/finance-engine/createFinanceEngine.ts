import { useEffect, useState } from 'react'
import {
  createFinanceEngineRepositories,
  type NuevaFinanceAccount,
  type NuevaFinanceMovimiento,
  type NuevaCompraEnCuotas,
  type NuevaFinanceGoal,
  type NuevoFinanceIncomePeriod,
} from './financeEngineRepository'
import type { FinanceAccount, FinanceMovimiento, FinanceGoal, FinanceIncomePeriod } from '@/types/finance'
import type { EntityTable } from 'dexie'

export interface FinanceEngineApi {
  accounts: FinanceAccount[]
  movimientos: FinanceMovimiento[]
  goals: FinanceGoal[]
  periodos: FinanceIncomePeriod[]
  ready: boolean
  addAccount(input: NuevaFinanceAccount): Promise<void>
  updateAccount(id: string, patch: Partial<Omit<FinanceAccount, 'id' | 'createdAt'>>): Promise<void>
  addMovimiento(input: NuevaFinanceMovimiento): Promise<void>
  addCompra(input: NuevaCompraEnCuotas): Promise<void>
  updateMovimiento(id: string, patch: Partial<Omit<FinanceMovimiento, 'id' | 'createdAt'>>): Promise<void>
  deleteMovimiento(id: string): Promise<void>
  addGoal(input: NuevaFinanceGoal): Promise<void>
  updateGoal(id: string, patch: Partial<Omit<FinanceGoal, 'id' | 'createdAt'>>): Promise<void>
  addPeriodo(input: NuevoFinanceIncomePeriod): Promise<void>
  obtenerOCrearPeriodo(input: NuevoFinanceIncomePeriod): Promise<FinanceIncomePeriod>
  deletePeriodo(id: string): Promise<void>
}

/**
 * Fábrica del motor de Finanzas (usado por `finance/` y `miproyecto/`,
 * ver FinanceEngineScreen.tsx) — cada llamada instancia su propio hook
 * `useEngine` apuntado a su propio juego de 4 tablas Dexie, mismo
 * patrón que createNotesEngine.ts: Threshold Experience V1 — carga una
 * vez al montar, cada escritura actualiza el estado local en el mismo
 * tick (optimista) y persiste en paralelo.
 */
export function createFinanceEngine(
  accountTable: EntityTable<FinanceAccount, 'id'>,
  movimientoTable: EntityTable<FinanceMovimiento, 'id'>,
  goalTable: EntityTable<FinanceGoal, 'id'>,
  periodoTable: EntityTable<FinanceIncomePeriod, 'id'>,
) {
  const { accountRepository, movimientoRepository, goalRepository, periodoRepository } = createFinanceEngineRepositories(
    accountTable,
    movimientoTable,
    goalTable,
    periodoTable,
  )

  function useEngine(): FinanceEngineApi {
    const [accounts, setAccounts] = useState<FinanceAccount[]>([])
    const [movimientos, setMovimientos] = useState<FinanceMovimiento[]>([])
    const [goals, setGoals] = useState<FinanceGoal[]>([])
    const [periodos, setPeriodos] = useState<FinanceIncomePeriod[]>([])
    const [ready, setReady] = useState(false)

    useEffect(() => {
      Promise.all([
        accountRepository.list(),
        movimientoRepository.list(),
        goalRepository.list(),
        periodoRepository.list(),
      ]).then(([loadedAccounts, loadedMovimientos, loadedGoals, loadedPeriodos]) => {
        setAccounts(loadedAccounts)
        setMovimientos(loadedMovimientos)
        setGoals(loadedGoals)
        setPeriodos(loadedPeriodos)
        setReady(true)
      })
    }, [])

    async function addAccount(input: NuevaFinanceAccount): Promise<void> {
      const created = await accountRepository.add(input)
      setAccounts((current) => [created, ...current])
    }

    async function updateAccount(id: string, patch: Partial<Omit<FinanceAccount, 'id' | 'createdAt'>>): Promise<void> {
      const updated = await accountRepository.update(id, patch)
      setAccounts((current) => current.map((account) => (account.id === id ? updated : account)))
    }

    async function addMovimiento(input: NuevaFinanceMovimiento): Promise<void> {
      const created = await movimientoRepository.add(input)
      setMovimientos((current) => [created, ...current])
    }

    /** Sprint 028 — misma alta que `addMovimiento`, pero arma N cuotas de una compra financiada. */
    async function addCompra(input: NuevaCompraEnCuotas): Promise<void> {
      const creadas = await movimientoRepository.addCompra(input)
      setMovimientos((current) => [...creadas, ...current])
    }

    /**
     * Sprint 028 — `update` puede devolver más de un movimiento afectado
     * (una corrección de categoría que se propaga a las demás cuotas de
     * la misma compra), así que el estado local se actualiza por id para
     * cada uno, no solo para el que se pidió corregir.
     */
    async function updateMovimiento(id: string, patch: Partial<Omit<FinanceMovimiento, 'id' | 'createdAt'>>): Promise<void> {
      const actualizados = await movimientoRepository.update(id, patch)
      const porId = new Map(actualizados.map((movimiento) => [movimiento.id, movimiento]))
      setMovimientos((current) => current.map((movimiento) => porId.get(movimiento.id) ?? movimiento))
    }

    /** Mini Sprint 029.1 (§7) — borra un movimiento y lo saca del estado local, así todos los resúmenes derivados se recalculan solos. */
    async function deleteMovimiento(id: string): Promise<void> {
      await movimientoRepository.delete(id)
      setMovimientos((current) => current.filter((movimiento) => movimiento.id !== id))
    }

    async function addGoal(input: NuevaFinanceGoal): Promise<void> {
      const created = await goalRepository.add(input)
      setGoals((current) => [created, ...current])
    }

    async function updateGoal(id: string, patch: Partial<Omit<FinanceGoal, 'id' | 'createdAt'>>): Promise<void> {
      const updated = await goalRepository.update(id, patch)
      setGoals((current) => current.map((goal) => (goal.id === id ? updated : goal)))
    }

    /** Sprint 036 — crea un período de ingresos ("+ Nueva semana"). */
    async function addPeriodo(input: NuevoFinanceIncomePeriod): Promise<void> {
      const created = await periodoRepository.add(input)
      setPeriodos((current) => [...current, created])
    }

    /**
     * Sprint 039 — misma alta que `addPeriodo`, pero devuelve el período
     * (nuevo o ya existente para esa semana) para poder usar su `id` de
     * inmediato. La necesita la conversión automática Umbral→Finanzas: un
     * ingreso capturado por texto tiene `fecha` pero no sabe a qué semana
     * de cobro pertenece hasta que alguien se lo resuelve. `periodoRepository.add`
     * ya es find-or-create por `fechaInicio` (Sprint 037), así que acá solo
     * hace falta no duplicar tampoco el estado local cuando devuelve un
     * período que ya estaba en `periodos`.
     */
    async function obtenerOCrearPeriodo(input: NuevoFinanceIncomePeriod): Promise<FinanceIncomePeriod> {
      const periodo = await periodoRepository.add(input)
      setPeriodos((current) => (current.some((p) => p.id === periodo.id) ? current : [...current, periodo]))
      return periodo
    }

    /** Sprint 036 — borra un período. La UI solo lo ofrece cuando ya no tiene ingresos asignados. */
    async function deletePeriodo(id: string): Promise<void> {
      await periodoRepository.delete(id)
      setPeriodos((current) => current.filter((periodo) => periodo.id !== id))
    }

    return {
      accounts,
      movimientos,
      goals,
      periodos,
      ready,
      addAccount,
      updateAccount,
      addMovimiento,
      addCompra,
      updateMovimiento,
      deleteMovimiento,
      addGoal,
      updateGoal,
      addPeriodo,
      obtenerOCrearPeriodo,
      deletePeriodo,
    }
  }

  return { useEngine }
}

export type FinanceEngine = ReturnType<typeof createFinanceEngine>
