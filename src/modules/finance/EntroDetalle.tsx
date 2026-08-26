import { useState } from 'react'
import { MovimientoRow, type PatchMovimiento } from './MovimientoRow'
import { formatearMonto } from './mes'
import type { FinanceMovimiento, FinanceIncomePeriod } from '@/types/finance'

export interface NuevoPeriodoInput {
  /** Cualquier día de la semana que se quiere crear — se normaliza a lunes→domingo antes de guardarse. */
  fechaCualquiera: string
}

interface EntroDetalleProps {
  /**
   * Sprint 036 — todos los ingresos que existen, de cualquier período o
   * sin ninguno: Ingresos ya no recorta por mes ni por semana calendario
   * (eso era `semanaDelMes`, que este sprint reemplaza). Los períodos son
   * quienes deciden el recorte ahora, y un período puede cruzar meses.
   */
  ingresos: readonly FinanceMovimiento[]
  /** Los períodos que el usuario ya creó, en cualquier orden — acá se ordenan por fechaInicio. */
  periodos: readonly FinanceIncomePeriod[]
  /** Corrige un ingreso ya existente: monto, moneda, medio, fecha y — si hay períodos — a cuál pertenece. */
  onEditar: (movimiento: FinanceMovimiento, patch: PatchMovimiento) => void
  /** Borra un ingreso individual. Un ingreso mal cargado se borra, no se le busca categoría. */
  onEliminar: (movimiento: FinanceMovimiento) => void
  /** Sprint 039 — abre "+ Agregar ingreso" como acción global: el usuario elige la semana dentro del formulario, no hay un botón por semana. */
  onAgregarIngreso: () => void
  /** "+ Semana de cobro": crea (o reabre, si ya existe) la semana real que contiene la fecha elegida. */
  onCrearPeriodo: (input: NuevoPeriodoInput) => void
  /** Borra un período. Esta pantalla solo lo ofrece cuando ya no tiene ningún ingreso asignado. */
  onEliminarPeriodo: (periodoId: string) => void
  onCerrar: () => void
}

interface TotalesPorMedio {
  efectivo: number
  transferencia: number
}

interface TotalesSemana {
  ars: TotalesPorMedio
  usd: TotalesPorMedio
}

/** ARS y USD nunca se suman entre sí, y dentro de cada moneda Efectivo y Transferencia se llevan por separado (Sprint 037). */
function sumarPorMonedaYMedio(movimientos: readonly FinanceMovimiento[]): TotalesSemana {
  const vacio = (): TotalesPorMedio => ({ efectivo: 0, transferencia: 0 })
  const totales: TotalesSemana = { ars: vacio(), usd: vacio() }
  for (const movimiento of movimientos) {
    const moneda = movimiento.moneda === 'usd' ? 'usd' : 'ars'
    const medio = movimiento.medio === 'efectivo' ? 'efectivo' : 'transferencia'
    totales[moneda][medio] += movimiento.monto
  }
  return totales
}

function sumarPorMoneda(movimientos: readonly FinanceMovimiento[]): { ars: number; usd: number } {
  const { ars, usd } = sumarPorMonedaYMedio(movimientos)
  return { ars: ars.efectivo + ars.transferencia, usd: usd.efectivo + usd.transferencia }
}

interface BloqueTotalesProps {
  movimientos: readonly FinanceMovimiento[]
}

/** Hasta 4 líneas — ARS Efectivo, ARS Transferencia, USD Efectivo, USD Transferencia — nunca sumadas entre sí, solo las que de verdad tienen movimiento. */
function BloqueTotales({ movimientos }: BloqueTotalesProps) {
  const { ars, usd } = sumarPorMonedaYMedio(movimientos)
  const lineas = [
    ars.efectivo !== 0 ? { texto: formatearMonto(ars.efectivo, 'ars'), medio: 'Efectivo' } : null,
    ars.transferencia !== 0 ? { texto: formatearMonto(ars.transferencia, 'ars'), medio: 'Transferencia' } : null,
    usd.efectivo !== 0 ? { texto: formatearMonto(usd.efectivo, 'usd'), medio: 'Efectivo' } : null,
    usd.transferencia !== 0 ? { texto: formatearMonto(usd.transferencia, 'usd'), medio: 'Transferencia' } : null,
  ].filter((linea): linea is { texto: string; medio: string } => linea !== null)

  return (
    <span className="flex flex-col items-end gap-0.5">
      {lineas.length > 0 ? (
        lineas.map((linea, indice) => (
          <span key={indice} className="font-mono text-[13px] text-good">
            {linea.texto} <span className="text-[10.5px] text-ink-faint">{linea.medio}</span>
          </span>
        ))
      ) : (
        <span className="font-mono text-[14px] text-ink-faint">{formatearMonto(0, 'ars')}</span>
      )}
    </span>
  )
}

interface PeriodoBlockProps {
  periodo: FinanceIncomePeriod
  movimientos: readonly FinanceMovimiento[]
  periodos: readonly FinanceIncomePeriod[]
  onEditar: (movimiento: FinanceMovimiento, patch: PatchMovimiento) => void
  onEliminar: (movimiento: FinanceMovimiento) => void
  onEliminarPeriodo: (periodoId: string) => void
}

/**
 * Sprint 037 — un bloque de semana de cobro: header con la fecha real
 * (nunca editable — la fecha es la identidad de la semana, cambiarla
 * sería otra semana), totales propios por moneda y medio (nunca
 * sumados entre sí), y sus ingresos. Solo se puede borrar una semana
 * vacía. Sprint 039 — ya no tiene su propio "+ Agregar ingreso": ese
 * botón pasó a ser único y global (ver `EntroDetalle`), para dejar de
 * repetirse una vez por semana.
 */
function PeriodoBlock({
  periodo,
  movimientos,
  periodos,
  onEditar,
  onEliminar,
  onEliminarPeriodo,
}: PeriodoBlockProps) {
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)

  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[14px] text-ink">{periodo.nombre}</span>
          {movimientos.length === 0 ? (
            <button
              type="button"
              className="appearance-none border-0 bg-transparent p-0 text-[11.5px] text-critical"
              onClick={() => setConfirmandoBorrado((actual) => !actual)}
            >
              Eliminar semana vacía
            </button>
          ) : null}
        </div>
        <BloqueTotales movimientos={movimientos} />
      </div>

      {confirmandoBorrado ? (
        <div className="flex items-center gap-3 border-b border-border/40 pb-3">
          <span className="text-[13px] text-ink-faint">¿Eliminar esta semana vacía?</span>
          <button
            type="button"
            className="idea-destino"
            style={{ color: 'var(--critical)', borderColor: 'var(--critical)' }}
            onClick={() => onEliminarPeriodo(periodo.id)}
          >
            Sí, eliminar
          </button>
          <button type="button" className="idea-destino" onClick={() => setConfirmandoBorrado(false)}>
            No
          </button>
        </div>
      ) : null}

      {movimientos.length > 0 ? (
        <ul className="flex flex-col">
          {movimientos
            .slice()
            .sort((a, b) => a.fecha.localeCompare(b.fecha))
            .map((movimiento) => (
              <MovimientoRow
                key={movimiento.id}
                movimiento={movimiento}
                moneda={movimiento.moneda}
                signo="+"
                periodos={periodos}
                onEditar={movimiento.compraId ? undefined : (patch) => onEditar(movimiento, patch)}
                onEliminar={movimiento.compraId ? undefined : () => onEliminar(movimiento)}
              />
            ))}
        </ul>
      ) : (
        <p className="text-[13px] text-ink-faint">Sin ingresos en este período.</p>
      )}
    </li>
  )
}

/**
 * Sprint 036 — "Ingresos como períodos financieros reales". Reemplaza
 * el desglose por semana calendario (Sprint 016/Mini Sprint 032): antes
 * cada bloque era `Math.ceil(día/7)`, calculado de nuevo en cada
 * render, sin ninguna forma de que el usuario definiera dónde empieza y
 * termina "Semana 1". Acá los bloques son `periodos` reales — el
 * usuario los crea, les pone fechas, y esas fechas no cambian solas.
 */
export function EntroDetalle({
  ingresos,
  periodos,
  onEditar,
  onEliminar,
  onAgregarIngreso,
  onCrearPeriodo,
  onEliminarPeriodo,
  onCerrar,
}: EntroDetalleProps) {
  const [creandoPeriodo, setCreandoPeriodo] = useState(false)
  const [fechaNueva, setFechaNueva] = useState('')

  const periodosOrdenados = periodos.slice().sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio) || a.orden - b.orden)
  const idsConocidos = new Set(periodos.map((p) => p.id))
  const sinPeriodo = ingresos.filter((m) => !m.periodoId || !idsConocidos.has(m.periodoId))
  const { ars: totalArs, usd: totalUsd } = sumarPorMoneda(ingresos)

  const puedeCrear = fechaNueva.length === 10

  function abrirCreacion() {
    setFechaNueva('')
    setCreandoPeriodo(true)
  }

  function guardarNuevoPeriodo() {
    if (!puedeCrear) return
    onCrearPeriodo({ fechaCualquiera: fechaNueva })
    setCreandoPeriodo(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <button type="button" className="idea-destino self-start" onClick={onCerrar}>
        ‹ Finanzas
      </button>

      <section className="flex flex-col items-center gap-1">
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent">Ingresos</p>
        <p className="font-mono text-[26px] text-good">{formatearMonto(totalArs, 'ars')}</p>
        {totalUsd !== 0 ? <p className="font-mono text-[18px] text-good">{formatearMonto(totalUsd, 'usd')}</p> : null}
      </section>

      <ul className="flex flex-col gap-6">
        {periodosOrdenados.map((periodo) => (
          <PeriodoBlock
            key={periodo.id}
            periodo={periodo}
            movimientos={ingresos.filter((m) => m.periodoId === periodo.id)}
            periodos={periodos}
            onEditar={onEditar}
            onEliminar={onEliminar}
            onEliminarPeriodo={onEliminarPeriodo}
          />
        ))}
      </ul>

      {/* Sprint 039 — un solo "+ Agregar ingreso" global: adentro el usuario elige a qué semana pertenece, en vez de un botón repetido por semana. */}
      <button type="button" className="idea-destino self-center" onClick={onAgregarIngreso}>
        + Agregar ingreso
      </button>

      {sinPeriodo.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Sin período</h2>
          <p className="text-[12.5px] text-ink-faint">Tocá un ingreso y editalo para asignarle un período.</p>
          <ul className="flex flex-col">
            {sinPeriodo
              .slice()
              .sort((a, b) => a.fecha.localeCompare(b.fecha))
              .map((movimiento) => (
                <MovimientoRow
                  key={movimiento.id}
                  movimiento={movimiento}
                  moneda={movimiento.moneda}
                  signo="+"
                  periodos={periodos}
                  onEditar={movimiento.compraId ? undefined : (patch) => onEditar(movimiento, patch)}
                  onEliminar={movimiento.compraId ? undefined : () => onEliminar(movimiento)}
                />
              ))}
          </ul>
        </section>
      ) : null}

      {periodosOrdenados.length === 0 && sinPeriodo.length === 0 ? (
        <p className="text-center text-[13px] text-ink-faint">Todavía no creaste ninguna semana de cobro.</p>
      ) : null}

      {creandoPeriodo ? (
        <section className="flex flex-col gap-2 border-t border-border/40 pt-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-accent">Semana de cobro</p>
          <p className="text-[12.5px] text-ink-faint">Elegí cualquier día de la semana que querés abrir.</p>
          <input
            type="date"
            value={fechaNueva}
            onChange={(event) => setFechaNueva(event.target.value)}
            aria-label="Cualquier día de la semana"
            className="border-b border-border/60 bg-transparent px-1 py-1.5 font-mono text-[13px] text-ink outline-none"
          />
          <div className="flex gap-3">
            <button type="button" className="idea-destino disabled:opacity-40" disabled={!puedeCrear} onClick={guardarNuevoPeriodo}>
              Guardar
            </button>
            <button type="button" className="idea-destino" onClick={() => setCreandoPeriodo(false)}>
              Cancelar
            </button>
          </div>
        </section>
      ) : (
        <button type="button" className="idea-destino self-center" onClick={abrirCreacion}>
          + Semana de cobro
        </button>
      )}
    </div>
  )
}
