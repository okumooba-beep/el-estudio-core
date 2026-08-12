import { useNavigate } from 'react-router-dom'
import type { ProximoAgenda } from '@modules/agenda/public'
import { formatearHora12 } from '@shared-kernel/text/interpretarTexto'

interface ProximoProps {
  ahora: ProximoAgenda | null
  proximo: ProximoAgenda | null
  ready: boolean
}

/**
 * Sprint 015 ("Home como eje del día"), punto 4/9: el próximo ítem
 * temporal (Evento, Bloque o Misión programada), mismo orden que ya usa
 * la vista diaria de Agenda (`proximoItem`, agrupar.ts) — nunca un
 * criterio nuevo. Sin ítem: no se renderiza nada (punto 2).
 *
 * Sprint 015.1, punto 6: `ahora` y `proximo` ya vienen separados desde
 * `useAgendaHoy()` — acá solo se decide cómo mostrarlos. Si algo está
 * ocurriendo, aparece primero como "AHORA" (con el rango de hora si lo
 * tiene) y, debajo, lo siguiente sigue apareciendo como "PRÓXIMO". Sin
 * nada ocurriendo, solo "PRÓXIMO". Sin ninguno de los dos, la sección
 * entera desaparece.
 */
export function Proximo({ ahora, proximo, ready }: ProximoProps) {
  const navigate = useNavigate()
  if (!ready || (!ahora && !proximo)) return null

  return (
    <div className="flex flex-col gap-4">
      {ahora && <ItemAgenda titulo="Ahora" item={ahora} onClick={() => navigate(ahora.path)} />}
      {proximo && <ItemAgenda titulo="Próximo" item={proximo} onClick={() => navigate(proximo.path)} />}
    </div>
  )
}

function ItemAgenda({ titulo, item, onClick }: { titulo: string; item: ProximoAgenda; onClick: () => void }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">{titulo}</h2>
      <button
        type="button"
        onClick={onClick}
        className="group block w-full appearance-none border-0 bg-transparent p-0 text-left"
      >
        <p className="line-clamp-2 text-[15px] text-ink-dim transition-colors duration-150 group-hover:text-ink group-active:text-ink">
          {item.texto}
          {item.hora ? ` · ${formatearHora12(item.hora)}${item.horaFin ? `–${formatearHora12(item.horaFin)}` : ''}` : ''}
        </p>
        {item.conflictoTexto && (
          <p className="mt-1 text-[13.5px] text-ink-faint">⚠ Conflicto con {item.conflictoTexto}</p>
        )}
      </button>
    </section>
  )
}
