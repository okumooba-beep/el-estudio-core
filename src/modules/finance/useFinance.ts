import { useEffect, useState } from 'react'
import {
  financeAccountRepository,
  financeMovimientoRepository,
  financeGoalRepository,
  type NuevaFinanceAccount,
  type NuevaFinanceMovimiento,
  type NuevaFinanceGoal,
} from './financeRepository'
import type { FinanceAccount, FinanceMovimiento, FinanceGoal } from '@/types/finance'

/**
 * Threshold Experience V1 — mismo patrón que useHabitChecks: carga una
 * vez al montar, cada escritura actualiza el estado local en el mismo
 * tick (optimista) y persiste en paralelo. Foundations only: ninguna
 * de las tres listas necesita compartirse entre componentes todavía
 * (a diferencia de useIdeas), así que no hace falta el store a nivel de
 * módulo — cuando otra pantalla necesite leer Finanzas, ese es el
 * momento de promoverlo, no antes (Regla 12).
 */
export function useFinance() {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([])
  const [movimientos, setMovimientos] = useState<FinanceMovimiento[]>([])
  const [goals, setGoals] = useState<FinanceGoal[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([financeAccountRepository.list(), financeMovimientoRepository.list(), financeGoalRepository.list()]).then(
      ([loadedAccounts, loadedMovimientos, loadedGoals]) => {
        setAccounts(loadedAccounts)
        setMovimientos(loadedMovimientos)
        setGoals(loadedGoals)
        setReady(true)
      },
    )
  }, [])

  async function addAccount(input: NuevaFinanceAccount): Promise<void> {
    const created = await financeAccountRepository.add(input)
    setAccounts((current) => [created, ...current])
  }

  async function updateAccount(id: string, patch: Partial<Omit<FinanceAccount, 'id' | 'createdAt'>>): Promise<void> {
    const updated = await financeAccountRepository.update(id, patch)
    setAccounts((current) => current.map((account) => (account.id === id ? updated : account)))
  }

  async function addMovimiento(input: NuevaFinanceMovimiento): Promise<void> {
    const created = await financeMovimientoRepository.add(input)
    setMovimientos((current) => [created, ...current])
  }

  async function updateMovimiento(id: string, patch: Partial<Omit<FinanceMovimiento, 'id' | 'createdAt'>>): Promise<void> {
    const updated = await financeMovimientoRepository.update(id, patch)
    setMovimientos((current) => current.map((movimiento) => (movimiento.id === id ? updated : movimiento)))
  }

  async function addGoal(input: NuevaFinanceGoal): Promise<void> {
    const created = await financeGoalRepository.add(input)
    setGoals((current) => [created, ...current])
  }

  async function updateGoal(id: string, patch: Partial<Omit<FinanceGoal, 'id' | 'createdAt'>>): Promise<void> {
    const updated = await financeGoalRepository.update(id, patch)
    setGoals((current) => current.map((goal) => (goal.id === id ? updated : goal)))
  }

  return { accounts, movimientos, goals, ready, addAccount, updateAccount, addMovimiento, updateMovimiento, addGoal, updateGoal }
}
