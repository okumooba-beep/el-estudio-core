import { useNavigate } from 'react-router-dom'
import type { ProximoAgenda } from '@modules/agenda/public'

interface ProximoProps {
  proximo: ProximoAgenda | null
  ready: boolean
}

/**
 * Sprint 015 ("Home como eje del día"), punto 4/9: el próximo ítem
 * temporal (Evento, Bloque o Misión programada), mismo orden que ya usa
 * la vista diaria de Agenda (`proximoItem`, agrupar.ts) — nunca un
 * criterio nuevo. Sin ítem: no se renderiza nada (punto 2).
 */
export function Proximo({ proximo, ready }: ProximoProps) {
  const navigate = useNavigate()
  if (!ready || !proximo) return null

  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Próximo</h2>
      <button
        type="button"
        onClick={() => navigate(proximo.path)}
        className="group block w-full appearance-none border-0 bg-transparent p-0 text-left"
      >
        <p className="line-clamp-2 text-[15px] text-ink-dim transition-colors duration-150 group-hover:text-ink group-active:text-ink">
          {proximo.texto}
          {proximo.hora ? ` · ${proximo.hora}` : ''}
        </p>
        {proximo.conflictoTexto && (
          <p className="mt-1 text-[13.5px] text-ink-faint">⚠ Conflicto con {proximo.conflictoTexto}</p>
        )}
      </button>
    </section>
  )
}
