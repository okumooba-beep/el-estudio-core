export interface CoreLightState {
  canvas: string
  surface: string
  surfaceAlt: string
  windowOpacity: number
  lampOpacity: number
}

export type CoreLightPhase = 'manana' | 'tarde' | 'noche'

/**
 * Motor de luz de El Estudio Core: solo la atmósfera del cuarto (canvas,
 * superficies, ventana, lámpara). A diferencia de lightEngine.ts —que
 * queda reservado para la futura experiencia North Star—, acá no hay
 * interpolación continua ni dependencia del minuto exacto: tres estados
 * fijos, y el cuarto salta de uno a otro. Los tokens de texto/borde/acento
 * viven una sola vez en src/index.css y este motor nunca los toca, para
 * que la legibilidad de la interfaz no dependa de la hora.
 */
const NOCHE: CoreLightState = {
  canvas: 'rgb(18 15 12)',
  surface: 'rgb(27 22 18)',
  surfaceAlt: 'rgb(36 29 23)',
  windowOpacity: 0.08,
  lampOpacity: 0.39,
}

const MANANA: CoreLightState = {
  canvas: 'rgb(20 17 14)',
  surface: 'rgb(29 24 20)',
  surfaceAlt: 'rgb(38 31 25)',
  // Sprint 036: 0.45 → 0.38. La escena se lavaba de día (demasiado
  // resplandor frío de ventana, poco calor de lámpara) — mismo lever que
  // ya usaron Sprint "Framing the Studio"/"Threshold Experience V1"/
  // Sprint 020 en .room-layer-window (nunca --window-opacity en sí),
  // acá se retoca el valor fuente en vez del multiplicador porque es el
  // propio motor de luz, no un ajuste de contraste de un layer puntual.
  windowOpacity: 0.38,
  lampOpacity: 0.2,
}

const TARDE: CoreLightState = {
  canvas: 'rgb(22 19 15)',
  surface: 'rgb(31 25 20)',
  surfaceAlt: 'rgb(40 32 26)',
  // Sprint 036: 0.62 → 0.5, mismo motivo que MANANA arriba — era la fase
  // más brillante de las tres por lejos, y la que más "lavaba" el bosque
  // real de .room-layer-photo. Sigue siendo la fase más clara del día
  // (nunca se congela a un solo estado), solo con menos intensidad.
  windowOpacity: 0.5,
  lampOpacity: 0.1,
}

export function coreLightPhaseAt(date: Date): CoreLightPhase {
  const hour = date.getHours()
  if (hour >= 6 && hour < 12) return 'manana'
  if (hour >= 12 && hour < 19) return 'tarde'
  return 'noche'
}

export function computeCoreLight(date: Date = new Date()): CoreLightState {
  const phase = coreLightPhaseAt(date)
  if (phase === 'manana') return MANANA
  if (phase === 'tarde') return TARDE
  return NOCHE
}
