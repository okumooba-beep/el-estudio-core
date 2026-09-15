import { useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { CATEGORIAS, CATEGORIA_LABEL, type FinanceCategoria } from './categorias'
import { formatearMonto, mesDe } from './mes'
import { parsearMontoManual } from './extraccion'
import type { NuevaFinanceGastoFijo } from './gastosFijosRepository'
import type { FinanceGastoFijo, FinanceMovimiento } from '@/types/finance'

interface GastosFijosDetalleProps {
  gastosFijos: readonly FinanceGastoFijo[]
  /** Movimientos ya sin borrar (mismo `engine.movimientos`) — acá adentro se filtra por mes y por `gastoFijoId`. */
  movimientos: readonly FinanceMovimiento[]
  /** Tilda un gasto fijo a mano: crea el movimiento de egreso ya vinculado (`gastoFijoId`). */
  onTildar(gastoFijo: FinanceGastoFijo, monto: number): void
  onCrear(input: NuevaFinanceGastoFijo): void
  onEditar(id: string, patch: Partial<Omit<FinanceGastoFijo, 'id' | 'createdAt'>>): void
  onCerrar(): void
}

type Vista = { tipo: 'lista' } | { tipo: 'nuevo' } | { tipo: 'editar'; id: string }

/**
 * "Gastos fijos mensuales" — checklist mensual, exclusivo de Finanzas
 * general. "Pagado este mes" nunca se guarda como flag: se calcula acá
 * mismo buscando, entre `movimientos`, uno con `gastoFijoId === gf.id`
 * y `fecha` en el mes en curso (`mesDe`) — así el mes "se reinicia solo"
 * sin ningún código de reseteo: en cuanto cambia el mes, ningún
 * movimiento nuevo matchea todavía y todos los gastos fijos vuelven a
 * aparecer sin tildar.
 */
export function GastosFijosDetalle({ gastosFijos, movimientos, onTildar, onCrear, onEditar, onCerrar }: GastosFijosDetalleProps) {
  const [vista, setVista] = useState<Vista>({ tipo: 'lista' })
  const [verInactivos, setVerInactivos] = useState(false)
  /** Cuando un gasto fijo sin `montoEsperado` se tilda, pide el monto antes de crear el movimiento — acá se guarda cuál está pidiéndolo. */
  const [pidiendoMontoId, setPidiendoMontoId] = useState<string | null>(null)
  const [montoPedido, setMontoPedido] = useState('')

  const mesActual = mesDe(new Date())
  function pagadoEsteMes(gastoFijo: FinanceGastoFijo): FinanceMovimiento | undefined {
    return movimientos.find((m) => m.gastoFijoId === gastoFijo.id && m.fecha.startsWith(mesActual))
  }

  const activos = gastosFijos.filter((gf) => gf.activo)
  const inactivos = gastosFijos.filter((gf) => !gf.activo)
  const pagos = activos.map((gf) => ({ gastoFijo: gf, movimiento: pagadoEsteMes(gf) }))
  const cantidadPagados = pagos.filter((p) => p.movimiento).length
  const totalEsperado = activos.reduce((total, gf) => total + (gf.montoEsperado ?? 0), 0)
  const totalPagado = pagos.reduce((total, p) => total + (p.movimiento?.monto ?? 0), 0)

  function tildar(gastoFijo: FinanceGastoFijo) {
    if (gastoFijo.montoEsperado !== undefined) {
      onTildar(gastoFijo, gastoFijo.montoEsperado)
      return
    }
    setPidiendoMontoId(gastoFijo.id)
    setMontoPedido('')
  }

  function confirmarMontoPedido(gastoFijo: FinanceGastoFijo) {
    const monto = parsearMontoManual(montoPedido)
    if (monto === null || monto <= 0) return
    onTildar(gastoFijo, monto)
    setPidiendoMontoId(null)
    setMontoPedido('')
  }

  if (vista.tipo === 'nuevo' || vista.tipo === 'editar') {
    const editando = vista.tipo === 'editar' ? gastosFijos.find((gf) => gf.id === vista.id) : undefined
    return (
      <GastoFijoForm
        gastoFijo={editando}
        onGuardar={(input) => {
          if (editando) onEditar(editando.id, input)
          else onCrear(input)
          setVista({ tipo: 'lista' })
        }}
        onToggleActivo={editando ? (activo) => onEditar(editando.id, { activo }) : undefined}
        onCerrar={() => setVista({ tipo: 'lista' })}
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 pb-10">
      <button type="button" className="idea-destino self-start" onClick={onCerrar}>
        ‹ Finanzas
      </button>

      <section className="flex flex-col items-center gap-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent">Gastos fijos</p>
      </section>

      {activos.length === 0 ? (
        <EmptyState
          title="Todavía no cargaste ningún gasto fijo."
          description="Alquiler, servicios, suscripciones — lo que se repite todos los meses."
        />
      ) : (
        <section className="finanzas-tarjeta flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] text-ink-dim">
              {cantidadPagados} de {activos.length} gastos fijos pagados este mes
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-ink-faint">Esperado</span>
            <span className="font-mono text-[14px] text-ink-dim">{formatearMonto(totalEsperado, 'ars')}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-ink-faint">Pagado</span>
            <span className="font-mono text-[14px] text-good">{formatearMonto(totalPagado, 'ars')}</span>
          </div>
        </section>
      )}

      {activos.length > 0 ? (
        <section className="finanzas-tarjeta">
          <ul className="flex flex-col">
            {pagos.map(({ gastoFijo, movimiento }) => (
              <li key={gastoFijo.id} className="flex flex-col gap-1.5 border-b border-border/40 py-3 last:border-b-0">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(movimiento)}
                    disabled={Boolean(movimiento)}
                    aria-label={`${gastoFijo.nombre} pagado este mes`}
                    onChange={() => tildar(gastoFijo)}
                  />
                  <button
                    type="button"
                    className="flex flex-1 items-baseline justify-between gap-3 border-0 bg-transparent p-0 text-left"
                    onClick={() => setVista({ tipo: 'editar', id: gastoFijo.id })}
                  >
                    <span className="text-[15px] text-ink">{gastoFijo.nombre}</span>
                    <span className="font-mono text-[14px] text-ink-dim">
                      {movimiento
                        ? formatearMonto(movimiento.monto, 'ars')
                        : gastoFijo.montoEsperado !== undefined
                          ? formatearMonto(gastoFijo.montoEsperado, 'ars')
                          : '—'}
                    </span>
                  </button>
                </div>
                {pidiendoMontoId === gastoFijo.id ? (
                  <div className="ml-8 flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      autoFocus
                      value={montoPedido}
                      onChange={(event) => setMontoPedido(event.target.value)}
                      placeholder="¿Cuánto pagaste?"
                      aria-label="Monto pagado"
                      className="w-32 border-b border-border/60 bg-transparent px-1 py-1 font-mono text-[14px] text-ink outline-none placeholder:text-ink-dim"
                    />
                    <button type="button" className="idea-destino" onClick={() => confirmarMontoPedido(gastoFijo)}>
                      Confirmar
                    </button>
                    <button type="button" className="idea-destino" onClick={() => setPidiendoMontoId(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {inactivos.length > 0 ? (
        <section className="finanzas-tarjeta flex flex-col gap-1.5">
          <button
            type="button"
            className="flex items-center justify-between gap-2 text-left"
            aria-expanded={verInactivos}
            onClick={() => setVerInactivos((actual) => !actual)}
          >
            <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Desactivados</h2>
            <span aria-hidden className="font-mono text-[11px] text-ink-dim">
              {verInactivos ? '−' : '+'}
            </span>
          </button>
          {verInactivos ? (
            <ul className="flex flex-col">
              {inactivos.map((gf) => (
                <li key={gf.id} className="flex items-center justify-between gap-3 border-b border-border/40 py-3 last:border-b-0">
                  <button
                    type="button"
                    className="border-0 bg-transparent p-0 text-left text-[15px] text-ink-dim"
                    onClick={() => setVista({ tipo: 'editar', id: gf.id })}
                  >
                    {gf.nombre}
                  </button>
                  <button type="button" className="idea-destino" onClick={() => onEditar(gf.id, { activo: true })}>
                    Reactivar
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="flex justify-center pt-1">
        <button type="button" className="idea-destino" onClick={() => setVista({ tipo: 'nuevo' })}>
          + Gasto fijo
        </button>
      </section>
    </div>
  )
}

interface GastoFijoFormProps {
  gastoFijo?: FinanceGastoFijo | undefined
  onGuardar(input: NuevaFinanceGastoFijo): void
  /** Solo presente cuando se está editando: activar/desactivar es independiente del resto del formulario, se guarda al toque. */
  onToggleActivo?: ((activo: boolean) => void) | undefined
  onCerrar(): void
}

function GastoFijoForm({ gastoFijo, onGuardar, onToggleActivo, onCerrar }: GastoFijoFormProps) {
  const [nombre, setNombre] = useState(gastoFijo?.nombre ?? '')
  const [palabraClave, setPalabraClave] = useState(gastoFijo?.palabraClave ?? '')
  const [categoria, setCategoria] = useState<FinanceCategoria | null>(gastoFijo?.categoria ?? null)
  const [montoEsperado, setMontoEsperado] = useState(gastoFijo?.montoEsperado !== undefined ? String(gastoFijo.montoEsperado) : '')

  const montoNumero = montoEsperado.trim() === '' ? undefined : (parsearMontoManual(montoEsperado) ?? undefined)
  const esValido = nombre.trim().length > 0 && palabraClave.trim().length > 0

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!esValido) return
    onGuardar({
      nombre: nombre.trim(),
      palabraClave: palabraClave.trim(),
      categoria,
      ...(montoNumero !== undefined ? { montoEsperado: montoNumero } : {}),
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 pb-10">
      <form onSubmit={handleSubmit} className="finanzas-tarjeta flex flex-col gap-6">
        <button type="button" className="idea-destino self-start" onClick={onCerrar}>
          ‹ Gastos fijos
        </button>

        <section className="flex flex-col items-center gap-3">
          <p className="font-mono text-[11px] uppercase tracking-wide text-accent">
            {gastoFijo ? 'Editar gasto fijo' : '+ Gasto fijo'}
          </p>
        </section>

        <div className="finanzas-tarjeta flex flex-col gap-3">
          <input
            type="text"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Nombre (ej. Alquiler casa)"
            aria-label="Nombre"
            className="border-b border-border/60 bg-transparent px-1 py-2 text-[15px] text-ink outline-none placeholder:text-ink-dim"
          />
          <input
            type="text"
            value={palabraClave}
            onChange={(event) => setPalabraClave(event.target.value)}
            placeholder="Palabra clave para detección (ej. alquiler)"
            aria-label="Palabra clave"
            className="border-b border-border/60 bg-transparent px-1 py-2 text-[15px] text-ink outline-none placeholder:text-ink-dim"
          />
          <input
            type="text"
            inputMode="decimal"
            value={montoEsperado}
            onChange={(event) => setMontoEsperado(event.target.value)}
            placeholder="Monto esperado (opcional)"
            aria-label="Monto esperado"
            className="border-b border-border/60 bg-transparent px-1 py-2 font-mono text-[15px] text-ink outline-none placeholder:text-ink-dim"
          />
        </div>

        <div className="finanzas-tarjeta flex flex-col gap-3">
          <p className="finanzas-form-bloque-titulo">Categoría</p>
          <div className="finanzas-categorias" role="group" aria-label="Categoría">
            {CATEGORIAS.map((opcion) => (
              <button
                key={opcion}
                type="button"
                className="finanzas-categoria-chip"
                aria-pressed={categoria === opcion}
                onClick={() => setCategoria((actual) => (actual === opcion ? null : opcion))}
              >
                {CATEGORIA_LABEL[opcion]}
              </button>
            ))}
          </div>
        </div>

        {gastoFijo && onToggleActivo ? (
          <label className="flex items-center gap-2 text-[14px] text-ink-dim">
            <input type="checkbox" checked={gastoFijo.activo} onChange={(event) => onToggleActivo(event.target.checked)} />
            Activo
          </label>
        ) : null}

        <button type="submit" disabled={!esValido} className="accion-primaria finanzas-guardar-boton self-start disabled:opacity-40">
          Guardar
        </button>
      </form>
    </div>
  )
}
