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
  windowOpacity: 0.45,
  lampOpacity: 0.2,
}

const TARDE: CoreLightState = {
  canvas: 'rgb(22 19 15)',
  surface: 'rgb(31 25 20)',
  surfaceAlt: 'rgb(40 32 26)',
  windowOpacity: 0.62,
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
