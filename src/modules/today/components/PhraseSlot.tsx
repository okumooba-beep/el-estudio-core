import { useMemo } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { resolveVoice } from '@/lib/voice/voiceEngine'

/**
 * El silencio es el resultado más frecuente de resolveVoice(), no un caso
 * de error: cuando no hay nada que mostrar, este componente no renderiza
 * nada — ni un espacio vacío reservado, ni un placeholder.
 *
 * Sprint 018 ("Home: recuperar el lugar"): esta frase y la de FraseHoy
 * (la lectura determinista del día) compartían tipografía idéntica —
 * mismo tamaño, mismo color, casi pegadas — y se leían como una sola
 * oración partida en dos líneas en vez de dos voces distintas. Acá se
 * marca como la voz ambiental (itálica, un escalón más chica, --ink-faint
 * en vez de --ink-dim, el tono más apagado que ya usa el resto de la app
 * para texto secundario) para que FraseHoy quede como la lectura
 * funcional y legible del día.
 *
 * Sprint 021 ("Frase ambiental — sacarla del flujo funcional"): ahora vive
 * al cierre de HoyScreen, no pegada al saludo. Centrada (en vez de alineada
 * a la izquierda como todo el contenido funcional) y con más aire arriba
 * (mt-4 propio, encima del gap-10 del contenedor) para que se lea como una
 * presencia aparte del último bloque funcional (Atención), no como su
 * continuación. Sigue sin card, sin borde, sin fondo, sin ícono — el mismo
 * texto suelto de siempre, solo con otra relación espacial con Home.
 */
export function PhraseSlot() {
  const { ideas } = useIdeas()
  const entry = useMemo(() => resolveVoice(ideas), [ideas])
  if (!entry) return null

  return (
    <p className="mx-auto mt-4 max-w-[32ch] text-center text-[13px] italic leading-relaxed text-ink-faint">
      {entry.text}
    </p>
  )
}
