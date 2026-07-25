import { readJSON, writeJSON } from '@shared-kernel/storage/localStorage'
import type { Destino } from './rules'

const KEY = 'comprehension-memory'

type Memoria = Record<string, Destino>

/**
 * Aprendizaje local (Sprint 2.1, punto 04): nunca IA, nunca
 * entrenamiento — solo una preferencia que este usuario ya expresó una
 * vez, guardada en este dispositivo. Se indexa por el texto exacto de
 * la idea (normalizado), no por palabra clave: una corrección sobre
 * "comprar café" no debería opinar sobre "comprar un regalo" — eso
 * sería la IA adivinando de más, no aprendiendo lo que el usuario
 * realmente corrigió. Nunca sale de localStorage.
 */
export function getLearnedDestino(textoNormalizado: string): Destino | null {
  const memoria = readJSON<Memoria>(KEY, {})
  return memoria[textoNormalizado] ?? null
}

export function learnCorrection(textoNormalizado: string, destino: Destino): void {
  const memoria = readJSON<Memoria>(KEY, {})
  memoria[textoNormalizado] = destino
  writeJSON(KEY, memoria)
}
