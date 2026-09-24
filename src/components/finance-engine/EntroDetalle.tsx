import { useState } from 'react'
import { MovimientoRow, type PatchMovimiento } from './MovimientoRow'
import { etiquetaDia, formatearMonto, mesDe } from './mes'
import { etiquetaSemanaCobro, fechaCorta, fechaEfectivaSemana, numeroDeSemana, semanasRealesDelMes } from './semanaCobro'
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

  const movimientosArs = movimientos.filter((m) => m.moneda !== 'usd')
  const movimientosUsd = movimientos.filter((m) => m.moneda === 'usd')
  /** ARS y USD solo se rotulan por separado cuando la semana de verdad mezcla las dos monedas — en el caso común (una sola moneda) rotular igual sería ruido, no claridad. */
  const monedasMixtas = movimientosArs.length > 0 && movimientosUsd.length > 0

  function ordenarPorFecha(lista: readonly FinanceMovimiento[]) {
    return lista.slice().sort((a, b) => a.fecha.localeCompare(b.fecha))
  }

  function filaDe(movimiento: FinanceMovimiento) {
    return (
      <MovimientoRow
        key={movimiento.id}
        movimiento={movimiento}
        moneda={movimiento.moneda}
        signo="+"
        periodos={periodos}
        onEditar={movimiento.compraId ? undefined : (patch) => onEditar(movimiento, patch)}
        onEliminar={movimiento.compraId ? undefined : () => onEliminar(movimiento)}
      />
    )
  }

  return (
    <li className="finanzas-tarjeta flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col items-start gap-0.5">
          <span className="font-mono text-[11px] uppercase tracking-wide text-accent">Semana {numeroDeSemana(periodo, periodos)}</span>
          <span className="text-[13px] text-ink-faint">{periodo.nombre}</span>
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
        monedasMixtas ? (
          <div className="flex flex-col gap-3">
            {movimientosArs.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-faint">ARS</p>
                <ul className="flex flex-col">{ordenarPorFecha(movimientosArs).map(filaDe)}</ul>
              </div>
            ) : null}
            {movimientosUsd.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-faint">USD</p>
                <ul className="flex flex-col">{ordenarPorFecha(movimientosUsd).map(filaDe)}</ul>
              </div>
            ) : null}
          </div>
        ) : (
          <ul className="flex flex-col">{ordenarPorFecha(movimientos).map(filaDe)}</ul>
        )
      ) : (
        <p className="text-[13px] text-ink-faint">Sin ingresos en este período.</p>
      )}
    </li>
  )
}

/** El mes (YYYY-MM) al que pertenece un período — el mes del jueves de esa semana, no el del lunes (ver fechaEfectivaSemana): así una semana que cruza de mes se agrupa donde vive la mayoría de sus días. */
function mesDePeriodo(periodo: FinanceIncomePeriod): string {
  return fechaEfectivaSemana(periodo.fechaInicio).slice(0, 7)
}

/** "Septiembre 2026" — el `uppercase` del header ya lo mayusculiza, mismo criterio que `periodoLabel` en FinanceScreen. */
function etiquetaMesConAnio(mes: string): string {
  return new Date(`${mes}-02`).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

interface SemanaSinPeriodoProps {
  fechaInicio: string
  fechaFin: string
  onCrearPeriodo: (input: NuevoPeriodoInput) => void
}

/**
 * Sprint 040 — "Ingresos siempre muestra todas las semanas del mes"
 * (mismo criterio que ya usa "Se fue" en mes.ts, que muestra las
 * semanas calendario del mes con o sin gasto). Acá la semana es real
 * (lunes a domingo, `semanasRealesDelMes`) y todavía no tiene período
 * creado — a diferencia de un gasto, un ingreso no puede cargarse sin
 * que el período exista primero, así que el estado vacío ofrece
 * crearlo con un tap en vez de ser de solo lectura.
 */
function SemanaSinPeriodo({ fechaInicio, fechaFin, onCrearPeriodo }: SemanaSinPeriodoProps) {
  return (
    <li className="finanzas-tarjeta flex flex-col gap-2">
      <div className="flex flex-col items-start gap-0.5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">{etiquetaSemanaCobro(fechaInicio, fechaFin)}</span>
        <p className="text-[13px] text-ink-faint">Sin ingresos en esta semana.</p>
      </div>
      <button type="button" className="idea-destino self-start" onClick={() => onCrearPeriodo({ fechaCualquiera: fechaInicio })}>
        + Crear esta semana
      </button>
    </li>
  )
}

interface GrupoMesProps {
  mes: string
  periodos: readonly FinanceIncomePeriod[]
  todosLosPeriodos: readonly FinanceIncomePeriod[]
  ingresos: readonly FinanceMovimiento[]
  abierto: boolean
  onToggle: () => void
  onEditar: (movimiento: FinanceMovimiento, patch: PatchMovimiento) => void
  onEliminar: (movimiento: FinanceMovimiento) => void
  onEliminarPeriodo: (periodoId: string) => void
  onCrearPeriodo: (input: NuevoPeriodoInput) => void
}

/**
 * Un mes es un acordeón propio (mismo patrón que la grilla de fondos en
 * Ajustes): el mes en curso arranca abierto, el resto colapsado, para
 * que "Ingresos" no vuelva a mostrar meses viejos mezclados con el
 * actual apenas se entra a la pantalla.
 *
 * Sprint 040 — recorre `semanasRealesDelMes(mes)` en vez de `periodos`
 * directo: así todas las semanas reales del mes aparecen siempre, con
 * o sin período creado, en vez de solo las que ya tienen uno.
 */
function GrupoMes({ mes, periodos, todosLosPeriodos, ingresos, abierto, onToggle, onEditar, onEliminar, onEliminarPeriodo, onCrearPeriodo }: GrupoMesProps) {
  const semanas = semanasRealesDelMes(mes)
  return (
    <li className="flex flex-col gap-3">
      <button type="button" className="flex items-center justify-between gap-2 text-left" aria-expanded={abierto} onClick={onToggle}>
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">{etiquetaMesConAnio(mes)}</h2>
        <span aria-hidden className="font-mono text-[11px] text-ink-dim">
          {abierto ? '−' : '+'}
        </span>
      </button>
      {abierto ? (
        <ul className="flex flex-col gap-6">
          {semanas.map((semana) => {
            /**
             * Bug reportado de nuevo (2026-09-24): esta comparación era
             * `p.fechaInicio === semana.fechaInicio` — `semana.fechaInicio`
             * siempre es plano (semanasRealesDelMes), pero un período que
             * ya sincronizó con Supabase quedó guardado como timestamptz
             * ("2026-08-31T00:00:00+00:00", ver fechaCorta en
             * semanaCobro.ts): el período existía y tenía ingresos, pero
             * esta comparación nunca calzaba, así que la tarjeta mostraba
             * "Sin ingresos" + "Crear esta semana" como si no existiera
             * ninguno. fechaCorta normaliza antes de comparar.
             */
            const periodo = periodos.find((p) => fechaCorta(p.fechaInicio) === semana.fechaInicio)
            return periodo ? (
              <PeriodoBlock
                key={periodo.id}
                periodo={periodo}
                /**
                 * Bug reportado (2026-09-24): la identidad real de una
                 * semana es su fecha, no el id de una fila puntual (ver
                 * numeroDeSemana más arriba) — pero acá se filtraba por
                 * `m.periodoId === periodo.id`, un id puntual. Si existen
                 * dos períodos con el mismo fechaInicio (fusión pendiente
                 * o todavía no corrida, ver fusionarPeriodosDuplicados en
                 * financeEngineRepository.ts), un ingreso podía apuntar al
                 * otro período y desaparecer de esta tarjeta aunque el
                 * desglose de arriba sí lo mostrara. Resolver la fecha del
                 * período de cada movimiento (en vez de comparar ids)
                 * hace que la plata aparezca en la semana correcta pase lo
                 * que pase con los ids — la fusión sigue limpiando las
                 * filas duplicadas de fondo, esto solo evita que la UI
                 * dependa de que ya haya terminado. fechaCorta otra vez acá
                 * por el mismo motivo que arriba: dos períodos "de la misma
                 * semana" pueden tener fechaInicio con formato distinto
                 * según si pasaron por sync o no.
                 */
                movimientos={ingresos.filter(
                  (m) => fechaCorta(todosLosPeriodos.find((p) => p.id === m.periodoId)?.fechaInicio ?? '') === fechaCorta(periodo.fechaInicio),
                )}
                periodos={todosLosPeriodos}
                onEditar={onEditar}
                onEliminar={onEliminar}
                onEliminarPeriodo={onEliminarPeriodo}
              />
            ) : (
              <SemanaSinPeriodo key={semana.fechaInicio} fechaInicio={semana.fechaInicio} fechaFin={semana.fechaFin} onCrearPeriodo={onCrearPeriodo} />
            )
          })}
        </ul>
      ) : null}
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
  const mesActual = mesDe(new Date())
  const [mesesAbiertos, setMesesAbiertos] = useState<Set<string>>(() => new Set([mesActual]))

  const periodosOrdenados = periodos.slice().sort((a, b) => fechaCorta(a.fechaInicio).localeCompare(fechaCorta(b.fechaInicio)) || a.orden - b.orden)
  const idsConocidos = new Set(periodos.map((p) => p.id))
  const sinPeriodo = ingresos.filter((m) => !m.periodoId || !idsConocidos.has(m.periodoId))
  /**
   * El resumen de arriba muestra el mes en curso, no el historial entero —
   * mismo criterio (mesActual) que usa el resto de Finanzas para el total
   * grande de "Entró"/"Se fue". Un ingreso cuenta acá si su período cae en
   * este mes (mesDePeriodo) o, sin período todavía, si su propia fecha cae
   * en este mes — la lista de abajo sigue mostrando todos los meses
   * (Sprint 036), esto solo acota el número grande.
   */
  const ingresosDelMesActual = ingresos.filter((m) => {
    const periodo = periodos.find((p) => p.id === m.periodoId)
    return periodo ? mesDePeriodo(periodo) === mesActual : m.fecha.startsWith(mesActual)
  })
  const { ars: totalArs, usd: totalUsd } = sumarPorMoneda(ingresosDelMesActual)
  const [desglosarTotal, setDesglosarTotal] = useState(false)
  /**
   * Pedido (2026-09-24): el desglose mezclaba pesos y dólares en la misma
   * lista, ordenados solo por fecha — dos monedas que nunca se suman entre
   * sí (ver sumarPorMoneda) mostradas como si fueran una sola secuencia.
   * Pesos por defecto (la moneda de la enorme mayoría de los ingresos) y
   * un toggle para pasar a dólares, en vez de las dos intercaladas.
   */
  const [monedaDesglose, setMonedaDesglose] = useState<'ars' | 'usd'>('ars')
  const periodosDelMesActual = periodos.filter((p) => mesDePeriodo(p) === mesActual)
  const desgloseOrdenado = ingresosDelMesActual.slice().sort((a, b) => a.fecha.localeCompare(b.fecha))

  const periodosPorMes = new Map<string, FinanceIncomePeriod[]>()
  for (const periodo of periodosOrdenados) {
    const mes = mesDePeriodo(periodo)
    const grupo = periodosPorMes.get(mes)
    if (grupo) grupo.push(periodo)
    else periodosPorMes.set(mes, [periodo])
  }
  /** Sprint 040 — el mes en curso siempre aparece, tenga o no períodos creados todavía (mismo criterio que "Se fue"). */
  const mesesConDatos = new Set(periodosPorMes.keys())
  mesesConDatos.add(mesActual)
  const mesesOrdenados = Array.from(mesesConDatos).sort((a, b) => b.localeCompare(a))

  function toggleMes(mes: string) {
    setMesesAbiertos((actual) => {
      const siguiente = new Set(actual)
      if (siguiente.has(mes)) siguiente.delete(mes)
      else siguiente.add(mes)
      return siguiente
    })
  }

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

      <section className="finanzas-tarjeta flex flex-col gap-1">
        <button
          type="button"
          className="flex w-full appearance-none flex-col items-center gap-1 border-0 bg-transparent p-0"
          onClick={() => setDesglosarTotal((actual) => !actual)}
          aria-expanded={desglosarTotal}
        >
          <span className="font-mono text-[11px] uppercase tracking-wide text-accent">Ingresos</span>
          <span className="font-mono text-[26px] text-good">{formatearMonto(totalArs, 'ars')}</span>
          {totalUsd !== 0 ? <span className="font-mono text-[18px] text-good">{formatearMonto(totalUsd, 'usd')}</span> : null}
          <span className="text-[12px] text-ink-faint">
            {etiquetaMesConAnio(mesActual)} {desglosarTotal ? '▴' : '▾'}
          </span>
        </button>

        {desglosarTotal ? (
          <div className="flex flex-col gap-2 border-t border-border/40 pt-2">
            {totalUsd !== 0 ? (
              <div className="flex justify-center gap-2" role="group" aria-label="Moneda">
                <button
                  type="button"
                  className="idea-destino"
                  aria-pressed={monedaDesglose === 'ars'}
                  style={monedaDesglose === 'ars' ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
                  onClick={() => setMonedaDesglose('ars')}
                >
                  Pesos
                </button>
                <button
                  type="button"
                  className="idea-destino"
                  aria-pressed={monedaDesglose === 'usd'}
                  style={monedaDesglose === 'usd' ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
                  onClick={() => setMonedaDesglose('usd')}
                >
                  Dólares
                </button>
              </div>
            ) : null}
            {(() => {
              const filtrado = desgloseOrdenado.filter((m) => (m.moneda === 'usd' ? 'usd' : 'ars') === monedaDesglose)
              if (filtrado.length === 0) {
                return (
                  <p className="pt-1 text-center text-[12px] text-ink-faint">
                    {monedaDesglose === 'usd' ? 'Todavía no hay ingresos en dólares este mes.' : 'Todavía no hay ingresos en pesos este mes.'}
                  </p>
                )
              }
              return (
                <ul className="flex flex-col gap-1.5">
                  {filtrado.map((movimiento) => {
                    const periodo = periodos.find((p) => p.id === movimiento.periodoId)
                    const etiquetaPeriodo = periodo
                      ? `Semana ${numeroDeSemana(periodo, periodosDelMesActual)} · ${periodo.nombre}`
                      : 'Sin período'
                    return (
                      <li key={movimiento.id} className="flex items-center justify-between gap-3 text-[13px]">
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-ink">{movimiento.concepto || etiquetaPeriodo}</span>
                          <span className="text-[11px] text-ink-faint">
                            {etiquetaDia(movimiento.fecha)} · {etiquetaPeriodo}
                          </span>
                        </span>
                        <span className="font-mono text-good">{formatearMonto(movimiento.monto, movimiento.moneda)}</span>
                      </li>
                    )
                  })}
                </ul>
              )
            })()}
          </div>
        ) : null}
      </section>

      <ul className="flex flex-col gap-6">
        {mesesOrdenados.map((mes) => (
          <GrupoMes
            key={mes}
            mes={mes}
            periodos={periodosPorMes.get(mes) ?? []}
            todosLosPeriodos={periodos}
            ingresos={ingresos}
            abierto={mesesAbiertos.has(mes)}
            onToggle={() => toggleMes(mes)}
            onEditar={onEditar}
            onEliminar={onEliminar}
            onEliminarPeriodo={onEliminarPeriodo}
            onCrearPeriodo={onCrearPeriodo}
          />
        ))}
      </ul>

      {/* Sprint 039 — un solo "+ Agregar ingreso" global: adentro el usuario elige a qué semana pertenece, en vez de un botón repetido por semana. */}
      <button type="button" className="idea-destino self-center" onClick={onAgregarIngreso}>
        + Agregar ingreso
      </button>

      {sinPeriodo.length > 0 ? (
        <section className="finanzas-tarjeta flex flex-col gap-2">
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

      {creandoPeriodo ? (
        <section className="flex flex-col gap-2 border-t border-border/40 pt-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-accent">Semana de cobro</p>
          <p className="text-[12.5px] text-ink-faint">Elegí una fecha de referencia — el sistema arma la semana lunes a domingo que la contiene.</p>
          <input
            type="date"
            value={fechaNueva}
            onChange={(event) => setFechaNueva(event.target.value)}
            aria-label="Elegir fecha de referencia"
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
