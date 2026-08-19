import { useState } from 'react'
import { CATEGORIAS, CATEGORIA_LABEL, type FinanceCategoria } from './categorias'
import { dividirEnCuotas, parsearMontoManual, type Medio, type Moneda } from './extraccion'
import type { NuevaCompraEnCuotas, NuevaFinanceMovimiento } from './financeRepository'
import { formatearMonto } from './mes'
import type { FinanceMovimientoTipo } from '@/types/finance'

interface NuevoMovimientoProps {
  /** Arranca en la moneda que ya se está mirando en Finanzas — no inventa un tercer estado de moneda. */
  monedaDefault: Moneda
  /** Mini Sprint 032 (§2) — cuando se abre desde "+ Agregar ingreso" de una semana, el tipo queda fijo y el toggle Se fue/Ingresos no se muestra. */
  tipoFijo?: FinanceMovimientoTipo
  /** Mini Sprint 032 (§3) — fecha con la que arranca el formulario cuando viene de una semana puntual. */
  fechaDefault?: string
  onGuardar: (input: NuevaFinanceMovimiento) => Promise<void>
  /** Sprint 028 — mismo formulario, pero cuando hay 2+ cuotas la alta va por acá, no por `onGuardar`. */
  onGuardarCompra: (input: NuevaCompraEnCuotas) => Promise<void>
  onCerrar: () => void
}

/**
 * Sprint 019 ("Finanzas: convertir Finanzas en una herramienta de
 * control real"): la única puerta directa para registrar un movimiento
 * sin pasar por el Umbral. FinanceScreen documenta como "Principio
 * fundamental" que todo nace en el Umbral — el brief de este sprint es
 * explícito en que esa regla sigue valiendo para capturar una idea o
 * intención, pero cuando el usuario ya sabe que está registrando una
 * operación financiera ("Gasté 18.000 en supermercado") tiene que poder
 * hacerlo acá mismo, sin salir de Finanzas.
 *
 * Mismo motor que ya usa el Umbral: financeMovimientoRepository.add()
 * ya acepta tipo/monto/concepto/categoria/moneda/medio/fecha tal cual
 * los necesita este formulario — no hace falta un repositorio nuevo ni
 * un store nuevo. `medio` no es uno de los 6 campos que pide el brief,
 * así que se manda 'transferencia' por defecto, el mismo default que ya
 * usa extraccion.ts cuando el texto no trae ninguna marca.
 */
export function NuevoMovimiento({ monedaDefault, tipoFijo, fechaDefault, onGuardar, onGuardarCompra, onCerrar }: NuevoMovimientoProps) {
  const [tipo, setTipo] = useState<FinanceMovimientoTipo>(tipoFijo ?? 'egreso')
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState<FinanceCategoria | null>(null)
  const [fecha, setFecha] = useState(() => fechaDefault ?? new Date().toISOString().slice(0, 10))
  const [moneda, setMoneda] = useState<Moneda>(monedaDefault)
  const [medio, setMedio] = useState<Medio>('transferencia')
  const [cuotas, setCuotas] = useState('1')
  const [guardando, setGuardando] = useState(false)

  const montoNumero = parsearMontoManual(monto) ?? NaN
  const cuotasNumero = Number(cuotas)
  const esCompraEnCuotas = tipo === 'egreso' && Number.isFinite(cuotasNumero) && cuotasNumero >= 2
  /** Mini Sprint 032 (§3) — el concepto es opcional para un ingreso: no todo ingreso tiene algo que contar más allá de cuánto entró. */
  const esValido =
    (tipo === 'ingreso' || concepto.trim().length > 0) && Number.isFinite(montoNumero) && montoNumero > 0

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!esValido || guardando) return
    setGuardando(true)
    const conceptoFinal = concepto.trim() || (tipo === 'ingreso' ? 'Ingreso' : concepto)
    if (esCompraEnCuotas) {
      await onGuardarCompra({
        concepto: conceptoFinal,
        montoTotal: montoNumero,
        cantidadCuotas: cuotasNumero,
        categoria,
        moneda,
        medio,
        fecha,
      })
    } else {
      await onGuardar({
        tipo,
        monto: montoNumero,
        concepto: conceptoFinal,
        categoria: tipo === 'egreso' ? categoria : null,
        moneda,
        medio,
        fecha,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <button type="button" className="idea-destino self-start" onClick={onCerrar}>
        ‹ Finanzas
      </button>

      <section className="flex flex-col items-center gap-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent">
          {tipoFijo === 'ingreso' ? '+ Agregar ingreso' : '+ Movimiento'}
        </p>
        {tipoFijo ? null : (
          <div className="idea-destinos" role="group" aria-label="Tipo">
            {(['egreso', 'ingreso'] as const).map((opcion) => (
              <button
                key={opcion}
                type="button"
                className="idea-destino"
                aria-pressed={tipo === opcion}
                style={tipo === opcion ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
                onClick={() => setTipo(opcion)}
              >
                {opcion === 'ingreso' ? 'Ingresos' : 'Se fue'}
              </button>
            ))}
          </div>
        )}
      </section>

      <input
        type="text"
        value={concepto}
        onChange={(event) => setConcepto(event.target.value)}
        placeholder={tipo === 'ingreso' ? 'Concepto (opcional)' : 'Concepto'}
        aria-label="Concepto"
        className="border-b border-border/60 bg-transparent px-1 py-2 text-[15px] text-ink outline-none placeholder:text-ink-dim"
      />

      <input
        type="text"
        inputMode="decimal"
        value={monto}
        onChange={(event) => setMonto(event.target.value)}
        placeholder="Monto (100.000)"
        aria-label="Monto"
        className="border-b border-border/60 bg-transparent px-1 py-2 font-mono text-[15px] text-ink outline-none placeholder:text-ink-dim"
      />

      {tipo === 'ingreso' ? (
        <div className="idea-destinos" role="group" aria-label="Medio">
          {(['efectivo', 'transferencia'] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              className="idea-destino"
              aria-pressed={medio === opcion}
              style={medio === opcion ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
              onClick={() => {
                if (opcion === medio) return
                setMedio(opcion)
                setMonto('')
              }}
            >
              {opcion === 'efectivo' ? 'Efectivo' : 'Transferencia'}
            </button>
          ))}
        </div>
      ) : null}

      {tipo === 'egreso' ? (
        <div className="idea-destinos" role="group" aria-label="Categoría">
          {CATEGORIAS.map((opcion) => (
            <button
              key={opcion}
              type="button"
              className="idea-destino"
              aria-pressed={categoria === opcion}
              style={categoria === opcion ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
              onClick={() => setCategoria((actual) => (actual === opcion ? null : opcion))}
            >
              {CATEGORIA_LABEL[opcion]}
            </button>
          ))}
        </div>
      ) : null}

      {tipo === 'egreso' ? (
        <div className="flex items-center justify-between gap-3">
          <input
            type="number"
            step="1"
            min="1"
            inputMode="numeric"
            value={cuotas}
            onChange={(event) => setCuotas(event.target.value)}
            placeholder="Cuotas"
            aria-label="Cuotas"
            className="w-20 border-b border-border/60 bg-transparent px-1 py-2 font-mono text-[15px] text-ink outline-none placeholder:text-ink-dim"
          />
          {esCompraEnCuotas && Number.isFinite(montoNumero) && montoNumero > 0 ? (
            <p className="font-mono text-[12.5px] text-ink-faint">
              {cuotasNumero} cuotas de {formatearMonto(dividirEnCuotas(montoNumero, cuotasNumero)[0] ?? 0, moneda)}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <input
          type="date"
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          aria-label="Fecha"
          className="border-b border-border/60 bg-transparent px-1 py-2 font-mono text-[13.5px] text-ink outline-none"
        />
        <div className="idea-destinos" role="group" aria-label="Moneda">
          {(['ars', 'usd'] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              className="idea-destino"
              aria-pressed={moneda === opcion}
              style={moneda === opcion ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
              onClick={() => {
                if (opcion === moneda) return
                setMoneda(opcion)
                setMonto('')
              }}
            >
              {opcion === 'ars' ? 'Pesos' : 'Dólares'}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" disabled={!esValido || guardando} className="accion-primaria self-start px-3.5 py-2 text-[13.5px] disabled:opacity-40">
        Guardar
      </button>
    </form>
  )
}
