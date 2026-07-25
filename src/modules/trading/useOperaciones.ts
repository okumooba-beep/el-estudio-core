import { useCallback, useEffect, useState } from 'react'
import { operacionRepository, type NuevaOperacion } from './operacionRepository'
import type { Operacion } from '@/types/operacion'

export function useOperaciones() {
  const [operaciones, setOperaciones] = useState<Operacion[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    operacionRepository.list().then((loaded) => {
      setOperaciones(loaded)
      setReady(true)
    })
  }, [])

  const add = useCallback(async (input: NuevaOperacion) => {
    const created = await operacionRepository.add(input)
    setOperaciones((current) => [created, ...current])
    return created
  }, [])

  /**
   * Optimista a propósito (Sprint "Perceived Performance"): el checklist
   * de un expediente se toca muchas veces por revisión — el estado se
   * actualiza en el mismo tick, sin esperar la lectura de vuelta que
   * hacía `operacionRepository.update` para confirmar el resultado.
   */
  const update = useCallback((id: string, patch: Partial<Omit<Operacion, 'id' | 'createdAt'>>): Promise<void> => {
    const updatedAt = new Date().toISOString()
    setOperaciones((current) =>
      current.map((operacion) => (operacion.id === id ? { ...operacion, ...patch, updatedAt, pendingSync: true } : operacion)),
    )
    return operacionRepository.update(id, patch).then(() => undefined)
  }, [])

  return { operaciones, ready, add, update }
}
