import { CATEGORIA_LEXICO, type FinanceCategoria } from './categorias'
import type { FinanceMovimientoTipo } from '@/types/finance'

/**
 * Un peso y un dólar no se suman jamás (Sprint 006). Antes existía un
 * solo `monto` sin moneda, así que "1.090.000 + 200 usd" entraba como
 * un único número en pesos y los dólares se perdían en silencio —
 * exactamente el error que el Contrato del Umbral existe para evitar.
 */
export type Moneda = 'ars' | 'usd'

/** Cómo se movió la plata. No es una cuenta: es una marca del movimiento. */
export type Medio = 'efectivo' | 'transferencia'

export interface MontoExtraido {
  monto: number
  moneda: Moneda
}

export interface MovimientoExtraido {
  /**
   * Todos los montos del texto, no solo el primero. "Ingreso de agosto
   * = 1.090.000 + 200 usd" son dos movimientos, y quedarse con uno
   * habría borrado el otro sin avisar.
   */
  montos: readonly MontoExtraido[]
  tipo: FinanceMovimientoTipo
  medio: Medio
  categoria: FinanceCategoria | null
  /** true solo si el léxico acertó una categoría; con `false` la categoría es `null` — "Por revisar", nunca 'otros'. */
  categoriaSegura: boolean
}

/** "cobré", "me pagaron", "ingreso" → entra plata. Todo lo demás sale. */
const VERBOS_INGRESO = ['cobré', 'cobre ', 'me pagaron', 'me depositaron', 'me transfirieron',
  'ingreso', 'ingresó', 'ingresé', 'entró', 'entro ', 'recibí', 'recibi ', 'facturé', 'facture ',
  'sueldo', 'honorarios', 'venta']

/** Marca explícita de dólar. Un `$` suelto es peso: en Argentina lo es. */
const MARCA_USD = /(?:d[oó]lar(?:es)?|usd|u\$s|us\$)/i

const MEDIO_EFECTIVO = ['efectivo', 'cash', 'en mano', 'billete']
const MEDIO_TRANSFERENCIA = ['transferencia', 'transferí', 'transferi', 'mercado pago', 'mercadopago',
  'débito', 'debito', 'tarjeta', 'crédito', 'credito', 'cbu', 'alias']

/**
 * Multiplicadores del habla real, no del teclado numérico. Nadie
 * escribe "80000" en el Umbral: escribe "80k", "80 mil" o "80 lucas".
 */
const MULTIPLICADORES: readonly { patron: RegExp; factor: number }[] = [
  { patron: /(\d+(?:[.,]\d+)?)\s*(?:k|mil)\b/gi, factor: 1_000 },
  { patron: /(\d+(?:[.,]\d+)?)\s*(?:luca|lucas)\b/gi, factor: 1_000 },
  { patron: /(\d+(?:[.,]\d+)?)\s*(?:palo|palos|millon|millón|millones)\b/gi, factor: 1_000_000 },
]

/** `$35.000`, `1.090.000`, `200 usd`, `300$`. El punto es miles y la coma decimales. */
const MONTO_PLANO =
  /(?:u\$s|us\$|usd)\s*(\d[\d.]*(?:,\d+)?)|\$\s?(\d[\d.]*(?:,\d+)?)|(\d{1,3}(?:\.\d{3})+(?:,\d+)?)|(\d+(?:,\d+)?)\s*(?:pesos|d[oó]lares|dolares|usd|u\$s|\$)/gi

function aNumero(bruto: string, factor: number): number {
  const normalizado = factor === 1 ? bruto.replace(/\./g, '').replace(',', '.') : bruto.replace(',', '.')
  // A dos decimales, no a entero: "1.250,50" tiene centavos y "80.5k"
  // da 80500.00000000001 en coma flotante si no se redondea.
  return Math.round(Number(normalizado) * factor * 100) / 100
}

/**
 * Todos los montos del texto, cada uno con su moneda, del mayor al
 * menor. La marca de moneda se busca **junto al número**, no en toda la
 * frase: "1.090.000 + 200 usd" tiene un peso y un dólar en la misma
 * línea, y mirar la frase entera los teñiría a los dos de dólar.
 */
export function extraerMontos(texto: string): MontoExtraido[] {
  const encontrados: MontoExtraido[] = []
  const ocupado = new Set<number>()

  const registrar = (indice: number, largo: number, monto: number) => {
    if (!Number.isFinite(monto) || monto <= 0) return
    for (let i = indice; i < indice + largo; i++) if (ocupado.has(i)) return
    for (let i = indice; i < indice + largo; i++) ocupado.add(i)
    // La ventana incluye el match —en "300 dólares" la marca queda
    // adentro del número reconocido— pero se corta en cuanto aparece
    // otra cifra: sin ese corte, el "usd" de "1.090.000 + 200 usd"
    // teñía de dólar también al millón que tiene al lado.
    const despues = texto.slice(indice + largo)
    const proximaCifra = despues.search(/\d/)
    const sufijo = despues.slice(0, proximaCifra === -1 ? 10 : Math.min(proximaCifra, 10))
    const antes = texto.slice(0, indice)
    const prefijo = antes.slice(Math.max(0, antes.search(/\d(?!.*\d)/) + 1, antes.length - 8))
    encontrados.push({
      monto,
      moneda: MARCA_USD.test(prefijo + texto.slice(indice, indice + largo) + sufijo) ? 'usd' : 'ars',
    })
  }

  // Los multiplicadores van primero: "80k" tiene que ganarle a "80".
  for (const { patron, factor } of MULTIPLICADORES) {
    for (const hallazgo of texto.matchAll(patron)) {
      if (hallazgo[1]) registrar(hallazgo.index, hallazgo[0].length, aNumero(hallazgo[1], factor))
    }
  }

  for (const hallazgo of texto.matchAll(MONTO_PLANO)) {
    const bruto = hallazgo[1] ?? hallazgo[2] ?? hallazgo[3] ?? hallazgo[4]
    if (bruto) registrar(hallazgo.index, hallazgo[0].length, aNumero(bruto, 1))
  }

  return encontrados.sort((a, b) => b.monto - a.monto)
}

/** El monto principal, para quien solo necesita uno. */
export function extraerMonto(texto: string): number | null {
  return extraerMontos(texto)[0]?.monto ?? null
}

export function extraerTipo(texto: string): FinanceMovimientoTipo {
  const normalizado = texto.toLowerCase()
  return VERBOS_INGRESO.some((verbo) => normalizado.includes(verbo)) ? 'ingreso' : 'egreso'
}

/**
 * El medio no es una cuenta bancaria: es cómo se movió la plata. Por
 * defecto transferencia, que es el caso común — y se corrige de un
 * toque, igual que la categoría.
 */
export function extraerMedio(texto: string): Medio {
  const normalizado = texto.toLowerCase()
  if (MEDIO_EFECTIVO.some((marca) => normalizado.includes(marca))) return 'efectivo'
  if (MEDIO_TRANSFERENCIA.some((marca) => normalizado.includes(marca))) return 'transferencia'
  return 'transferencia'
}

/**
 * Sprint 025: coincidencia de palabra completa, no substring suelto.
 * Antes `normalizado.includes('gas')` (servicios) matcheaba adentro de
 * "gasté"/"gasto" — cualquier egreso escrito con ese verbo caía en
 * Servicios sin importar de qué se tratara en realidad ("Gasté 30k
 * arreglando el auto" nunca llegaba a probar la palabra "auto"). Los
 * lookaround de borde usan `\p{L}\p{N}` (no `\b`) porque `\b` de JS no
 * trata letras acentuadas como parte de la palabra y rompe con "café",
 * "óptica", etc.
 */
function contienePalabra(texto: string, palabra: string): boolean {
  const escapada = palabra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patron = new RegExp(`(?<![\\p{L}\\p{N}])${escapada}(?![\\p{L}\\p{N}])`, 'iu')
  return patron.test(texto)
}

export function extraerCategoria(texto: string): { categoria: FinanceCategoria | null; segura: boolean } {
  for (const [categoria, palabras] of Object.entries(CATEGORIA_LEXICO)) {
    if (palabras.some((palabra) => contienePalabra(texto, palabra))) {
      return { categoria: categoria as FinanceCategoria, segura: true }
    }
  }
  return { categoria: null, segura: false }
}

/**
 * Motor de movimientos. Convierte lo que escribiste en el Umbral —"Gasté
 * 80k en gasolina"— en lo que Finanzas necesita: cuánto, en qué moneda,
 * si entra o sale, cómo se movió y de qué se trata.
 *
 * Nunca inventa un monto. Si el texto no trae número, `montos` queda
 * vacío y la captura espera en Finanzas hasta que la completes — el
 * Contrato del Umbral §10: el Umbral resuelve dónde, el módulo resuelve
 * qué falta.
 */
export function extraerMovimiento(texto: string): MovimientoExtraido {
  const { categoria, segura } = extraerCategoria(texto)
  return {
    montos: extraerMontos(texto),
    tipo: extraerTipo(texto),
    medio: extraerMedio(texto),
    categoria,
    categoriaSegura: segura,
  }
}
