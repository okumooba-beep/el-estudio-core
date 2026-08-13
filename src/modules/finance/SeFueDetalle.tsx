import { useState } from 'react'
import { CATEGORIA_COLOR, CATEGORIA_LABEL, type FinanceCategoria } from './categorias'
import { MovimientoRow } from './MovimientoRow'
import { categoriaDe, formatearMonto, type GrupoCategoria } from './mes'
import type { FinanceMovimiento } from '@/types/finance'
import type { Moneda } from './extraccion'

interface SeFueDetalleProps {
  moneda: Moneda
  /** Sprint 016.1, punto 15: mismo texto que ya muestra el header de FinanceScreen — nunca se recalcula acá. */
  periodoLabel: string
  total: number
  /** Ya filtrados a categorías con al menos un movimiento (punto 3: "no mostrar categorías vacías"). */
  grupos: readonly GrupoCategoria[]
  /** Movimientos ya recortados al período (semana o mes) — se filtra acá solo por tipo/categoría. */
  movimientos: readonly FinanceMovimiento[]
  /** Al llegar desde el anillo/lista de categorías del resumen, abre directo en esa categoría. */
  categoriaInicial: FinanceCategoria | null
  onCerrar: () => void
}

/**
 * Sprint 016, punto 3: "Se fue" responde "¿en qué?" — total, después
 * categorías (solo las que tienen movimientos), y al tocar una,
 * los movimientos concretos que la forman. El período (semana o mes)
 * nunca se pierde: `grupos`/`movimientos` ya vienen recortados por
 * quien abre este detalle (FinanceScreen), y volver a la lista de
 * categorías no cierra el detalle ni cambia el período.
 */
export function SeFueDetalle({ moneda, periodoLabel, total, grupos, movimientos, categoriaInicial, onCerrar }: SeFueDetalleProps) {
  const [categoria, setCategoria] = useState<FinanceCategoria | null>(categoriaInicial)

  if (categoria) {
    const deLaCategoria = movimientos
      .filter((m) => m.tipo === 'egreso' && categoriaDe(m) === categoria)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
    const totalCategoria = deLaCategoria.reduce((suma, m) => suma + m.monto, 0)

    return (
      <div className="flex flex-col gap-6">
        <button type="button" className="idea-destino self-start" onClick={() => setCategoria(null)}>
          ‹ Categorías
        </button>
        <section className="flex flex-col items-center gap-1">
          <p className="font-mono text-[11px] text-ink-faint">{periodoLabel}</p>
          <p className="font-mono text-[11px] uppercase tracking-wide text-accent">{CATEGORIA_LABEL[categoria]}</p>
          <p className="font-mono text-[28px] text-critical">{formatearMonto(totalCategoria, moneda)}</p>
        </section>
        <ul className="flex flex-col">
          {deLaCategoria.map((movimiento) => (
            <MovimientoRow key={movimiento.id} movimiento={movimiento} moneda={moneda} />
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <button type="button" className="idea-destino self-start" onClick={onCerrar}>
        ‹ Finanzas
      </button>
      <section className="flex flex-col items-center gap-1">
        <p className="font-mono text-[11px] text-ink-faint">{periodoLabel}</p>
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent">Total gastado</p>
        <p className="font-mono text-[28px] text-critical">{formatearMonto(total, moneda)}</p>
      </section>
      {grupos.length === 0 ? (
        <p className="text-center text-[14px] text-ink-faint">No se fue dinero en este período.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {grupos.map((grupo) => (
            <li key={grupo.categoria}>
              <button
                type="button"
                className="flex w-full appearance-none items-baseline justify-between gap-3 border-b border-border/40 bg-transparent px-0 py-2.5 text-left"
                onClick={() => setCategoria(grupo.categoria)}
              >
                <span className="flex items-center gap-2 text-[15px] text-ink">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORIA_COLOR[grupo.categoria] }}
                    aria-hidden="true"
                  />
                  {CATEGORIA_LABEL[grupo.categoria]}
                </span>
                <span className="font-mono text-[14px] text-ink-dim">{formatearMonto(grupo.total, moneda)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
