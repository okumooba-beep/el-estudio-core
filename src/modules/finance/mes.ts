import { CATEGORIAS, type FinanceCategoria } from './categorias'
import type { Medio, Moneda } from './extraccion'
import type { FinanceMovimiento } from '@/types/finance'

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
 * Semana calendario dentro del mes (día 1-7 = semana 1, 8-14 = semana 2,
 * ...). Mini Sprint 032 (§1): ya no se capa en 4 — un mes de 29-31 días
 * abre una semana 5 real (29-31, por ejemplo) en lugar de estirar la
 * semana 4 a 8-10 días. `semanasEnMes` es el techo real para saber
 * cuántos bloques semanales mostrar, incluso los que todavía no tienen
 * ningún movimiento.
 */
export function semanaDelMes(fecha: string): number {
  const dia = Number(fecha.slice(8, 10))
  return Math.ceil(dia / 7)
}

/** Cuántas semanas calendario tiene un mes (4 o 5 según cuántos días tenga). */
export function semanasEnMes(mes: string): number {
  const anio = Number(mes.slice(0, 4))
  const mesNum = Number(mes.slice(5, 7))
  const diasEnMes = new Date(anio, mesNum, 0).getDate()
  return Math.ceil(diasEnMes / 7)
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

export function mesDe(fecha: Date): string {
  return fecha.toISOString().slice(0, 7)
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
  semana: number
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
 * recortada a la semana calendario dentro del mes (día 1-7 = semana 1,
 * igual que `semanaDelMes`, ya usado para agrupar ingresos).
 *
 * Sprint 016: además de los tres totales, ahora expone `grupos` y
 * `movimientos` (vía `resumirPeriodo`) para que el detalle de "Entró"/
 * "Se fue" tenga los mismos datos ya recortados a la semana, sin volver
 * a filtrar `movimientos` por su cuenta.
 */
export function resumirSemana(
  movimientos: readonly FinanceMovimiento[],
  mes: string,
  semana: number,
  moneda: Moneda = 'ars',
): ResumenSemana {
  const delaSemana = movimientos.filter(
    (movimiento) =>
      movimiento.fecha.startsWith(mes) && monedaDe(movimiento) === moneda && semanaDelMes(movimiento.fecha) === semana,
  )
  const base = resumirPeriodo(delaSemana, moneda)
  return { semana, entro: base.ingresado, seFue: base.gastado, teQuedo: base.balance, ...base }
}

/** Sin decimales: en pesos los centavos son ruido, y el número tiene que leerse de un vistazo. */
export function formatearMonto(monto: number, moneda: Moneda = 'ars'): string {
  const cifra = Math.round(monto).toLocaleString('es-AR')
  return moneda === 'usd' ? `US$${cifra}` : `$${cifra}`
}

/** Últimos días de una semana calendario del mes, recortados al largo real del mes (Sprint 016). */
export function rangoSemana(mes: string, semana: number): { desde: number; hasta: number } {
  const anio = Number(mes.slice(0, 4))
  const mesNum = Number(mes.slice(5, 7))
  const diasEnMes = new Date(anio, mesNum, 0).getDate()
  const desde = (semana - 1) * 7 + 1
  const hasta = Math.min(semana * 7, diasEnMes)
  return { desde, hasta }
}

/** "1–7 agosto" — la etiqueta de una semana dentro del desglose de "Entró" (Sprint 016, punto 2). */
export function etiquetaSemana(mes: string, semana: number): string {
  const { desde, hasta } = rangoSemana(mes, semana)
  const nombreMes = new Date(`${mes}-02`).toLocaleDateString('es-AR', { month: 'long' })
  return `${desde}–${hasta} ${nombreMes}`
}

/** "8 agosto" — la fecha de un movimiento individual en las listas de detalle (Sprint 016). */
export function etiquetaDia(fecha: string): string {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
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
