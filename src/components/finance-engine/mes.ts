import { CATEGORIAS, type FinanceCategoria } from './categorias'
import type { Medio, Moneda } from './extraccion'
import type { FinanceMovimiento } from '@/types/finance'
import { fechaLocalISO } from '@shared-kernel/date/fechaLocal'
import { fechaEnSemana } from './semanaCobro'

export interface GrupoCategoria {
  categoria: FinanceCategoria
  total: number
  cantidad: number
  /** Sobre el total gastado del mes, 0..1. Para el anillo y la barra. */
  parte: number
}

export interface ResumenMes {
  /** YYYY-MM */
  mes: string
  moneda: Moneda
  /** Cuánto se gastó en efectivo y cuánto por transferencia, en esta moneda. */
  porMedio: Record<Medio, number>
  gastado: number
  ingresado: number
  balance: number
  grupos: readonly GrupoCategoria[]
  movimientos: readonly FinanceMovimiento[]
  /** Sprint 007 — egresos que el léxico no clasificó con confianza: "Por revisar", nunca 'Otros'. */
  porRevisar: readonly FinanceMovimiento[]
}

/**
 * `null` es "Por revisar" (Sprint 007): un movimiento sin categoría
 * reconocida nunca se fuerza a una categoría inventada. Incluye la
 * migración de lo persistido antes de este sprint con `categoria:
 * 'otros'` — ese valor ya no es válido, se lee igual como "Por revisar".
 */
export function categoriaDe(movimiento: FinanceMovimiento): FinanceCategoria | null {
  const categoria = movimiento.categoria
  return categoria && (CATEGORIAS as readonly string[]).includes(categoria) ? (categoria as FinanceCategoria) : null
}

/** Nunca vía toISOString: corre el mes en el huso horario de Argentina cerca de medianoche (ver fechaLocalISO). */
export function mesDe(fecha: Date): string {
  return fechaLocalISO(fecha).slice(0, 7)
}

/** Desplaza un mes (YYYY-MM) `delta` meses hacia adelante (o atrás, si es negativo) — para la navegación "‹ mes ›" de "Este mes". */
export function sumarMeses(mes: string, delta: number): string {
  const anio = Number(mes.slice(0, 4))
  const mesNum = Number(mes.slice(5, 7))
  const fecha = new Date(anio, mesNum - 1 + delta, 1)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
}

/**
 * El mes agrupado (Sprint de Producto 004). Es la vista que
 * EL_ESTUDIO_CORE.md pide palabra por palabra: "Al finalizar la semana
 * El Estudio agrupa automáticamente esos movimientos. Vehículo. Comida.
 * Servicios. Ocio. Compras. Y muestra una visión clara del
 * comportamiento financiero."
 *
 * Es una función pura sobre los movimientos, no una tabla nueva: el
 * documento es explícito en que presupuestos, categorías y reportes no
 * son módulos, son vistas. Cambiar la agrupación no debería migrar
 * nunca un solo dato.
 */
/** Los movimientos anteriores al Sprint 006 no tienen moneda: son pesos. */
export function monedaDe(movimiento: FinanceMovimiento): Moneda {
  return movimiento.moneda === 'usd' ? 'usd' : 'ars'
}

export function medioDe(movimiento: FinanceMovimiento): Medio {
  return movimiento.medio === 'efectivo' ? 'efectivo' : 'transferencia'
}

interface ResumenBase {
  moneda: Moneda
  gastado: number
  ingresado: number
  balance: number
  grupos: readonly GrupoCategoria[]
  movimientos: readonly FinanceMovimiento[]
  porRevisar: readonly FinanceMovimiento[]
}

/**
 * Sprint 016 ("Finanzas como espacio de trabajo real"): el cálculo que
 * `resumirMes` ya hacía, ahora también disponible para `resumirSemana`
 * — mismo criterio de categorías/gastado/ingresado sin importar si el
 * recorte previo fue por mes o por semana, para que "Se fue" pueda
 * responder "¿en qué?" en cualquiera de los dos períodos sin un segundo
 * cálculo paralelo (punto 12: reutilizar, nunca duplicar).
 */
function resumirPeriodo(movimientos: readonly FinanceMovimiento[], moneda: Moneda): ResumenBase {
  const egresos = movimientos.filter((movimiento) => movimiento.tipo === 'egreso')
  const gastado = egresos.reduce((total, movimiento) => total + movimiento.monto, 0)
  const ingresado = movimientos
    .filter((movimiento) => movimiento.tipo === 'ingreso')
    .reduce((total, movimiento) => total + movimiento.monto, 0)

  const grupos = CATEGORIAS.map((categoria) => {
    const propios = egresos.filter((movimiento) => categoriaDe(movimiento) === categoria)
    const total = propios.reduce((suma, movimiento) => suma + movimiento.monto, 0)
    return { categoria, total, cantidad: propios.length, parte: gastado > 0 ? total / gastado : 0 }
  })
    .filter((grupo) => grupo.cantidad > 0)
    .sort((a, b) => b.total - a.total)

  const porRevisar = egresos.filter((movimiento) => categoriaDe(movimiento) === null)

  return {
    moneda,
    gastado,
    ingresado,
    balance: ingresado - gastado,
    grupos,
    movimientos: movimientos.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    porRevisar,
  }
}

export function resumirMes(
  movimientos: readonly FinanceMovimiento[],
  mes: string,
  moneda: Moneda = 'ars',
): ResumenMes {
  const delMes = movimientos.filter(
    (movimiento) => movimiento.fecha.startsWith(mes) && monedaDe(movimiento) === moneda,
  )
  const base = resumirPeriodo(delMes, moneda)
  const egresos = delMes.filter((movimiento) => movimiento.tipo === 'egreso')

  return {
    mes,
    ...base,
    porMedio: {
      efectivo: egresos.filter((m) => medioDe(m) === 'efectivo').reduce((t, m) => t + m.monto, 0),
      transferencia: egresos.filter((m) => medioDe(m) === 'transferencia').reduce((t, m) => t + m.monto, 0),
    },
  }
}

export interface ResumenSemana {
  fechaInicio: string
  fechaFin: string
  entro: number
  seFue: number
  teQuedo: number
  grupos: readonly GrupoCategoria[]
  movimientos: readonly FinanceMovimiento[]
  porRevisar: readonly FinanceMovimiento[]
}

/**
 * Vista semanal (Sprint 007): "Entró, Se fue, Te quedó", sin
 * comparaciones ni tendencias — la misma pregunta que la vista mensual,
 * recortada a una semana real (unificación de semanas, 2026-09-30:
 * `fechaInicio`/`fechaFin` son siempre lunes→domingo, el mismo criterio
 * de `semanaCobro.ts` que ya usaban los ingresos — egresos e ingresos
 * comparten ahora una sola definición de "semana", en vez de que cada
 * uno tuviera la suya).
 *
 * Sprint 016: además de los tres totales, ahora expone `grupos` y
 * `movimientos` (vía `resumirPeriodo`) para que el detalle de "Entró"/
 * "Se fue" tenga los mismos datos ya recortados a la semana, sin volver
 * a filtrar `movimientos` por su cuenta.
 */
export function resumirSemana(
  movimientos: readonly FinanceMovimiento[],
  fechaInicio: string,
  fechaFin: string,
  moneda: Moneda = 'ars',
): ResumenSemana {
  const delaSemana = movimientos.filter(
    (movimiento) => monedaDe(movimiento) === moneda && fechaEnSemana(movimiento.fecha, fechaInicio, fechaFin),
  )
  const base = resumirPeriodo(delaSemana, moneda)
  return { fechaInicio, fechaFin, entro: base.ingresado, seFue: base.gastado, teQuedo: base.balance, ...base }
}

/** Sin decimales: en pesos los centavos son ruido, y el número tiene que leerse de un vistazo. */
export function formatearMonto(monto: number, moneda: Moneda = 'ars'): string {
  const cifra = Math.round(monto).toLocaleString('es-AR')
  return moneda === 'usd' ? `US$${cifra}` : `$${cifra}`
}

/**
 * "8 agosto" — la fecha de un movimiento individual en las listas de
 * detalle (Sprint 016). `.slice(0, 10)`: `fecha` es `timestamptz` en
 * Supabase, así que una fila ya sincronizada vuelve como
 * "2026-08-08T00:00:00+00:00", no "2026-08-08" — sin el recorte,
 * `${fecha}T00:00:00` arma un string con dos horarios pegados y
 * `new Date(...)` da "Invalid Date".
 */
export function etiquetaDia(fecha: string): string {
  return new Date(`${fecha.slice(0, 10)}T00:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
}

/**
 * Sprint 016, punto 6: distingue "período en curso" de "período
 * terminado" — hoy la pantalla siempre trabaja sobre el mes actual (no
 * hay navegación a meses pasados), así que esto es siempre `true` en la
 * práctica, pero queda expresado como lo que es (una comparación contra
 * la fecha real), no como una constante, para no mentir si eso cambia.
 */
export function estaEnCurso(mes: string): boolean {
  return mes === mesDe(new Date())
}

/** "1–11 agosto" — desde el día 1 hasta hoy, para el aviso de mes en curso (Sprint 016, punto 6). */
export function etiquetaMesEnCurso(mes: string): string {
  const hoy = new Date()
  const nombreMes = new Date(`${mes}-02`).toLocaleDateString('es-AR', { month: 'long' })
  return `1–${hoy.getDate()} ${nombreMes}`
}
