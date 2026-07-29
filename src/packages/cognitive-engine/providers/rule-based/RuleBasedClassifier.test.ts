import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RuleBasedClassifier } from './RuleBasedClassifier'

/**
 * El entorno de tests es 'node' (ver vite.config.ts), así que no existe
 * `window`. `shared-kernel/storage/localStorage` ya falla en silencio en
 * ese caso — pero la memoria de correcciones necesita un almacén real
 * para poder probarse. Se stubea acá, no en la config global: es la
 * única suite que lo necesita.
 */
const memoria = new Map<string, string>()
vi.stubGlobal('window', {
  localStorage: {
    getItem: (k: string) => memoria.get(k) ?? null,
    setItem: (k: string, v: string) => void memoria.set(k, v),
  },
})

describe('RuleBasedClassifier', () => {
  const classifier = new RuleBasedClassifier()

  beforeEach(() => {
    // La memoria de correcciones tiene prioridad sobre toda regla: sin
    // limpiarla, un test podría contaminar al resto.
    memoria.clear()
  })

  it('classifies a known keyword to its rule destino', () => {
    const result = classifier.classify('Tengo que ir a Tribunales mañana')
    expect(result.destino).toBe('misiones')
    expect(result.reason).toEqual({ kind: 'regla', ruleId: 'mision-tribunales', keyword: 'tribunales' })
  })

  it('defaults to "hoy" with sin-coincidencia when nothing matches', () => {
    const result = classifier.classify('una idea cualquiera sin palabra clave')
    expect(result.destino).toBe('hoy')
    expect(result.reason).toEqual({ kind: 'sin-coincidencia' })
  })

  /**
   * Contrato del Umbral §7. Estos tres son el sprint entero: definen
   * cuándo el Umbral puede moverte una hoja y cuándo no.
   */
  describe('los tres comportamientos', () => {
    it('confianza alta: monto + verbo de gasto en pasado se asigna solo', () => {
      const result = classifier.classify('Gasté $35.000 en el súper')
      expect(result.destino).toBe('finanzas')
      expect(result.nivel).toBe('alta')
    })

    it('confianza media: una sola palabra clave nunca alcanza para mover', () => {
      const result = classifier.classify('Comprar café')
      expect(result.destino).toBe('misiones')
      expect(result.nivel).toBe('media')
    })

    it('confianza baja: sin señales, silencio', () => {
      const result = classifier.classify('El Jeep')
      expect(result.nivel).toBe('baja')
      expect(result.destino).toBe('hoy')
    })
  })

  /**
   * Contrato del Umbral §9 — los casos ambiguos son la prueba de fuego:
   * ninguno puede resolver en alta. Un error silencioso cuesta más que
   * una pregunta.
   */
  describe('casos ambiguos del Contrato', () => {
    it.each([
      ['Pagué el gimnasio'],
      ['Comprar un escritorio de $200.000'],
      ['Comprar café'],
      ['Me quedé pensando en la charla del gimnasio'],
      ['El Jeep'],
      ['Tengo que hablar con el contador'],
    ])('nunca resuelve en alta: %s', (texto) => {
      expect(classifier.classify(texto).nivel).not.toBe('alta')
    })

    it('un conflicto ofrece las dos opciones en vez de elegir', () => {
      const result = classifier.classify('Pagué el gimnasio')
      expect(result.nivel).toBe('media')
      expect([result.destino, result.alternativa].sort()).toEqual(['finanzas', 'habitos'])
    })
  })

  /**
   * Contrato del Umbral §6, familia estructural. Antes de este sprint un
   * monto no disparaba absolutamente nada — era la señal más fuerte del
   * sistema y el clasificador la ignoraba.
   */
  describe('señales estructurales', () => {
    it.each([
      ['Gasté $35.000 ayer'],
      ['Pagué 12 mil pesos de expensas'],
      ['Me costó 300 dólares'],
    ])('reconoce un movimiento de dinero: %s', (texto) => {
      expect(classifier.classify(texto).destino).toBe('finanzas')
    })

    it('un monto sin verbo de gasto no es un movimiento cerrado', () => {
      // Es una intención de gasto, no un gasto: Finanzas no recibe
      // intenciones futuras (Contrato §4).
      expect(classifier.classify('Comprar un escritorio de $200.000').nivel).not.toBe('alta')
    })
  })

  /**
   * Contrato del Umbral §6. La negación era el error silencioso más
   * visible de la auditoría: "comprar" dentro de una negación mudaba la
   * hoja a Misiones.
   */
  describe('negaciones', () => {
    it.each([
      ['No tengo que comprar nada'],
      ['Nunca voy a llamar a esa gente'],
      ['Este mes sin gimnasio'],
    ])('una palabra clave negada no dispara: %s', (texto) => {
      expect(classifier.classify(texto).nivel).toBe('baja')
    })

    it('la negación no cruza de cláusula', () => {
      // "no" pertenece a la segunda cláusula: no debe anular "comprar".
      expect(classifier.classify('Comprar pan, no llamé a nadie').destino).toBe('misiones')
    })

    it('una palabra que contiene "no" no cuenta como negación', () => {
      expect(classifier.classify('Con la mano rota, llamar al médico').destino).toBe('misiones')
    })
  })

  /**
   * Contrato del Umbral §12: una corrección previa del usuario sobre un
   * patrón idéntico sobrescribe cualquier regla.
   */
  it('una corrección aprendida gana con confianza alta', () => {
    const texto = 'cargué nafta'
    expect(classifier.classify(texto).nivel).toBe('baja')

    memoria.set('lifeos.comprehension-memory', JSON.stringify({ [texto]: 'finanzas' }))

    const result = classifier.classify(texto)
    expect(result.destino).toBe('finanzas')
    expect(result.nivel).toBe('alta')
    expect(result.reason).toEqual({ kind: 'aprendizaje', texto })
  })
})
