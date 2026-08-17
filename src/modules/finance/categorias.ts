/**
 * Las categorías de gasto (Sprint 007 — "Comprender el movimiento del
 * dinero"). Lista cerrada, exactamente la que valida el brief: ni una
 * categoría más. No hay `otros` — un movimiento que el léxico no
 * reconoce nunca se fuerza a una categoría, pasa a "Por revisar"
 * (ver `extraerCategoria` en extraccion.ts y `categoriaDe` en mes.ts).
 *
 * Es una lista cerrada a propósito. Categorías libres convierten esto
 * en la planilla que EL_ESTUDIO_CORE.md rechaza: "No obliga a pensar en
 * categorías cuando lo importante es capturar el movimiento."
 */
export type FinanceCategoria =
  | 'comida'
  | 'auto'
  | 'salud'
  | 'servicios'
  | 'suscripciones'
  | 'alquiler'
  | 'ropa'
  | 'ocio'
  | 'inversion'
  | 'ahorro'

export const CATEGORIAS: readonly FinanceCategoria[] = [
  'comida', 'auto', 'salud', 'servicios', 'suscripciones',
  'alquiler', 'ropa', 'ocio', 'inversion', 'ahorro',
]

export const CATEGORIA_LABEL: Record<FinanceCategoria, string> = {
  comida: 'Comida',
  auto: 'Auto',
  salud: 'Salud',
  servicios: 'Servicios',
  suscripciones: 'Suscripciones',
  alquiler: 'Alquiler',
  ropa: 'Ropa',
  ocio: 'Ocio',
  inversion: 'Inversión',
  ahorro: 'Ahorro',
}

/**
 * La paleta sale del design system del Estudio (ver src/index.css), no
 * de los colores saturados que usa una app de finanzas típica: maderas,
 * ocres y verdes apagados. Diez categorías con diez colores chillones
 * serían exactamente el ruido visual que la dirección artística
 * prohíbe — acá el gráfico tiene que poder mirarse de noche sin gritar.
 */
export const CATEGORIA_COLOR: Record<FinanceCategoria, string> = {
  comida: '#D8A24A',
  auto: '#A8763C',
  salud: '#C97A73',
  servicios: '#8A7F70',
  suscripciones: '#7E6A8F',
  alquiler: '#8C5F4A',
  ropa: '#6F8299',
  ocio: '#C99A55',
  inversion: '#6FAE85',
  ahorro: '#5C8C7A',
}

/**
 * Palabras que delatan la categoría. No pretende ser exhaustivo: lo que
 * no matchea pasa a "Por revisar" y se corrige de un toque, que es más
 * barato que un léxico enorme lleno de falsos positivos.
 *
 * Sprint 025: cada palabra se compara con borde de palabra completa
 * (ver `contienePalabra` en extraccion.ts), nunca como substring suelto
 * — antes 'gas' (servicios) matcheaba dentro de "gasté"/"gasto"/"gasté"
 * y le ganaba de mano a la categoría real (auto, ropa, ocio) en
 * cualquier frase que empezara con ese verbo, sin importar el orden de
 * este objeto. Ver comentario de `contienePalabra`.
 */
export const CATEGORIA_LEXICO: Record<FinanceCategoria, readonly string[]> = {
  comida: ['super', 'súper', 'supermercado', 'almuerzo', 'cena', 'desayuno', 'comida', 'café', 'cafe',
    'restaurante', 'delivery', 'verduler', 'carnicer', 'panader', 'kiosco', 'mercado', 'pedido'],
  auto: ['auto', 'autos', 'nafta', 'gasolina', 'combustible', 'aceite', 'peaje', 'cochera', 'estacionamiento',
    'neumático', 'neumatico', 'cubierta', 'taller', 'mecánico', 'mecanico', 'patente', 'seguro del auto',
    'lavado', 'vtv', 'foco delantero', 'focos delanteros'],
  salud: ['farmacia', 'remedio', 'medicamento', 'obra social', 'prepaga', 'dentista', 'odontólog',
    'odontolog', 'consulta', 'análisis', 'analisis', 'kinesi', 'óptica', 'optica'],
  servicios: ['luz', 'gas', 'agua', 'internet', 'wifi', 'teléfono', 'telefono', 'celular', 'expensas',
    'municipal', 'impuesto', 'abl'],
  suscripciones: ['suscripción', 'suscripcion', 'netflix', 'spotify', 'youtube', 'membresía', 'membresia',
    'plan mensual', 'chatgpt', 'claude', 'icloud', 'drive'],
  alquiler: ['alquiler', 'renta', 'depósito del depto', 'deposito del depto'],
  ropa: ['ropa', 'remera', 'remeras', 'pantalón', 'pantalon', 'pantalones', 'campera', 'zapatilla',
    'zapatillas', 'zapato', 'zapatos', 'calzado', 'indumentaria', 'buzo', 'camisa', 'vestido', 'pollera',
    'jean', 'jeans'],
  ocio: ['cine', 'salida', 'bar', 'boliche', 'birra', 'cerveza', 'juego', 'concierto', 'recital',
    'viaje', 'hotel', 'regalo', 'gimnasio'],
  inversion: ['inversión', 'inversion', 'invertí', 'inverti', 'acciones', 'bono', 'cedear', 'cripto',
    'bitcoin', 'broker', 'plazo fijo'],
  ahorro: ['ahorro', 'ahorré', 'ahorre', 'guardé', 'guarde', 'reserva'],
}
