export type Season = 'invierno' | 'primavera' | 'verano' | 'otono'

export interface SeasonalLightModifier {
  colorTemperatureShift: number
  dayLengthShift: number
  intensityShift: number
}

/**
 * La habitación no solo responde a la hora del día — algún día también
 * a la estación del año. Nunca con decoración: con temperatura de color,
 * duración del día e intensidad (ver src/packages/world/light/lightEngine.ts).
 *
 * No implementado todavía: computeLight no llama a nada de este archivo
 * todavía. getSeason ya calcula una estación real a partir de una fecha
 * (no hay ambigüedad ahí); getSeasonalModifier es el punto de enganche
 * reservado para cuando eso deba afectar la luz — hoy siempre neutro,
 * para no cambiar el comportamiento actual.
 *
 * Estaciones del hemisferio norte por convención meteorológica; si el
 * proyecto necesita el hemisferio sur, este es el único lugar que
 * tendría que cambiar.
 */
export function getSeason(date: Date): Season {
  const month = date.getMonth()
  if (month === 11 || month === 0 || month === 1) return 'invierno'
  if (month >= 2 && month <= 4) return 'primavera'
  if (month >= 5 && month <= 7) return 'verano'
  return 'otono'
}

export function getSeasonalModifier(_season: Season): SeasonalLightModifier {
  return { colorTemperatureShift: 0, dayLengthShift: 0, intensityShift: 0 }
}
