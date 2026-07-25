import type { CSSProperties } from 'react'
import type { AmbientParticleDefinition } from '@/types/ambientParticle'

/**
 * El polvo: motas de polvo suspendidas en la luz, no partículas de
 * videojuego. Prácticamente invisibles — solo se notan un instante
 * cuando cruzan el resplandor de la ventana, cerca de donde vive
 * .room-layer-window (ver src/index.css). Posiciones y duraciones fijas
 * a mano, no un sistema de partículas: son cuatro motas, no cientos.
 *
 * "Reducir movimiento" hace desaparecer esta capa entera (ver
 * .ambient-particles en src/index.css) — no una versión más lenta,
 * ausencia total, igual que el resto de la habitación.
 */
const MOTES: readonly AmbientParticleDefinition[] = [
  { id: 'mota-1', position: { x: 21, y: 18 }, driftDurationMs: 47000, maxOpacity: 0.1 },
  { id: 'mota-2', position: { x: 27, y: 24 }, driftDurationMs: 61000, maxOpacity: 0.07 },
  { id: 'mota-3', position: { x: 16, y: 27 }, driftDurationMs: 53000, maxOpacity: 0.12 },
  { id: 'mota-4', position: { x: 24, y: 14 }, driftDurationMs: 68000, maxOpacity: 0.08 },
]

export function AmbientParticles() {
  return (
    <div aria-hidden className="ambient-particles absolute inset-0 overflow-hidden">
      {MOTES.map((mote, index) => (
        <span
          key={mote.id}
          className="ambient-particle"
          style={
            {
              left: `${mote.position.x}%`,
              top: `${mote.position.y}%`,
              width: '2px',
              height: '2px',
              animationDuration: `${mote.driftDurationMs}ms`,
              animationDelay: `${index * -13}s`,
              '--mote-max-opacity': mote.maxOpacity,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
