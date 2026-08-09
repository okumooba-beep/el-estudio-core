import { getTodaysPhrase } from '@world/phrases/phraseEngine'
import { readJSON, writeJSON } from '@shared-kernel/storage/localStorage'
import type { Idea } from '@/types/idea'

export type VoiceSource = 'memoria' | 'sabiduria' | 'estudio' | 'frase'

export interface VoiceEntry {
  source: VoiceSource
  text: string
}

/**
 * Jerarquía de voz de Hoy — nunca se salta un nivel ni se muestran dos a
 * la vez: Memoria Viva > Biblioteca de Sabiduría > Estado del Estudio >
 * Frase del Manifiesto > Silencio. El silencio es el estado más
 * frecuente por diseño, no un hueco sin terminar.
 *
 * "La IA nunca enseña. La IA recuerda." Ningún nivel de esta jerarquía
 * puede convertirse en un componente que redacte consejos: Memoria Viva
 * solo puede devolver evidencia textual que el propio usuario escribió,
 * y Biblioteca de Sabiduría solo ideas propias ya confirmadas por la
 * vida real. Si algún día alguien conecta aquí un texto generado que
 * "aconseja", está rompiendo la arquitectura, no extendiéndola.
 */
export function resolveVoice(ideas: readonly Idea[], now: Date = new Date()): VoiceEntry | null {
  return getMemoriaViva() ?? getSabiduria(ideas, now) ?? getEstudioSignal(ideas, now) ?? getFraseEntry(now)
}

/**
 * Memoria Viva todavía no existe (ver src/features/memoria/MemoryLayer.tsx).
 * Este es el punto exacto donde se conectará: siempre gana sobre la Frase
 * y la Biblioteca en cuanto tenga algo real que mostrar.
 */
function getMemoriaViva(): VoiceEntry | null {
  return null
}

interface FraseVivaState {
  dayKey: string | null
  usedIds: string[]
  lastId: string | null
}

const FRASE_VIVA_DEFAULT: FraseVivaState = { dayKey: null, usedIds: [], lastId: null }

function pickFraseId(ids: readonly string[], usedIds: readonly string[]): { id: string; nextUsed: string[] } {
  let available = ids.filter((id) => !usedIds.includes(id))
  let cycleReset = false
  if (available.length === 0) {
    available = [...ids]
    cycleReset = true
  }
  const id = available[Math.floor(Math.random() * available.length)] ?? ids[0]!
  const nextUsed = cycleReset ? [id] : [...usedIds, id]
  return { id, nextUsed }
}

/**
 * Sprint 010 — Auditoría UX v1, punto 4: Biblioteca de Sabiduría deja
 * de leer la lista estática QUOTES (desconectada de lo que el usuario
 * realmente guarda) y pasa a leer la Biblioteca real
 * (ideas con destino 'biblioteca', la misma fuente que FrasesScreen).
 * `null` cuando la Biblioteca está vacía — mismo contrato que Memoria
 * Viva. Rotación estable por día (no por tramo de horas como
 * quoteEngine.ts): la frase elegida no cambia hasta el primer Hoy del
 * día siguiente, nunca al azar en cada apertura. "La IA nunca enseña.
 * La IA recuerda": esto nunca redacta nada, solo repite una frase que
 * el usuario ya escribió/guardó.
 */
function getSabiduria(ideas: readonly Idea[], now: Date): VoiceEntry | null {
  const frases = ideas.filter((idea) => idea.destino === 'biblioteca')
  if (frases.length === 0) return null

  const dayKey = now.toISOString().slice(0, 10)
  const state = readJSON<FraseVivaState>('frase-viva.state', FRASE_VIVA_DEFAULT)
  const ids = frases.map((idea) => idea.id)
  const usedIds = state.dayKey === dayKey ? state.usedIds : []

  if (state.dayKey === dayKey && state.lastId && ids.includes(state.lastId)) {
    const cached = frases.find((idea) => idea.id === state.lastId)
    if (cached) return { source: 'sabiduria', text: cached.texto }
  }

  const { id, nextUsed } = pickFraseId(ids, usedIds)
  writeJSON<FraseVivaState>('frase-viva.state', { dayKey, usedIds: nextUsed, lastId: id })
  const chosen = frases.find((idea) => idea.id === id)
  return chosen ? { source: 'sabiduria', text: chosen.texto } : null
}

const DIAS_SIN_ESCRIBIR = 3

/**
 * Sprint 3.3, tarea 2: antes de caer en la rotación del Manifiesto, el
 * Estudio primero mira su propio estado real — sin IA, sin motor nuevo,
 * solo reglas simples evaluadas en orden. La primera que aplica gana.
 */
function getEstudioSignal(ideas: readonly Idea[], now: Date): VoiceEntry | null {
  if (ideas.length === 0) return null

  const hoy = now.toISOString().slice(0, 10)
  const ayer = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10)

  if (ideas.some((idea) => idea.destino === 'hoy')) {
    return { source: 'estudio', text: 'Hay una idea esperando un hogar.' }
  }

  const completadasAyer = ideas.filter(
    (idea) => idea.destino === 'misiones' && idea.estado === 'terminada' && idea.updatedAt.slice(0, 10) === ayer,
  ).length
  if (completadasAyer > 0) {
    return {
      source: 'estudio',
      text: `Ayer completaste ${completadasAyer} misi${completadasAyer === 1 ? 'ón' : 'ones'}.`,
    }
  }

  const ultimaEscritura = ideas.reduce((latest, idea) => (idea.createdAt > latest ? idea.createdAt : latest), '')
  const diasSinEscribir = Math.floor((now.getTime() - new Date(ultimaEscritura).getTime()) / 86_400_000)
  if (diasSinEscribir >= DIAS_SIN_ESCRIBIR) {
    return { source: 'estudio', text: 'Hace días que no escribes.' }
  }

  if (!ideas.some((idea) => idea.fecha === hoy)) {
    return { source: 'estudio', text: 'Hoy el Estudio está en silencio.' }
  }

  return null
}

function getFraseEntry(now: Date): VoiceEntry | null {
  const phrase = getTodaysPhrase(now)
  return phrase ? { source: 'frase', text: phrase } : null
}
