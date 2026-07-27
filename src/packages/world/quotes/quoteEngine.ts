import { readJSON, writeJSON } from '@shared-kernel/storage/localStorage'
import { QUOTES, type Quote } from './quotes'

/**
 * Threshold Experience V1 — a diferencia de phraseEngine.ts (que decide
 * cuándo romper el silencio, con MIN_SILENCE_DAYS/SHOW_PROBABILITY: el
 * Manifiesto calla casi siempre a propósito), esta rotación no vela
 * silencio: el brief pide variación "según la hora del día o cada pocas
 * horas". BUCKET_HOURS=4 (6 tramos por día) es la unidad mínima de
 * cambio — dentro del mismo tramo, reabrir el Estudio devuelve la misma
 * frase (idempotente), igual que ya hace phraseEngine por día.
 *
 * No-repetición (mismo truco que pickIndex en phraseEngine.ts): ninguna
 * frase vuelve a salir antes de que el resto del repertorio ya se haya
 * mostrado una vez.
 */
const BUCKET_HOURS = 4

interface QuoteState {
  bucketKey: string | null
  usedIndices: number[]
  lastIndex: number | null
}

const DEFAULT_STATE: QuoteState = { bucketKey: null, usedIndices: [], lastIndex: null }

function bucketKey(now: Date): string {
  const day = now.toISOString().slice(0, 10)
  const tramo = Math.floor(now.getHours() / BUCKET_HOURS)
  return `${day}-${tramo}`
}

function pickIndex(usedIndices: readonly number[]): { index: number; nextUsed: number[] } {
  let available = QUOTES.map((_, i) => i).filter((i) => !usedIndices.includes(i))
  let cycleReset = false
  if (available.length === 0) {
    available = QUOTES.map((_, i) => i)
    cycleReset = true
  }
  const index = available[Math.floor(Math.random() * available.length)] ?? 0
  const nextUsed = cycleReset ? [index] : [...usedIndices, index]
  return { index, nextUsed }
}

/**
 * Devuelve la frase que le toca a este tramo del día, o `null` si
 * `QUOTES` todavía está vacío (ver quotes.ts) — nunca un texto
 * fabricado como reemplazo.
 */
export function getCurrentQuote(now: Date = new Date()): Quote | null {
  if (QUOTES.length === 0) return null

  const key = bucketKey(now)
  const state = readJSON<QuoteState>('quote.state', DEFAULT_STATE)

  if (state.bucketKey === key && state.lastIndex !== null) {
    const cached = QUOTES[state.lastIndex]
    if (cached) return cached
  }

  const { index, nextUsed } = pickIndex(state.usedIndices)
  writeJSON<QuoteState>('quote.state', { bucketKey: key, usedIndices: nextUsed, lastIndex: index })
  return QUOTES[index] ?? null
}
