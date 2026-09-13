import { useEffect, useState } from 'react'
import { createGastosFijosRepository, type NuevaFinanceGastoFijo } from './gastosFijosRepository'
import type { FinanceGastoFijo } from '@/types/finance'
import type { EntityTable } from 'dexie'

export interface GastosFijosEngineApi {
  gastosFijos: FinanceGastoFijo[]
  ready: boolean
  addGastoFijo(input: NuevaFinanceGastoFijo): Promise<void>
  updateGastoFijo(id: string, patch: Partial<Omit<FinanceGastoFijo, 'id' | 'createdAt'>>): Promise<void>
}

/**
 * "Gastos fijos mensuales" — fábrica propia, exclusiva de Finanzas
 * general (nunca instanciada desde Mi Proyecto), mismo patrón de hook
 * `useEngine` que `createFinanceEngine`/`createNotesEngine`: carga una
 * vez al montar, cada escritura actualiza el estado local en el mismo
 * tick (optimista) y persiste en paralelo.
 */
export function createGastosFijosEngine(table: EntityTable<FinanceGastoFijo, 'id'>) {
  const repository = createGastosFijosRepository(table)

  function useEngine(): GastosFijosEngineApi {
    const [gastosFijos, setGastosFijos] = useState<FinanceGastoFijo[]>([])
    const [ready, setReady] = useState(false)

    useEffect(() => {
      repository.list().then((loaded) => {
        setGastosFijos(loaded)
        setReady(true)
      })
    }, [])

    async function addGastoFijo(input: NuevaFinanceGastoFijo): Promise<void> {
      const created = await repository.add(input)
      setGastosFijos((current) => [...current, created])
    }

    async function updateGastoFijo(id: string, patch: Partial<Omit<FinanceGastoFijo, 'id' | 'createdAt'>>): Promise<void> {
      const updated = await repository.update(id, patch)
      setGastosFijos((current) => current.map((gf) => (gf.id === id ? updated : gf)))
    }

    return { gastosFijos, ready, addGastoFijo, updateGastoFijo }
  }

  return { useEngine }
}

export type GastosFijosEngine = ReturnType<typeof createGastosFijosEngine>
