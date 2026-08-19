import { useState } from 'react'
import { CATEGORIAS, CATEGORIA_LABEL, type FinanceCategoria } from './categorias'
import { etiquetaDia, formatearMonto } from './mes'
import { parsearMontoManual } from './extraccion'
import type { FinanceMovimiento } from '@/types/finance'
import type { Moneda } from './extraccion'

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
   * Mini Sprint 029.1 (§4/§5/§6) — corrige monto y/o fecha de un
   * movimiento ya existente. Quien llama a esto decide si lo ofrece: una
   * cuota (`compraId`) nunca recibe esta prop (§10 — no hay decisión de
   * producto tomada sobre qué le pasa a las cuotas hermanas).
   */
  onEditar?: ((patch: { monto: number; fecha: string }) => void) | undefined
  /** Mini Sprint 029.1 (§7) — borra este movimiento. Mismo cuidado con cuotas que `onEditar`. */
  onEliminar?: (() => void) | undefined
}

/** Una fila de movimiento dentro de los detalles de Entró/Se fue (Sprint 016). */
export function MovimientoRow({ movimiento, moneda, signo = '', onCambiarCategoria, onEditar, onEliminar }: MovimientoRowProps) {
  const [categoriaAbierta, setCategoriaAbierta] = useState(false)
  const [formAbierto, setFormAbierto] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
  const [montoTexto, setMontoTexto] = useState(() => String(movimiento.monto))
  const [fechaTexto, setFechaTexto] = useState(movimiento.fecha)

  const montoEditado = parsearMontoManual(montoTexto)
  const puedeGuardar = montoEditado !== null && fechaTexto.length === 10

  function abrirForm() {
    setMontoTexto(String(movimiento.monto))
    setFechaTexto(movimiento.fecha)
    setFormAbierto(true)
  }

  function guardarEdicion() {
    if (!onEditar || montoEditado === null) return
    onEditar({ monto: montoEditado, fecha: fechaTexto })
    setFormAbierto(false)
  }

  return (
    <li className="border-b border-border/40 py-2 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex flex-col gap-0.5">
          <span className="text-[12.5px] text-ink-faint">{etiquetaDia(movimiento.fecha)}</span>
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
      </div>

      <div className="mt-1 flex flex-wrap gap-3">
        {onCambiarCategoria ? (
          <button type="button" className="idea-destino" onClick={() => setCategoriaAbierta((actual) => !actual)}>
            {categoriaAbierta ? 'Cancelar' : 'Editar categoría'}
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
          <div className="flex items-center gap-3">
            <input
              type="text"
              inputMode="decimal"
              value={montoTexto}
              onChange={(event) => setMontoTexto(event.target.value)}
              aria-label="Monto"
              className="min-w-0 flex-1 border-b border-border/60 bg-transparent px-1 py-1.5 font-mono text-[14px] text-ink outline-none"
            />
            <input
              type="date"
              value={fechaTexto}
              onChange={(event) => setFechaTexto(event.target.value)}
              aria-label="Fecha"
              className="shrink-0 border-b border-border/60 bg-transparent px-1 py-1.5 font-mono text-[13px] text-ink outline-none"
            />
          </div>
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
