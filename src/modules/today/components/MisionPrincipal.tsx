import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIdeas } from '@modules/work-table/public'
import { describeDay } from '@shared-kernel/date/describeDay'

/**
 * Sprint "One Room": esta sección no usa EmptyState (ver
 * src/components/ui/EmptyState.tsx) — esa tarjeta centrada y con
 * padding grande es correcta para una pantalla entera todavía sin
 * construir (Trading, Hábitos, Diario, ModulePlaceholder), pero acá
 * vive dentro del escritorio mismo, al lado de la libreta y la
 * propuesta de Idea. El resto del escritorio nunca encierra su texto
 * en una caja centrada, así que esta sección tampoco lo hace.
 *
 * Sprint "Build Today": deja de ser texto fijo. La misión principal es
 * la misión pendiente que más tiempo lleva esperando (mismo campo
 * `estado`/`createdAt` que ya usa el Tablero de Misiones — ver
 * MisionesScreen.tsx — nunca un score de prioridad nuevo, ninguna
 * badge). Se ordena al revés que el Tablero a propósito: el Tablero
 * muestra lo más reciente arriba, acá arriba va lo que espera hace más
 * tiempo, porque eso es lo que hoy merece atención. Tocarla lleva al
 * Tablero (mismo gesto que Libreta.tsx usa para el Diario): marcar
 * terminada o editar ya vive ahí, Hoy solo señala, nunca duplica esa
 * lógica.
 *
 * Core V3 — "quitar duplicación": si la única misión pendiente es la
 * misma Idea que ya se muestra en "Seguir con esto" (`excludeId`, que
 * viene de `selectContinueWorking` en HoyScreen), acá no se repite el
 * mismo texto en dos bloques seguidos. Distingue dos casos de "sin
 * principal": cero misiones pendientes en absoluto (muestra el mismo
 * estado vacío de siempre, con su guía) versus la única pendiente ya
 * visible arriba (no muestra nada — nunca un "no hay nada" cuando sí
 * hay algo, solo que ya se contó).
 *
 * Threshold Experience V1 — "completar sin salir del Core": el punto
 * discreto es el mismo `.habito-punto` que ya usa HabitsGlance para
 * marcar un hábito de hoy sin ir al Tablero — acá alterna el mismo
 * campo `estado` que MisionesScreen ya usa (`handleTerminada`), mismo
 * `update` optimista de useIdeas (ver useIdeas.ts): el cambio se ve al
 * instante, sin esperar confirmación de IndexedDB.
 */
interface MisionPrincipalProps {
  excludeId?: string | null
}

export function MisionPrincipal({ excludeId }: MisionPrincipalProps) {
  const { ideas, ready, update } = useIdeas()
  const navigate = useNavigate()

  const pendientes = useMemo(
    () => ideas.filter((idea) => idea.destino === 'misiones' && idea.estado !== 'terminada'),
    [ideas],
  )
  const principal = useMemo(() => {
    const disponibles = pendientes.filter((idea) => idea.id !== excludeId)
    if (disponibles.length === 0) return null
    return [...disponibles].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0] ?? null
  }, [pendientes, excludeId])

  const yaVisibleArriba = !principal && pendientes.length > 0
  if (yaVisibleArriba) return null

  return (
    <section className="pb-6">
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-accent">
        Lo que más importa hoy
      </h2>
      {principal ? (
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={() => update(principal.id, { estado: 'terminada' })}
            aria-label="Marcar terminada"
            className="habito-punto mt-0.5"
          >
            <span aria-hidden="true">○</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/misiones')}
            className="group block min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-left"
          >
            <p className="line-clamp-2 text-[15px] text-ink-dim transition-colors duration-150 group-hover:text-ink group-active:text-ink">
              {principal.texto}
            </p>
            <p className="mt-1 text-[13.5px] text-ink-faint">
              Es lo que espera hace más tiempo — desde {describeDay(principal.fecha)}
            </p>
          </button>
        </div>
      ) : ready ? (
        <>
          <p className="text-[15px] text-ink-dim">Ninguna misión está esperando.</p>
          <p className="mt-1 max-w-[38ch] text-[13.5px] text-ink-faint">
            Guardá una idea y elegí Misiones para que aparezca acá.
          </p>
        </>
      ) : null}
    </section>
  )
}
