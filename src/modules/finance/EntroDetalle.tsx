import { MovimientoRow } from './MovimientoRow'
import { etiquetaSemana, formatearMonto, semanaDelMes } from './mes'
import type { FinanceMovimiento } from '@/types/finance'
import type { Moneda } from './extraccion'

interface EntroDetalleProps {
  vista: 'semana' | 'mes'
  mes: string
  moneda: Moneda
  total: number
  /** Movimientos ya recortados al período (semana o mes) — se filtra acá solo por tipo. */
  movimientos: readonly FinanceMovimiento[]
  onCerrar: () => void
}

/**
 * Sprint 016, punto 2: "Entró" deja de ser un número aislado — acá se
 * responde "¿cuándo entró?". En vista mensual, agrupado por semana
 * calendario del mes (mismo criterio que `semanaDelMes`, ya usado para
 * el desglose semanal de ingresos); en vista semanal ya es una sola
 * semana, así que alcanza con la lista cronológica de movimientos
 * (punto 8: "¿Qué entró esta semana?").
 */
export function EntroDetalle({ vista, mes, moneda, total, movimientos, onCerrar }: EntroDetalleProps) {
  const ingresos = movimientos.filter((m) => m.tipo === 'ingreso').sort((a, b) => a.fecha.localeCompare(b.fecha))

  const semanas =
    vista === 'mes'
      ? Array.from(new Set(ingresos.map((m) => semanaDelMes(m.fecha))))
          .sort((a, b) => a - b)
          .map((semana) => ({
            semana,
            movimientos: ingresos.filter((m) => semanaDelMes(m.fecha) === semana),
          }))
      : null

  return (
    <div className="flex flex-col gap-6">
      <button type="button" className="idea-destino self-start" onClick={onCerrar}>
        ‹ Finanzas
      </button>

      <section className="flex flex-col items-center gap-1">
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent">Total entrado</p>
        <p className="font-mono text-[28px] text-good">{formatearMonto(total, moneda)}</p>
      </section>

      {ingresos.length === 0 ? (
        <p className="text-center text-[14px] text-ink-faint">No entró dinero en este período.</p>
      ) : semanas ? (
        <ul className="flex flex-col gap-5">
          {semanas.map(({ semana, movimientos: deLaSemana }) => (
            <li key={semana} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[14px] text-ink">
                  Semana {semana} · {etiquetaSemana(mes, semana)}
                </span>
                <span className="font-mono text-[14px] text-good">
                  {formatearMonto(
                    deLaSemana.reduce((total_, m) => total_ + m.monto, 0),
                    moneda,
                  )}
                </span>
              </div>
              <ul className="flex flex-col">
                {deLaSemana.map((movimiento) => (
                  <MovimientoRow key={movimiento.id} movimiento={movimiento} moneda={moneda} signo="+" />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col">
          {ingresos.map((movimiento) => (
            <MovimientoRow key={movimiento.id} movimiento={movimiento} moneda={moneda} signo="+" />
          ))}
        </ul>
      )}
    </div>
  )
}
