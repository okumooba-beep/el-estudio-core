import { useState } from 'react'
import { MovimientoRow, type PatchMovimiento } from './MovimientoRow'
import { etiquetaDia, formatearMonto } from './mes'
import type { FinanceMovimiento, FinanceIncomePeriod } from '@/types/finance'

export interface NuevoPeriodoInput {
  nombre: string
  fechaInicio: string
  fechaFin: string
}

export interface PatchPeriodo {
  nombre: string
  fechaInicio: string
  fechaFin: string
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
  /** Abre "+ Movimiento" con tipo ingreso y `periodoId` ya fijado a este período. */
  onAgregarIngreso: (periodoId: string) => void
  /** "+ Nueva semana": crea un período con fechas propias, nunca calculadas del calendario. */
  onCrearPeriodo: (input: NuevoPeriodoInput) => void
  /** Corrige nombre/fechaInicio/fechaFin de un período ya existente. */
  onEditarPeriodo: (periodoId: string, patch: PatchPeriodo) => void
  /** Borra un período. Esta pantalla solo lo ofrece cuando ya no tiene ningún ingreso asignado. */
  onEliminarPeriodo: (periodoId: string) => void
  onCerrar: () => void
}

function sumarPorMoneda(movimientos: readonly FinanceMovimiento[]): { ars: number; usd: number } {
  return {
    ars: movimientos.filter((m) => m.moneda !== 'usd').reduce((total, m) => total + m.monto, 0),
    usd: movimientos.filter((m) => m.moneda === 'usd').reduce((total, m) => total + m.monto, 0),
  }
}

function formatearRango(fechaInicio: string, fechaFin: string): string {
  return `${etiquetaDia(fechaInicio)} – ${etiquetaDia(fechaFin)}`
}

interface BloqueTotalesProps {
  ars: number
  usd: number
}

function BloqueTotales({ ars, usd }: BloqueTotalesProps) {
  return (
    <span className="flex flex-col items-end gap-0.5">
      {ars !== 0 ? <span className="font-mono text-[14px] text-good">{formatearMonto(ars, 'ars')}</span> : null}
      {usd !== 0 ? <span className="font-mono text-[13px] text-good">{formatearMonto(usd, 'usd')}</span> : null}
      {ars === 0 && usd === 0 ? <span className="font-mono text-[14px] text-ink-faint">{formatearMonto(0, 'ars')}</span> : null}
    </span>
  )
}

interface PeriodoBlockProps {
  periodo: FinanceIncomePeriod
  movimientos: readonly FinanceMovimiento[]
  periodos: readonly FinanceIncomePeriod[]
  onEditar: (movimiento: FinanceMovimiento, patch: PatchMovimiento) => void
  onEliminar: (movimiento: FinanceMovimiento) => void
  onAgregarIngreso: (periodoId: string) => void
  onEditarPeriodo: (periodoId: string, patch: PatchPeriodo) => void
  onEliminarPeriodo: (periodoId: string) => void
}

/**
 * Sprint 036 — un bloque de período: header editable (nombre + rango de
 * fechas, nunca recalculado del calendario), totales propios (ARS y USD
 * nunca sumados), sus ingresos, y "+ Agregar ingreso" ya asociado a este
 * período. Editar el header es una acción distinta de editar un
 * movimiento — cada una abre su propio formulario, nunca el mismo.
 */
function PeriodoBlock({
  periodo,
  movimientos,
  periodos,
  onEditar,
  onEliminar,
  onAgregarIngreso,
  onEditarPeriodo,
  onEliminarPeriodo,
}: PeriodoBlockProps) {
  const [editando, setEditando] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
  const [nombreTexto, setNombreTexto] = useState(periodo.nombre)
  const [inicioTexto, setInicioTexto] = useState(periodo.fechaInicio)
  const [finTexto, setFinTexto] = useState(periodo.fechaFin)

  const { ars, usd } = sumarPorMoneda(movimientos)
  const puedeGuardar = nombreTexto.trim().length > 0 && inicioTexto.length === 10 && finTexto.length === 10 && inicioTexto <= finTexto

  function abrirEdicion() {
    setNombreTexto(periodo.nombre)
    setInicioTexto(periodo.fechaInicio)
    setFinTexto(periodo.fechaFin)
    setEditando(true)
  }

  function guardarEdicion() {
    if (!puedeGuardar) return
    onEditarPeriodo(periodo.id, { nombre: nombreTexto.trim(), fechaInicio: inicioTexto, fechaFin: finTexto })
    setEditando(false)
  }

  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          className="flex appearance-none flex-col items-start gap-0.5 border-0 bg-transparent p-0 text-left"
          onClick={() => (editando ? setEditando(false) : abrirEdicion())}
        >
          <span className="text-[14px] text-ink">{periodo.nombre}</span>
          <span className="font-mono text-[11.5px] text-ink-faint">{formatearRango(periodo.fechaInicio, periodo.fechaFin)}</span>
        </button>
        <BloqueTotales ars={ars} usd={usd} />
      </div>

      {editando ? (
        <div className="flex flex-col gap-2 border-b border-border/40 pb-3">
          <input
            type="text"
            value={nombreTexto}
            onChange={(event) => setNombreTexto(event.target.value)}
            aria-label="Nombre del período"
            placeholder="Nombre"
            className="border-b border-border/60 bg-transparent px-1 py-1.5 text-[14px] text-ink outline-none placeholder:text-ink-dim"
          />
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={inicioTexto}
              onChange={(event) => setInicioTexto(event.target.value)}
              aria-label="Fecha inicio"
              className="border-b border-border/60 bg-transparent px-1 py-1.5 font-mono text-[13px] text-ink outline-none"
            />
            <span className="text-[12px] text-ink-faint">→</span>
            <input
              type="date"
              value={finTexto}
              onChange={(event) => setFinTexto(event.target.value)}
              aria-label="Fecha fin"
              className="border-b border-border/60 bg-transparent px-1 py-1.5 font-mono text-[13px] text-ink outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="idea-destino disabled:opacity-40"
              disabled={!puedeGuardar}
              onClick={guardarEdicion}
            >
              Guardar
            </button>
            {movimientos.length === 0 ? (
              <button type="button" className="idea-destino" onClick={() => setConfirmandoBorrado((actual) => !actual)}>
                Eliminar período
              </button>
            ) : null}
          </div>
          {confirmandoBorrado ? (
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-ink-faint">¿Eliminar este período vacío?</span>
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
      <button type="button" className="idea-destino self-start" onClick={() => onAgregarIngreso(periodo.id)}>
        + Agregar ingreso
      </button>
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
  onEditarPeriodo,
  onEliminarPeriodo,
  onCerrar,
}: EntroDetalleProps) {
  const [creandoPeriodo, setCreandoPeriodo] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState(() => `Semana ${periodos.length + 1}`)
  const [inicioNuevo, setInicioNuevo] = useState('')
  const [finNuevo, setFinNuevo] = useState('')

  const periodosOrdenados = periodos.slice().sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio) || a.orden - b.orden)
  const idsConocidos = new Set(periodos.map((p) => p.id))
  const sinPeriodo = ingresos.filter((m) => !m.periodoId || !idsConocidos.has(m.periodoId))
  const { ars: totalArs, usd: totalUsd } = sumarPorMoneda(ingresos)

  const puedeCrear = nombreNuevo.trim().length > 0 && inicioNuevo.length === 10 && finNuevo.length === 10 && inicioNuevo <= finNuevo

  function abrirCreacion() {
    setNombreNuevo(`Semana ${periodos.length + 1}`)
    setInicioNuevo('')
    setFinNuevo('')
    setCreandoPeriodo(true)
  }

  function guardarNuevoPeriodo() {
    if (!puedeCrear) return
    onCrearPeriodo({ nombre: nombreNuevo.trim(), fechaInicio: inicioNuevo, fechaFin: finNuevo })
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
            onAgregarIngreso={onAgregarIngreso}
            onEditarPeriodo={onEditarPeriodo}
            onEliminarPeriodo={onEliminarPeriodo}
          />
        ))}
      </ul>

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
        <p className="text-center text-[13px] text-ink-faint">Todavía no creaste ningún período. Empezá con "Semana 1".</p>
      ) : null}

      {creandoPeriodo ? (
        <section className="flex flex-col gap-2 border-t border-border/40 pt-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-accent">Nuevo período</p>
          <input
            type="text"
            value={nombreNuevo}
            onChange={(event) => setNombreNuevo(event.target.value)}
            aria-label="Nombre del período"
            placeholder="Nombre (Semana 1)"
            className="border-b border-border/60 bg-transparent px-1 py-1.5 text-[14px] text-ink outline-none placeholder:text-ink-dim"
          />
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={inicioNuevo}
              onChange={(event) => setInicioNuevo(event.target.value)}
              aria-label="Fecha inicio"
              className="border-b border-border/60 bg-transparent px-1 py-1.5 font-mono text-[13px] text-ink outline-none"
            />
            <span className="text-[12px] text-ink-faint">→</span>
            <input
              type="date"
              value={finNuevo}
              onChange={(event) => setFinNuevo(event.target.value)}
              aria-label="Fecha fin"
              className="border-b border-border/60 bg-transparent px-1 py-1.5 font-mono text-[13px] text-ink outline-none"
            />
          </div>
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
          + Nueva semana
        </button>
      )}
    </div>
  )
}
