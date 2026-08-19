import { MovimientoRow, type PatchMovimiento } from './MovimientoRow'
import { etiquetaSemana, formatearMonto, semanaDelMes, semanasEnMes } from './mes'
import type { FinanceMovimiento } from '@/types/finance'
import type { Moneda } from './extraccion'

interface EntroDetalleProps {
  mes: string
  moneda: Moneda
  /** Sprint 016.1, punto 15: mismo texto que ya muestra el header de FinanceScreen — nunca se recalcula acá. */
  periodoLabel: string
  total: number
  /**
   * Mini Sprint 032 (§1/§17): siempre el mes completo, nunca recortado
   * a la semana en curso — "Ingresos" tiene que poder manejarse semana
   * por semana sin importar qué vista (Esta semana/Este mes) esté
   * activa arriba en FinanceScreen. Se filtra acá solo por tipo.
   */
  movimientos: readonly FinanceMovimiento[]
  /**
   * Mini Sprint 029.1 (§5/§6) — corrige un ingreso ya existente. Mini
   * Sprint 032 (§7) amplía el patch a los cinco campos editables.
   * Corregir la fecha es lo que mueve el movimiento de semana (§7): la
   * semana sigue siendo un resumen calculado, nunca se edita directo.
   */
  onEditar: (movimiento: FinanceMovimiento, patch: PatchMovimiento) => void
  /** Mini Sprint 029.1 (§7) — borra un ingreso individual. */
  onEliminar: (movimiento: FinanceMovimiento) => void
  /** Mini Sprint 032 (§2) — abre "+ Movimiento" con el tipo fijado en ingreso y la fecha dentro de esta semana. */
  onAgregarIngreso: (semana: number) => void
  onCerrar: () => void
}

/**
 * Sprint 016, punto 2: "Entró" deja de ser un número aislado — acá se
 * responde "¿cuándo entró?". Mini Sprint 032 (§1/§17): el desglose por
 * semana calendario ya no depende de la vista (semana/mes) de arriba —
 * "Ingresos" siempre muestra el mes entero semana por semana, cada
 * bloque con su propio "+ Agregar ingreso", incluidas las semanas que
 * todavía no tienen ningún movimiento (nunca se ocultan: §17 las quiere
 * ver igual, vacías, para poder cargar ahí mismo).
 */
export function EntroDetalle({ mes, moneda, periodoLabel, total, movimientos, onEditar, onEliminar, onAgregarIngreso, onCerrar }: EntroDetalleProps) {
  const ingresos = movimientos.filter((m) => m.tipo === 'ingreso').sort((a, b) => a.fecha.localeCompare(b.fecha))

  const semanas = Array.from({ length: semanasEnMes(mes) }, (_, indice) => {
    const semana = indice + 1
    return { semana, movimientos: ingresos.filter((m) => semanaDelMes(m.fecha) === semana) }
  })

  return (
    <div className="flex flex-col gap-6">
      <button type="button" className="idea-destino self-start" onClick={onCerrar}>
        ‹ Finanzas
      </button>

      <section className="flex flex-col items-center gap-1">
        <p className="font-mono text-[11px] text-ink-faint">{periodoLabel}</p>
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent">Total ingresos</p>
        <p className="font-mono text-[28px] text-good">{formatearMonto(total, moneda)}</p>
      </section>

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
            {deLaSemana.length > 0 ? (
              <ul className="flex flex-col">
                {deLaSemana.map((movimiento) => (
                  <MovimientoRow
                    key={movimiento.id}
                    movimiento={movimiento}
                    moneda={moneda}
                    signo="+"
                    onEditar={movimiento.compraId ? undefined : (patch) => onEditar(movimiento, patch)}
                    onEliminar={movimiento.compraId ? undefined : () => onEliminar(movimiento)}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-ink-faint">Sin ingresos esta semana.</p>
            )}
            <button type="button" className="idea-destino self-start" onClick={() => onAgregarIngreso(semana)}>
              + Agregar ingreso
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
