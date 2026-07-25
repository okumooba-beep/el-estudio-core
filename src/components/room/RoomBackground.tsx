import { AmbientParticles } from './AmbientParticles'
import { AmbientEventBridge } from './AmbientEventBridge'

/**
 * La habitación detrás de todo. Nunca un fondo plano: una ventana fría,
 * una lámpara cálida y la luz ambiental de --canvas conviven siempre;
 * lo único que cambia a lo largo del día es cuánto pesa cada una.
 *
 * Las tres capas fijas (ventana, lámpara, grano) ya viven como HTML
 * estático en index.html, no acá — para que la habitación esté pintada
 * antes de que React monte nada (Sprint "Arrival"). Este componente solo
 * aporta lo que sí necesita JS: el polvo suspendido en el aire y (Sprint
 * "Ambient Life Engine v1.0") el puente que traduce cualquier animación
 * ambiente de la habitación a un evento de mundo con nombre.
 */
export function RoomBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <AmbientParticles />
      <AmbientEventBridge />
    </div>
  )
}
