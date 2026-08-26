import { useState } from 'react'
import { CATEGORIAS, CATEGORIA_LABEL, type FinanceCategoria } from './categorias'
import { dividirEnCuotas, parsearMontoManual, type Medio, type Moneda } from './extraccion'
import type { NuevaCompraEnCuotas, NuevaFinanceMovimiento } from './financeRepository'
import { etiquetaSemana, formatearMonto, mesDe, rangoSemana, semanaDelMes } from './mes'
import { numeroDeSemana } from './semanaCobro'
import type { FinanceIncomePeriod, FinanceMovimientoTipo } from '@/types/finance'

interface NuevoMovimientoProps {
  /** Arranca en la moneda que ya se está mirando en Finanzas — no inventa un tercer estado de moneda. */
  monedaDefault: Moneda
  /** Mini Sprint 032 (§2) — cuando se abre desde "+ Agregar ingreso" de una semana, el tipo queda fijo y el toggle Se fue/Ingresos no se muestra. */
  tipoFijo?: FinanceMovimientoTipo
  /**
   * Sprint 039 — "+ Agregar ingreso" es una acción global: se pasa la
   * lista completa de semanas para que el usuario elija a cuál pertenece
   * este ingreso. Elegir una semana determina también su fecha (lunes de
   * esa semana) — no hay un campo de fecha aparte que pueda contradecirla
   * (mini sprint "Reconstruir UX de Ingresos": una sola fuente de verdad
   * para "cuándo es esto", nunca dos fechas visibles a la vez).
   */
  periodos?: readonly FinanceIncomePeriod[]
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
export function NuevoMovimiento({
  monedaDefault,
  tipoFijo,
  periodos,
  onGuardar,
  onGuardarCompra,
  onCerrar,
}: NuevoMovimientoProps) {
  const [tipo, setTipo] = useState<FinanceMovimientoTipo>(tipoFijo ?? 'egreso')
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState<FinanceCategoria | null>(null)
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [moneda, setMoneda] = useState<Moneda>(monedaDefault)
  const [medio] = useState<Medio>('transferencia')
  const [cuotas, setCuotas] = useState('1')
  const [guardando, setGuardando] = useState(false)
  /** Sprint 039 — solo se usa cuando hay `periodos` (acción global "+ Agregar ingreso"). */
  const [periodoElegidoId, setPeriodoElegidoId] = useState<string | undefined>(() => periodos?.[0]?.id)
  /**
   * Mini sprint "Reconstruir Ingresos, tres montos independientes" — un
   * ingreso semanal casi siempre mezcla efectivo en pesos, dólares y
   * transferencia, los tres a la vez. Antes había un solo `monto` +
   * selectores de moneda/medio que lo pisaban al cambiar de opción
   * (`setMonto('')`) — acá cada uno tiene su propio estado, así que
   * cargar o editar uno nunca borra a los otros dos.
   */
  const [montoEfectivoArs, setMontoEfectivoArs] = useState('')
  const [montoDolares, setMontoDolares] = useState('')
  const [montoTransferenciaArs, setMontoTransferenciaArs] = useState('')

  const mostrarSelectorPeriodo = tipo === 'ingreso' && periodos !== undefined
  const periodoElegido = mostrarSelectorPeriodo ? periodos?.find((p) => p.id === periodoElegidoId) : undefined
  /**
   * Cuando hay semana elegida, su lunes ES la fecha del ingreso — no hay
   * un campo de fecha visible que pueda contradecirla. `fecha` (el input
   * libre, solo para egresos) queda intacto para ese otro caso.
   */
  const fechaEfectiva = mostrarSelectorPeriodo ? (periodoElegido?.fechaInicio ?? fecha) : fecha

  const montoNumero = parsearMontoManual(monto) ?? NaN
  const cuotasNumero = Number(cuotas)
  const esCompraEnCuotas = tipo === 'egreso' && Number.isFinite(cuotasNumero) && cuotasNumero >= 2
  /** Base para las 4 chips de "Semana del mes" (Fix 3) — siempre el mes real de hoy, igual que `semanaActual` en FinanceScreen. */
  const mesEnCurso = mesDe(new Date())

  /** Los tres baldes de un ingreso — solo entra al guardar el que de verdad tiene algo cargado, cada uno como su propia moneda/medio real (nunca sumados). */
  const efectivoArsNumero = parsearMontoManual(montoEfectivoArs)
  const dolaresNumero = parsearMontoManual(montoDolares)
  const transferenciaArsNumero = parsearMontoManual(montoTransferenciaArs)
  const baldesIngreso: { monto: number; moneda: Moneda; medio: Medio }[] = (
    [
      efectivoArsNumero !== null && efectivoArsNumero > 0 ? { monto: efectivoArsNumero, moneda: 'ars', medio: 'efectivo' } : null,
      dolaresNumero !== null && dolaresNumero > 0 ? { monto: dolaresNumero, moneda: 'usd', medio: 'efectivo' } : null,
      transferenciaArsNumero !== null && transferenciaArsNumero > 0 ? { monto: transferenciaArsNumero, moneda: 'ars', medio: 'transferencia' } : null,
    ] as const
  ).filter((balde): balde is { monto: number; moneda: Moneda; medio: Medio } => balde !== null)

  /** Mini Sprint 032 (§3) — el concepto es opcional para un ingreso: no todo ingreso tiene algo que contar más allá de cuánto entró. */
  const esValido =
    tipo === 'ingreso'
      ? baldesIngreso.length > 0 && (!mostrarSelectorPeriodo || periodoElegidoId !== undefined)
      : concepto.trim().length > 0 && Number.isFinite(montoNumero) && montoNumero > 0

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!esValido || guardando) return
    setGuardando(true)
    const conceptoFinal = concepto.trim() || (tipo === 'ingreso' ? 'Ingreso' : concepto)
    if (tipo === 'ingreso') {
      /** Cada balde cargado se guarda como su propio movimiento independiente — la semana sigue siendo una sola, comparten el mismo `periodoId`. */
      for (const balde of baldesIngreso) {
        await onGuardar({
          tipo: 'ingreso',
          monto: balde.monto,
          concepto: conceptoFinal,
          categoria: null,
          moneda: balde.moneda,
          medio: balde.medio,
          fecha: fechaEfectiva,
          ...(periodoElegidoId ? { periodoId: periodoElegidoId } : {}),
        })
      }
    } else if (esCompraEnCuotas) {
      await onGuardarCompra({
        concepto: conceptoFinal,
        montoTotal: montoNumero,
        cantidadCuotas: cuotasNumero,
        categoria,
        moneda,
        medio,
        fecha: fechaEfectiva,
      })
    } else {
      await onGuardar({
        tipo,
        monto: montoNumero,
        concepto: conceptoFinal,
        categoria,
        moneda,
        medio,
        fecha: fechaEfectiva,
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

      {tipo === 'ingreso' ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[12.5px] text-ink-faint">Efectivo (ARS)</span>
            <input
              type="text"
              inputMode="decimal"
              value={montoEfectivoArs}
              onChange={(event) => setMontoEfectivoArs(event.target.value)}
              placeholder="0"
              aria-label="Efectivo (ARS)"
              className="border-b border-border/60 bg-transparent px-1 py-2 font-mono text-[15px] text-ink outline-none placeholder:text-ink-dim"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12.5px] text-ink-faint">Dólares (USD)</span>
            <input
              type="text"
              inputMode="decimal"
              value={montoDolares}
              onChange={(event) => setMontoDolares(event.target.value)}
              placeholder="0"
              aria-label="Dólares (USD)"
              className="border-b border-border/60 bg-transparent px-1 py-2 font-mono text-[15px] text-ink outline-none placeholder:text-ink-dim"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12.5px] text-ink-faint">Transferencia (ARS)</span>
            <input
              type="text"
              inputMode="decimal"
              value={montoTransferenciaArs}
              onChange={(event) => setMontoTransferenciaArs(event.target.value)}
              placeholder="0"
              aria-label="Transferencia (ARS)"
              className="border-b border-border/60 bg-transparent px-1 py-2 font-mono text-[15px] text-ink outline-none placeholder:text-ink-dim"
            />
          </label>
        </div>
      ) : (
        <input
          type="text"
          inputMode="decimal"
          value={monto}
          onChange={(event) => setMonto(event.target.value)}
          placeholder="Monto (100.000)"
          aria-label="Monto"
          className="border-b border-border/60 bg-transparent px-1 py-2 font-mono text-[15px] text-ink outline-none placeholder:text-ink-dim"
        />
      )}

      {mostrarSelectorPeriodo ? (
        periodos && periodos.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-[11.5px] text-ink-faint">¿A qué semana pertenece este ingreso?</p>
            <div className="idea-destinos" role="group" aria-label="Semana de cobro">
              {periodos.map((periodo) => (
                <button
                  key={periodo.id}
                  type="button"
                  className="idea-destino"
                  aria-pressed={periodoElegidoId === periodo.id}
                  style={periodoElegidoId === periodo.id ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
                  onClick={() => setPeriodoElegidoId(periodo.id)}
                >
                  Semana {numeroDeSemana(periodo, periodos)} · {periodo.nombre}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-ink-faint">
            Todavía no hay ninguna semana de cobro. Cerrá este formulario y creá una con "+ Semana de cobro".
          </p>
        )
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
        {mostrarSelectorPeriodo ? null : (
          <input
            type="date"
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
            aria-label="Fecha"
            className="border-b border-border/60 bg-transparent px-1 py-2 font-mono text-[13.5px] text-ink outline-none"
          />
        )}
        {tipo === 'egreso' ? (
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
        ) : null}
      </div>

      {tipo === 'egreso' ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11.5px] text-ink-faint">¿De qué semana del mes es este gasto?</p>
          <div className="idea-destinos" role="group" aria-label="Semana del mes">
            {([1, 2, 3, 4] as const).map((numero) => {
              const activa = fecha.startsWith(mesEnCurso) && semanaDelMes(fecha) === numero
              return (
                <button
                  key={numero}
                  type="button"
                  className="idea-destino"
                  aria-pressed={activa}
                  style={activa ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
                  onClick={() => {
                    const { desde } = rangoSemana(mesEnCurso, numero)
                    setFecha(`${mesEnCurso}-${String(desde).padStart(2, '0')}`)
                  }}
                >
                  Semana {numero} · {etiquetaSemana(mesEnCurso, numero)}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <button type="submit" disabled={!esValido || guardando} className="accion-primaria self-start px-3.5 py-2 text-[13.5px] disabled:opacity-40">
        Guardar
      </button>
    </form>
  )
}
