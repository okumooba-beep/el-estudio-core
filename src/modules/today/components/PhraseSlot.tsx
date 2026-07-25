import { useMemo } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { resolveVoice } from '@/lib/voice/voiceEngine'

/**
 * El silencio es el resultado más frecuente de resolveVoice(), no un caso
 * de error: cuando no hay nada que mostrar, este componente no renderiza
 * nada — ni un espacio vacío reservado, ni un placeholder.
 *
 * Build Core V1: deja de ser una cita centrada flotando sola y pasa a
 * leerse como parte del mismo bloque que el saludo — texto a la
 * izquierda, pegado a la fecha, la misma voz ambiental de siempre, solo
 * menos separada de quien la dice.
 */
export function PhraseSlot() {
  const { ideas } = useIdeas()
  const entry = useMemo(() => resolveVoice(ideas), [ideas])
  if (!entry) return null

  return <p className="mt-3 max-w-[38ch] text-[15px] text-ink-dim">{entry.text}</p>
}
