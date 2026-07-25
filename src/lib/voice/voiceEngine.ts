import { getTodaysPhrase } from '@world/phrases/phraseEngine'
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
  return getMemoriaViva() ?? getSabiduria() ?? getEstudioSignal(ideas, now) ?? getFraseEntry(now)
}

/**
 * Memoria Viva todavía no existe (ver src/features/memoria/MemoryLayer.tsx).
 * Este es el punto exacto donde se conectará: siempre gana sobre la Frase
 * y la Biblioteca en cuanto tenga algo real que mostrar.
 */
function getMemoriaViva(): VoiceEntry | null {
  return null
}

/** Biblioteca de Sabiduría todavía no existe. Mismo contrato que Memoria Viva. */
function getSabiduria(): VoiceEntry | null {
  return null
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
