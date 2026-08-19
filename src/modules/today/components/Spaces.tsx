import { Link } from 'react-router-dom'
import { MODULE_ICONS } from '@design-system/icons/ModuleIcons'
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
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-accent">Espacios</h2>
      <nav aria-label="Espacios del Estudio" className="flex flex-col divide-y divide-border/40 border-t border-border/40">
        {SPACES.map((espacio) => {
          const Icon = MODULE_ICONS[espacio.path]
          return (
            <Link
              key={espacio.path}
              to={espacio.path}
              className="group flex min-h-16 items-center gap-3 py-2 text-ink-dim transition-colors active:text-ink motion-reduce:transition-none"
            >
              {Icon ? <Icon width={20} height={20} className="shrink-0 text-ink-faint" /> : null}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] text-accent">{espacio.label}</span>
                {espacio.proposito ? <span className="mt-0.5 text-[12px] text-ink-faint">{espacio.proposito}</span> : null}
              </span>
              <span
                aria-hidden="true"
                className="shrink-0 text-ink-faint transition-transform duration-150 group-active:translate-x-0.5 motion-reduce:transition-none motion-reduce:transform-none"
              >
                ›
              </span>
            </Link>
          )
        })}
      </nav>
    </section>
  )
}
