import { useNavigate } from 'react-router-dom'
import { describeDay } from '@shared-kernel/date/describeDay'
import { DESTINO_TO_SPACE } from './spaceRegistry'
import type { Idea } from '@/types/idea'

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
 *
 * Core V3 — la selección se exporta como función pura (`selectContinueWorking`)
 * y `HoyScreen` pasa a ser quien la llama, en vez de este componente
 * llamarla por su cuenta: así `HoyScreen` conoce el mismo id que acá se
 * elige, y puede excluirlo de Misión Principal (ver MisionPrincipal.tsx)
 * sin duplicar el criterio de selección en dos archivos — un solo lugar
 * decide "qué es lo que se está continuando".
 */
export function selectContinueWorking(ideas: readonly Idea[]): Idea | null {
  const candidatas = ideas.filter(
    (idea) => idea.destino !== 'hoy' && idea.destino !== 'archivo' && idea.estado !== 'terminada',
  )
  if (candidatas.length === 0) return null
  return [...candidatas].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
}

function fraseContinuar(dia: string): string {
  if (dia === 'hoy') return 'Hoy volviste a esto'
  if (dia === 'ayer') return 'Ayer estabas pensando en esto'
  return `Estabas en esto ${dia}`
}

interface ContinueWorkingProps {
  activa: Idea | null
}

export function ContinueWorking({ activa }: ContinueWorkingProps) {
  const navigate = useNavigate()

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
