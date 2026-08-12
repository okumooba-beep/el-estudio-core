import { useNavigate } from 'react-router-dom'
import type { Idea } from '@/types/idea'

const MAX_HOME = 3

interface MisionesPrincipalesProps {
  misiones: Idea[]
}

/**
 * Sprint 015 ("Home como eje del día"), punto 5: hasta 3 misiones
 * principales (programadas para hoy o mañana — misma lógica que
 * MisionesScreen, ver missions/seleccionarPrincipales.ts). Nunca la
 * lista completa: tocar una lleva a Misiones, que es la salida
 * explícita hacia el resto. Sin misiones principales: no se renderiza
 * nada (punto 10.F) — MisionPrincipal.tsx (single-misión, otra lógica)
 * queda sin usar, mismo criterio que otros componentes ya retirados de
 * Hoy.
 */
export function MisionesPrincipales({ misiones }: MisionesPrincipalesProps) {
  const navigate = useNavigate()
  if (misiones.length === 0) return null

  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Misión principal</h2>
      <ul className="flex flex-col gap-1.5">
        {misiones.slice(0, MAX_HOME).map((mision) => (
          <li key={mision.id}>
            <button
              type="button"
              onClick={() => navigate('/misiones')}
              className="group block w-full appearance-none border-0 bg-transparent p-0 text-left"
            >
              <p className="line-clamp-2 text-[15px] text-ink-dim transition-colors duration-150 group-hover:text-ink group-active:text-ink">
                {mision.texto}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
