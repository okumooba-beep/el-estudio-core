import { Link } from 'react-router-dom'
import { useAttentionSignals } from './attentionRegistry'
import { DESTINO_TO_SPACE } from './spaceRegistry'

/**
 * Sprint "Home refleja estado real de los Espacios": síntesis mínima y
 * silenciosa, no un dashboard — sin contadores, sin alertas. Si ningún
 * Espacio tiene una señal, esta sección no existe (ni siquiera vacía).
 * Cada línea es texto, no tarjeta (Bible cap. 11), y lleva directo al
 * Espacio — nunca abre un detalle inline acá.
 */
export function AttentionSummary() {
  const señales = useAttentionSignals()
  if (señales.length === 0) return null

  return (
    <div className="flex flex-col gap-1">
      {señales.map((señal) => {
        const espacio = DESTINO_TO_SPACE[señal.destino]
        if (!espacio) return null
        return (
          <Link key={señal.destino} to={espacio.path} className="text-[13px] text-ink-dim transition-colors active:text-ink">
            {señal.mensaje}
          </Link>
        )
      })}
    </div>
  )
}
