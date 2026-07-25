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
 */
export function MisionPrincipal() {
  const { ideas, ready } = useIdeas()
  const navigate = useNavigate()

  const principal = useMemo(() => {
    const pendientes = ideas.filter((idea) => idea.destino === 'misiones' && idea.estado !== 'terminada')
    if (pendientes.length === 0) return null
    return [...pendientes].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]
  }, [ideas])

  return (
    <section className="pb-6">
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
        Lo que más importa hoy
      </h2>
      {principal ? (
        <button
          type="button"
          onClick={() => navigate('/misiones')}
          className="group block w-full appearance-none border-0 bg-transparent p-0 text-left"
        >
          <p className="line-clamp-2 text-[15px] text-ink-dim transition-colors duration-150 group-hover:text-ink group-active:text-ink">
            {principal.texto}
          </p>
          <p className="mt-1 text-[13.5px] text-ink-faint">
            Es lo que espera hace más tiempo — desde {describeDay(principal.fecha)}
          </p>
        </button>
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
