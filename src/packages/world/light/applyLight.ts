import { computeLight } from './lightEngine'

/**
 * Escribe el estado de la luz directamente como propiedades CSS en :root.
 * Se llama una vez antes del primer paint (ver src/light-bootstrap.ts, para
 * que la habitación nazca ya con la luz correcta) y luego cada minuto.
 *
 * También corrige el <meta name="theme-color">: en un teléfono instalado,
 * la barra de estado es parte de la habitación, no del navegador — debe
 * seguir el mismo color real que el resto del lugar, nunca quedar fija.
 */
export function applyLight(date: Date = new Date()): void {
  const state = computeLight(date)
  const root = document.documentElement.style
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', state.canvas)
  root.setProperty('--canvas', state.canvas)
  root.setProperty('--surface', state.surface)
  root.setProperty('--surface-2', state.surfaceAlt)
  root.setProperty('--ink', state.ink)
  root.setProperty('--ink-dim', state.inkDim)
  root.setProperty('--ink-faint', state.inkFaint)
  root.setProperty('--border', state.border)
  root.setProperty('--accent', state.accent)
  root.setProperty('--accent-soft', state.accentSoft)
  root.setProperty('--good', state.good)
  root.setProperty('--warn', state.warn)
  root.setProperty('--critical', state.critical)
  root.setProperty('--window-opacity', String(state.windowOpacity))
  root.setProperty('--lamp-opacity', String(state.lampOpacity))
}
