import { computeCoreLight } from './coreLightEngine'

/**
 * Escribe el estado de la luz de la habitación (Core) como propiedades CSS
 * en :root. Se llama una vez antes del primer paint (ver
 * src/light-bootstrap.ts, para que la habitación nazca ya con la luz
 * correcta) y luego cada minuto.
 *
 * Solo la atmósfera del cuarto (canvas, superficies, ventana, lámpara).
 * Los tokens de texto/borde/acento se definen una sola vez en
 * src/index.css y no se escriben acá — la legibilidad de la interfaz no
 * depende de la hora. El motor completo con esos tokens dinámicos
 * (lightEngine.ts) queda reservado para la futura experiencia North Star.
 *
 * También corrige el <meta name="theme-color">: en un teléfono instalado,
 * la barra de estado es parte de la habitación, no del navegador — debe
 * seguir el mismo color real que el resto del lugar, nunca quedar fija.
 */
export function applyLight(date: Date = new Date()): void {
  const state = computeCoreLight(date)
  const root = document.documentElement.style
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', state.canvas)
  root.setProperty('--canvas', state.canvas)
  root.setProperty('--surface', state.surface)
  root.setProperty('--surface-2', state.surfaceAlt)
  root.setProperty('--window-opacity', String(state.windowOpacity))
  root.setProperty('--lamp-opacity', String(state.lampOpacity))
}
