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
 *
 * Sprint 018 ("Home: recuperar el lugar"): esta frase y la de FraseHoy
 * (la lectura determinista del día) compartían tipografía idéntica —
 * mismo tamaño, mismo color, casi pegadas — y se leían como una sola
 * oración partida en dos líneas en vez de dos voces distintas. Acá se
 * marca como la voz ambiental (itálica, un escalón más chica, --ink-faint
 * en vez de --ink-dim, el tono más apagado que ya usa el resto de la app
 * para texto secundario) para que FraseHoy — sin cambios acá — quede
 * como la lectura funcional y legible del día.
 */
export function PhraseSlot() {
  const { ideas } = useIdeas()
  const entry = useMemo(() => resolveVoice(ideas), [ideas])
  if (!entry) return null

  return <p className="mt-3 max-w-[38ch] text-[13px] italic text-ink-faint">{entry.text}</p>
}
