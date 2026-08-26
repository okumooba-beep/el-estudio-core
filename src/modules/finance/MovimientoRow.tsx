import { useState } from 'react'
import { CATEGORIAS, CATEGORIA_LABEL, type FinanceCategoria } from './categorias'
import { etiquetaDia, formatearMonto } from './mes'
import { parsearMontoManual } from './extraccion'
import { numeroDeSemana } from './semanaCobro'
import type { FinanceMovimiento, FinanceIncomePeriod } from '@/types/finance'
import type { Medio, Moneda } from './extraccion'

/**
 * Mini Sprint 032 (§7) — todo lo que se puede corregir de un movimiento
 * ya existente. Sprint 036 agrega `periodoId`: a qué período pertenece
 * este ingreso, solo relevante cuando la fila se edita desde Ingresos
 * (ver prop `periodos` más abajo) — un egreso nunca lo manda.
 */
export interface PatchMovimiento {
  monto: number
  fecha: string
  moneda: Moneda
  medio: Medio
  concepto: string
  periodoId?: string
}

interface MovimientoRowProps {
  movimiento: FinanceMovimiento
  moneda: Moneda
  /** '+' para ingresos (Sprint 016, punto 2: "8 agosto / + $X / Descripción"). */
  signo?: '+' | ''
  /**
   * Sprint 026: si se pasa, la fila se puede tocar para corregir la
   * categoría de un movimiento que ya existe — no solo los "Por
   * revisar" (Sprint 007), cualquiera. Monto, moneda, fecha, concepto,
   * tipo e ID quedan intactos: `onCambiarCategoria` es la misma
   * `corregirCategoria` que ya usa esa sección, mismo `updateMovimiento`.
   */
  onCambiarCategoria?: (categoria: FinanceCategoria) => void
  /**
   * Mini Sprint 029.1 (§4/§5/§6) — corrige un movimiento ya existente.
   * Mini Sprint 032 (§7) amplía el patch de {monto, fecha} a los cinco
   * campos editables (monto, fecha, moneda, medio, concepto): la semana
   * sigue sin ser un campo propio, se deriva de `fecha` (§7 del brief —
   * "no es un campo duplicado"). Quien llama a esto decide si lo ofrece:
   * una cuota (`compraId`) nunca recibe esta prop (§10 — no hay decisión
   * de producto tomada sobre qué le pasa a las cuotas hermanas).
   */
  onEditar?: ((patch: PatchMovimiento) => void) | undefined
  /** Mini Sprint 029.1 (§7) — borra este movimiento. Mismo cuidado con cuotas que `onEditar`. */
  onEliminar?: (() => void) | undefined
  /**
   * Sprint 034 (§16) — reclasifica un movimiento "Por revisar" que en
   * realidad es plata que entró (p. ej. un texto viejo del Umbral que no
   * matcheó ningún verbo de ingreso y quedó como egreso sin categoría).
   * Nunca se ofrece junto a `onCambiarCategoria` en el mismo lugar salvo
   * en "Por revisar" — mismo cuidado con cuotas que `onEditar`.
   */
  onConvertirAIngreso?: (() => void) | undefined
  /**
   * Sprint 036 — lista de períodos disponibles para reasignar este
   * ingreso. Solo se pasa desde Ingresos (EntroDetalle); si no se pasa,
   * el formulario de edición no muestra selector de período — un egreso
   * o una fila de "Por revisar"/"Movimientos recientes" nunca lo tiene.
   */
  periodos?: readonly FinanceIncomePeriod[]
}

/**
 * Sprint 034 (§5) — Editar/Eliminar/Editar categoría nunca estuvieron
 * permanentemente visibles en el diseño del brief: hasta acá se
 * renderizaban siempre que la prop existía, sin ningún gesto de por
 * medio. Tocar la fila revela los disparadores; tocarla de nuevo (o
 * cambiar de fila) los vuelve a esconder y cierra cualquier
 * sub-formulario abierto, para que nunca quede un formulario editable
 * escondido detrás de un disparador oculto.
 */
export function MovimientoRow({
  movimiento,
  moneda,
  signo = '',
  onCambiarCategoria,
  onEditar,
  onEliminar,
  onConvertirAIngreso,
  periodos,
}: MovimientoRowProps) {
  const [interactuando, setInteractuando] = useState(false)
  const [categoriaAbierta, setCategoriaAbierta] = useState(false)
  const [formAbierto, setFormAbierto] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
  const [montoTexto, setMontoTexto] = useState(() => String(movimiento.monto))
  const [fechaTexto, setFechaTexto] = useState(movimiento.fecha)
  const [monedaEditada, setMonedaEditada] = useState<Moneda>(movimiento.moneda)
  const [medioEditado, setMedioEditado] = useState<Medio>(movimiento.medio)
  const [conceptoTexto, setConceptoTexto] = useState(movimiento.concepto)
  const [periodoEditado, setPeriodoEditado] = useState<string | undefined>(
    () => movimiento.periodoId ?? periodos?.[0]?.id,
  )

  const tieneAcciones = Boolean(onCambiarCategoria || onEditar || onEliminar || onConvertirAIngreso)

  function alternarInteraccion() {
    if (!tieneAcciones) return
    setInteractuando((actual) => {
      if (actual) {
        setCategoriaAbierta(false)
        setFormAbierto(false)
        setConfirmandoBorrado(false)
      }
      return !actual
    })
  }

  const montoEditado = parsearMontoManual(montoTexto)
  const puedeGuardar = montoEditado !== null && fechaTexto.length === 10

  function abrirForm() {
    setMontoTexto(String(movimiento.monto))
    setFechaTexto(movimiento.fecha)
    setMonedaEditada(movimiento.moneda)
    setMedioEditado(movimiento.medio)
    setConceptoTexto(movimiento.concepto)
    setPeriodoEditado(movimiento.periodoId ?? periodos?.[0]?.id)
    setFormAbierto(true)
  }

  const haySelectorPeriodo = Boolean(periodos && periodos.length > 0)
  /** Cuando hay semana elegida, su lunes ES la fecha del movimiento — el input de fecha se oculta en ese caso (mismo criterio que NuevoMovimiento), así nunca compiten dos fechas por decir "cuándo es esto". */
  const periodoSeleccionado = haySelectorPeriodo ? periodos?.find((p) => p.id === periodoEditado) : undefined
  const fechaEditadaEfectiva = haySelectorPeriodo ? (periodoSeleccionado?.fechaInicio ?? fechaTexto) : fechaTexto

  function guardarEdicion() {
    if (!onEditar || montoEditado === null) return
    onEditar({
      monto: montoEditado,
      fecha: fechaEditadaEfectiva,
      moneda: monedaEditada,
      medio: medioEditado,
      concepto: conceptoTexto.trim(),
      ...(periodos && periodoEditado ? { periodoId: periodoEditado } : {}),
    })
    setFormAbierto(false)
  }

  const contenidoFila = (
    <>
      <span className="flex flex-col gap-0.5">
        <span className="text-[12.5px] text-ink-faint">
          {etiquetaDia(movimiento.fecha)} · {movimiento.medio === 'efectivo' ? 'Efectivo' : 'Transferencia'}
        </span>
        <span className="text-[15px] leading-snug text-ink">{movimiento.concepto}</span>
        {movimiento.cuotaTotal ? (
          <span className="text-[11.5px] text-ink-faint">
            {movimiento.categoria ? `${CATEGORIA_LABEL[movimiento.categoria]} · ` : ''}
            Cuota {movimiento.cuotaNumero}/{movimiento.cuotaTotal}
          </span>
        ) : null}
      </span>
      <span className={`shrink-0 font-mono text-[14px] ${signo === '+' ? 'text-good' : 'text-ink-dim'}`}>
        {signo}
        {formatearMonto(movimiento.monto, moneda)}
      </span>
    </>
  )

  return (
    <li className="border-b border-border/40 py-2 last:border-b-0">
      {tieneAcciones ? (
        <button
          type="button"
          className="flex w-full appearance-none items-baseline justify-between gap-3 border-0 bg-transparent p-0 text-left"
          onClick={alternarInteraccion}
        >
          {contenidoFila}
        </button>
      ) : (
        <div className="flex items-baseline justify-between gap-3">{contenidoFila}</div>
      )}

      {interactuando ? (
        <div className="mt-1 flex flex-wrap gap-3">
          {onCambiarCategoria ? (
            <button type="button" className="idea-destino" onClick={() => setCategoriaAbierta((actual) => !actual)}>
              {categoriaAbierta ? 'Cancelar' : 'Editar categoría'}
            </button>
          ) : null}
          {onConvertirAIngreso ? (
            <button type="button" className="idea-destino" onClick={onConvertirAIngreso}>
              Es un ingreso
            </button>
          ) : null}
          {onEditar ? (
            <button type="button" className="idea-destino" onClick={() => (formAbierto ? setFormAbierto(false) : abrirForm())}>
              {formAbierto ? 'Cancelar' : 'Editar'}
            </button>
          ) : null}
          {onEliminar ? (
            <button type="button" className="idea-destino" onClick={() => setConfirmandoBorrado((actual) => !actual)}>
              Eliminar
            </button>
          ) : null}
        </div>
      ) : null}

      {categoriaAbierta && onCambiarCategoria ? (
        <div className="idea-destinos mt-2" role="group" aria-label="Elegir categoría">
          {CATEGORIAS.map((categoria) => (
            <button
              key={categoria}
              type="button"
              className="idea-destino"
              onClick={() => {
                onCambiarCategoria(categoria)
                setCategoriaAbierta(false)
              }}
            >
              {CATEGORIA_LABEL[categoria]}
            </button>
          ))}
        </div>
      ) : null}

      {formAbierto && onEditar ? (
        <div className="mt-2 flex flex-col gap-2">
          <input
            type="text"
            value={conceptoTexto}
            onChange={(event) => setConceptoTexto(event.target.value)}
            aria-label="Concepto"
            placeholder="Concepto"
            className="border-b border-border/60 bg-transparent px-1 py-1.5 text-[14px] text-ink outline-none placeholder:text-ink-dim"
          />
          <div className="flex items-center gap-3">
            <input
              type="text"
              inputMode="decimal"
              value={montoTexto}
              onChange={(event) => setMontoTexto(event.target.value)}
              aria-label="Monto"
              className="min-w-0 flex-1 border-b border-border/60 bg-transparent px-1 py-1.5 font-mono text-[14px] text-ink outline-none"
            />
            {haySelectorPeriodo ? null : (
              <input
                type="date"
                value={fechaTexto}
                onChange={(event) => setFechaTexto(event.target.value)}
                aria-label="Fecha"
                className="shrink-0 border-b border-border/60 bg-transparent px-1 py-1.5 font-mono text-[13px] text-ink outline-none"
              />
            )}
          </div>
          <div className="idea-destinos" role="group" aria-label="Moneda">
            {(['ars', 'usd'] as const).map((opcion) => (
              <button
                key={opcion}
                type="button"
                className="idea-destino"
                aria-pressed={monedaEditada === opcion}
                style={monedaEditada === opcion ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
                onClick={() => {
                  if (opcion === monedaEditada) return
                  setMonedaEditada(opcion)
                  setMontoTexto('')
                }}
              >
                {opcion === 'ars' ? 'Pesos' : 'Dólares'}
              </button>
            ))}
          </div>
          <div className="idea-destinos" role="group" aria-label="Medio">
            {(['efectivo', 'transferencia'] as const).map((opcion) => (
              <button
                key={opcion}
                type="button"
                className="idea-destino"
                aria-pressed={medioEditado === opcion}
                style={medioEditado === opcion ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
                onClick={() => {
                  if (opcion === medioEditado) return
                  setMedioEditado(opcion)
                  setMontoTexto('')
                }}
              >
                {opcion === 'efectivo' ? 'Efectivo' : 'Transferencia'}
              </button>
            ))}
          </div>
          {haySelectorPeriodo && periodos ? (
            <div className="idea-destinos" role="group" aria-label="Período">
              {periodos.map((periodo) => (
                <button
                  key={periodo.id}
                  type="button"
                  className="idea-destino"
                  aria-pressed={periodoEditado === periodo.id}
                  style={periodoEditado === periodo.id ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
                  onClick={() => setPeriodoEditado(periodo.id)}
                >
                  Semana {numeroDeSemana(periodo, periodos)} · {periodo.nombre}
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            className="idea-destino self-start disabled:opacity-40"
            disabled={!puedeGuardar}
            onClick={guardarEdicion}
          >
            Guardar
          </button>
        </div>
      ) : null}

      {confirmandoBorrado && onEliminar ? (
        <div className="mt-2 flex items-center gap-3">
          <span className="text-[13px] text-ink-faint">¿Eliminar este movimiento?</span>
          <button
            type="button"
            className="idea-destino"
            style={{ color: 'var(--critical)', borderColor: 'var(--critical)' }}
            onClick={() => {
              onEliminar()
              setConfirmandoBorrado(false)
            }}
          >
            Sí, eliminar
          </button>
          <button type="button" className="idea-destino" onClick={() => setConfirmandoBorrado(false)}>
            No
          </button>
        </div>
      ) : null}
    </li>
  )
}
