import { readJSON, writeJSON } from '@shared-kernel/storage/localStorage'
import { PHRASES } from './phrases'

/**
 * Gobierna cuándo el módulo Hoy puede romper el silencio — ver Manifiesto,
 * sección "El módulo Hoy". Silencio es el estado por defecto, no la excepción:
 *
 * - Nunca menos de MIN_SILENCE_DAYS entre una frase y la siguiente.
 * - Aun cumplido ese mínimo, solo se muestra con SHOW_PROBABILITY de chance.
 * - Ninguna frase se repite antes de que el resto del repertorio se haya usado.
 * - La decisión de cada día se cachea: volver a abrir Hoy el mismo día
 *   siempre devuelve lo mismo, en vez de tirar los dados de nuevo.
 * - La primera vez que se abre la aplicación, el silencio no tendría sentido
 *   todavía — se muestra una única frase para abrir el ciclo de rotación.
 */
const MIN_SILENCE_DAYS = 4
const SHOW_PROBABILITY = 0.45

interface PhraseState {
  lastShownAt: string | null
  usedIndices: number[]
  lastDecisionDate: string | null
  lastDecisionPhrase: string | null
}

const DEFAULT_STATE: PhraseState = {
  lastShownAt: null,
  usedIndices: [],
  lastDecisionDate: null,
  lastDecisionPhrase: null,
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime())
  return ms / (1000 * 60 * 60 * 24)
}

function pickIndex(usedIndices: number[]): { index: number; nextUsed: number[] } {
  let available = PHRASES.map((_, i) => i).filter((i) => !usedIndices.includes(i))
  let cycleReset = false
  if (available.length === 0) {
    available = PHRASES.map((_, i) => i)
    cycleReset = true
  }
  const index = available[Math.floor(Math.random() * available.length)] ?? 0
  const nextUsed = cycleReset ? [index] : [...usedIndices, index]
  return { index, nextUsed }
}

/** Devuelve la frase de hoy, o `null` si hoy toca silencio. Idempotente dentro del mismo día. */
export function getTodaysPhrase(now: Date = new Date()): string | null {
  const state = readJSON<PhraseState>('phrase.state', DEFAULT_STATE)
  const today = dateKey(now)

  if (state.lastDecisionDate === today) {
    return state.lastDecisionPhrase
  }

  if (state.lastShownAt === null) {
    const opening = PHRASES[0] ?? ''
    writeJSON<PhraseState>('phrase.state', {
      lastShownAt: now.toISOString(),
      usedIndices: [0],
      lastDecisionDate: today,
      lastDecisionPhrase: opening,
    })
    return opening
  }

  const daysSinceLast = daysBetween(now, new Date(state.lastShownAt))
  const eligible = daysSinceLast >= MIN_SILENCE_DAYS && Math.random() <= SHOW_PROBABILITY

  if (!eligible) {
    writeJSON<PhraseState>('phrase.state', { ...state, lastDecisionDate: today, lastDecisionPhrase: null })
    return null
  }

  const { index, nextUsed } = pickIndex(state.usedIndices)
  const phrase = PHRASES[index] ?? null
  writeJSON<PhraseState>('phrase.state', {
    lastShownAt: now.toISOString(),
    usedIndices: nextUsed,
    lastDecisionDate: today,
    lastDecisionPhrase: phrase,
  })
  return phrase
}
