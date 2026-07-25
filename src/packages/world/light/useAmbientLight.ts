import { useEffect } from 'react'
import { applyLight } from './applyLight'

const UPDATE_INTERVAL_MS = 60_000

/**
 * Mantiene la luz de la habitación viva mientras la app está abierta.
 * El primer valor ya lo puso src/light-bootstrap.ts antes del paint;
 * aquí solo se reafirma y se reprograma cada minuto.
 */
export function useAmbientLight(): void {
  useEffect(() => {
    applyLight()
    const id = setInterval(() => applyLight(), UPDATE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])
}
