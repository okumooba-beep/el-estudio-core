import { CATEGORIA_LEXICO, type FinanceCategoria } from './categorias'
import type { FinanceMovimientoTipo } from '@/types/finance'

export interface MovimientoExtraido {
  /** null cuando el texto no trae un número reconocible: la captura llega igual, incompleta. */
  monto: number | null
  tipo: FinanceMovimientoTipo
  categoria: FinanceCategoria
  /** true solo si el léxico acertó una categoría; con `false` cayó en 'otros'. */
  categoriaSegura: boolean
}

/** "cobré", "me pagaron", "me depositaron" → entra plata. Todo lo demás sale. */
const VERBOS_INGRESO = ['cobré', 'cobre ', 'me pagaron', 'me depositaron', 'me transfirieron',
  'ingreso', 'ingresó', 'ingresé', 'entró', 'entro ', 'recibí', 'recibi ', 'facturé', 'facture ',
  'sueldo', 'honorarios', 'venta']

/**
 * Multiplicadores del habla real, no del teclado numérico. Nadie
 * escribe "80000" en el Umbral: escribe "80k", "80 mil" o "80 lucas".
 * Que "80k" no se reconociera era el agujero que dejaba las capturas de
 * gasto sin monto.
 */
const MULTIPLICADORES: readonly { patron: RegExp; factor: number }[] = [
  { patron: /(\d+(?:[.,]\d+)?)\s*(?:k|mil)\b/i, factor: 1_000 },
  { patron: /(\d+(?:[.,]\d+)?)\s*(?:luca|lucas)\b/i, factor: 1_000 },
  { patron: /(\d+(?:[.,]\d+)?)\s*(?:palo|palos|millon|millón|millones|m)\b/i, factor: 1_000_000 },
]

/** `$35.000`, `35.000 pesos`, `1.250,50`. El punto es miles y la coma decimales. */
const MONTO_PLANO =
  /\$\s?(\d[\d.]*(?:,\d+)?)|(\d{1,3}(?:\.\d{3})+(?:,\d+)?)\s*(?:pesos|d[oó]lares|dolares|usd)?|(\d+(?:,\d+)?)\s*(?:pesos|d[oó]lares|dolares|usd|\$)/i

function aNumero(bruto: string, factor: number): number {
  const normalizado = factor === 1 ? bruto.replace(/\./g, '').replace(',', '.') : bruto.replace(',', '.')
  // A dos decimales, no a entero: "1.250,50" tiene centavos y "80.5k"
  // da 80500.00000000001 en coma flotante si no se redondea.
  return Math.round(Number(normalizado) * factor * 100) / 100
}

export function extraerMonto(texto: string): number | null {
  for (const { patron, factor } of MULTIPLICADORES) {
    const encontrado = patron.exec(texto)
    if (encontrado?.[1]) return aNumero(encontrado[1], factor)
  }
  const plano = MONTO_PLANO.exec(texto)
  const bruto = plano?.[1] ?? plano?.[2] ?? plano?.[3]
  return bruto ? aNumero(bruto, 1) : null
}

export function extraerTipo(texto: string): FinanceMovimientoTipo {
  const normalizado = texto.toLowerCase()
  return VERBOS_INGRESO.some((verbo) => normalizado.includes(verbo)) ? 'ingreso' : 'egreso'
}

export function extraerCategoria(texto: string): { categoria: FinanceCategoria; segura: boolean } {
  const normalizado = texto.toLowerCase()
  for (const [categoria, palabras] of Object.entries(CATEGORIA_LEXICO)) {
    if (palabras.some((palabra) => normalizado.includes(palabra))) {
      return { categoria: categoria as FinanceCategoria, segura: true }
    }
  }
  return { categoria: 'otros', segura: false }
}

/**
 * Motor de movimientos (Sprint de Producto 004). Convierte lo que
 * escribiste en el Umbral —"Gasté 80k en gasolina"— en las tres cosas
 * que Finanzas necesita: cuánto, si entra o sale, y de qué se trata.
 *
 * Es el paso que faltaba para que EL_ESTUDIO_CORE.md se cumpla:
 * "Simplemente registras. Al finalizar la semana El Estudio agrupa
 * automáticamente esos movimientos." Sin extracción no hay agrupación,
 * y sin agrupación cualquier gráfico es una pantalla vacía.
 *
 * Nunca inventa un monto. Si el texto no trae número, `monto` queda en
 * null y la captura espera en Finanzas hasta que la completes — el
 * Contrato del Umbral §10: el Umbral resuelve dónde, el módulo resuelve
 * qué falta.
 */
export function extraerMovimiento(texto: string): MovimientoExtraido {
  const { categoria, segura } = extraerCategoria(texto)
  return { monto: extraerMonto(texto), tipo: extraerTipo(texto), categoria, categoriaSegura: segura }
}
