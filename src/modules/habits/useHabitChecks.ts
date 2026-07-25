import { useCallback, useEffect, useState } from 'react'
import { habitCheckRepository } from './habitCheckRepository'
import type { HabitCheck } from '@/types/habitCheck'

export function useHabitChecks() {
  const [checks, setChecks] = useState<HabitCheck[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    habitCheckRepository.list().then((loaded) => {
      setChecks(loaded)
      setReady(true)
    })
  }, [])

  /**
   * Optimista a propósito (Sprint "Perceived Performance"): tocar un
   * círculo es la interacción más repetida del módulo, y esperar la
   * lectura + escritura de `setChecked` antes de pintar el punto lo
   * hacía sentir con un instante de retraso. El id temporal solo cubre
   * el caso de un check nuevo (uno ya existente se actualiza en el
   * mismo id) — se reconcilia con el registro real apenas persiste.
   */
  const toggle = useCallback((habitId: string, fecha: string, checked: boolean): Promise<void> => {
    const updatedAt = new Date().toISOString()
    setChecks((current) => {
      const existing = current.find((c) => c.habitId === habitId && c.fecha === fecha)
      const optimistic: HabitCheck = existing
        ? { ...existing, checked, updatedAt, pendingSync: true }
        : { id: `pending-${habitId}-${fecha}`, habitId, fecha, checked, updatedAt, pendingSync: true }
      return [...current.filter((c) => !(c.habitId === habitId && c.fecha === fecha)), optimistic]
    })
    return habitCheckRepository.setChecked(habitId, fecha, checked).then((saved) => {
      setChecks((current) => [...current.filter((c) => !(c.habitId === habitId && c.fecha === fecha)), saved])
    })
  }, [])

  return { checks, ready, toggle }
}
