import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIdeas } from '@modules/work-table/public'
import { describeDay } from '@shared-kernel/date/describeDay'
import { DESTINO_TO_SPACE } from './spaceRegistry'

/**
 * Build Core V1 — "Continuar trabajando": la Idea con `updatedAt` más
 * reciente entre los destinos reales (nunca 'hoy', que ya se ve en el
 * Umbral, ni 'archivo', que no tiene pantalla propia), sin importar qué
 * tan vieja sea — a diferencia de Misión Principal (que ordena al
 * revés, por lo que más tiempo espera), esto señala lo último que se
 * tocó. Mismo campo que ya usa moveSheet/update, ningún dato nuevo.
 *
 * Core V2 — la etiqueta deja de ser un rótulo fijo ("Seguir con esto")
 * y pasa a describir el mismo dato de siempre (`describeDay` sobre
 * `updatedAt`, igual que ya hace RecentActivity) como una frase en
 * primera persona. Nunca inventa un día: si `describeDay` dice "hoy",
 * la frase dice "hoy"; si dice "el 2026-07-20", la frase lo cita tal
 * cual, igual que ya hacía la versión anterior.
 */
function fraseContinuar(dia: string): string {
  if (dia === 'hoy') return 'Hoy volviste a esto'
  if (dia === 'ayer') return 'Ayer estabas pensando en esto'
  return `Estabas en esto ${dia}`
}

export function ContinueWorking() {
  const { ideas } = useIdeas()
  const navigate = useNavigate()

  const activa = useMemo(() => {
    const candidatas = ideas.filter(
      (idea) => idea.destino !== 'hoy' && idea.destino !== 'archivo' && idea.estado !== 'terminada',
    )
    if (candidatas.length === 0) return null
    return [...candidatas].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  }, [ideas])

  const espacio = activa ? DESTINO_TO_SPACE[activa.destino] : undefined
  if (!activa || !espacio) return null

  return (
    <section>
      <button
        type="button"
        onClick={() => navigate(espacio.path)}
        className="group block w-full appearance-none border-0 bg-transparent p-0 text-left"
      >
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          {fraseContinuar(describeDay(activa.updatedAt.slice(0, 10)))}
        </p>
        <p className="mt-1.5 line-clamp-2 text-[17px] text-ink-dim transition-colors duration-150 group-hover:text-ink group-active:text-ink">
          {activa.texto}
        </p>
        <p className="mt-1 text-[13.5px] text-ink-faint">{espacio.label}</p>
      </button>
    </section>
  )
}
