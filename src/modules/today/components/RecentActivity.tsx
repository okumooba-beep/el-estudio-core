import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIdeas } from '@modules/work-table/public'
import { describeDay } from '@shared-kernel/date/describeDay'
import { DESTINO_TO_SPACE } from './spaceRegistry'

/**
 * Build Core V1 — "Actividad reciente": no es una bitácora nueva, es
 * `Idea.history` (nunca se borra, ver src/types/idea.ts) leído desde
 * afuera por primera vez. Se describe con el destino ACTUAL de la Idea
 * (nunca hace falta traducir cada `furniture` histórico: mueble actual
 * y destino actual ya son el mismo par, ver destinoFurniture.ts) y el
 * verbo del último evento — "se creó" o "se movió". Ordenado por
 * `updatedAt`, no por la fecha del historial (menos preciso). Muestra
 * como mucho 4: esto es un vistazo, nunca un registro completo.
 */
const LIMITE = 4

export function RecentActivity() {
  const { ideas } = useIdeas()
  const navigate = useNavigate()

  const recientes = useMemo(() => {
    return ideas
      .filter((idea) => idea.destino !== 'hoy' && idea.destino !== 'archivo' && idea.history.length > 0)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, LIMITE)
  }, [ideas])

  if (recientes.length === 0) return null

  return (
    <section className="pb-6">
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-faint">Actividad reciente</h2>
      <ul className="flex flex-col divide-y divide-border/40 border-t border-border/40">
        {recientes.map((idea) => {
          const espacio = DESTINO_TO_SPACE[idea.destino]
          if (!espacio) return null
          const ultimoEvento = idea.history[idea.history.length - 1]
          const verbo = ultimoEvento?.evento === 'movida' ? 'se movió a' : 'llegó a'
          return (
            <li key={idea.id}>
              <button
                type="button"
                onClick={() => navigate(espacio.path)}
                className="group block w-full appearance-none border-0 bg-transparent py-3 text-left"
              >
                <p className="line-clamp-1 text-[15px] text-ink-dim transition-colors duration-150 group-hover:text-ink group-active:text-ink">
                  {idea.texto}
                </p>
                <p className="mt-1 text-[13.5px] text-ink-faint">
                  {verbo} {espacio.label} · {describeDay(idea.updatedAt.slice(0, 10))}
                </p>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
