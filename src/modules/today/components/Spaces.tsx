import { Link } from 'react-router-dom'
import { SPACES } from './spaceRegistry'

/**
 * Build Core V1: reemplaza a ModuleGrid (Sprint "Build V1"). Mismo
 * fondo, mismos divisores finos (Bible cap. 11 — nunca tarjetas), pero
 * cada fila ahora también dice, debajo de su nombre funcional, el
 * propósito real que ya define docs/EL_ESTUDIO_CORE.md §5 para ese
 * módulo (ver spaceRegistry.ts) — la diferencia entre un ítem de menú
 * y un lugar es que un lugar tiene una razón de ser, no solo un
 * nombre. Cuando esa tabla no define una fila propia (Misiones), la
 * fila simplemente no muestra propósito: nunca se inventa uno.
 */
export function Spaces() {
  return (
    <section>
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-faint">Espacios</h2>
      <nav aria-label="Espacios del Estudio" className="flex flex-col divide-y divide-border/40 border-t border-border/40">
        {SPACES.map((espacio) => (
          <Link
            key={espacio.path}
            to={espacio.path}
            className="flex min-h-16 items-center justify-between py-2 text-ink-dim transition-colors active:text-ink motion-reduce:transition-none"
          >
            <span className="flex flex-col">
              <span className="text-[15px]">{espacio.label}</span>
              {espacio.proposito ? <span className="mt-0.5 text-[13px] text-ink-faint">{espacio.proposito}</span> : null}
            </span>
            <span aria-hidden="true" className="text-ink-faint">
              ›
            </span>
          </Link>
        ))}
      </nav>
    </section>
  )
}
