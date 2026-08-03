import type { MaterialId } from './materials'

/**
 * Reglas del sistema de muebles (Sprint 3.6):
 * Una hoja nunca cambia de identidad. Solo cambia de lugar.
 * Cada mueble tiene una única función.
 * Mover nunca significa borrar.
 * Todo tiene un hogar.
 */
export type FurnitureId =
  | 'escritorio'
  | 'tablero'
  | 'bandeja'
  | 'habitos'
  | 'mesa-analisis'
  | 'diario'
  | 'archivador'
  | 'finanzas'
  | 'biblioteca'

export interface Furniture {
  readonly id: FurnitureId
  readonly nombre: string
  readonly recibe: readonly FurnitureId[]
  readonly enviaA: readonly FurnitureId[]
  readonly icono: string
  readonly material: MaterialId
}

/**
 * El registro completo de muebles del Estudio (Sprint 3.6, parte 2).
 * Finanzas y Biblioteca quedan reservados: existen acá para que el
 * grafo de movimiento los pueda nombrar, pero ninguna pantalla los usa
 * todavía — no corresponde inventarles una sin que el Estudio lo pida.
 */
export const FURNITURE: Record<FurnitureId, Furniture> = {
  escritorio: {
    id: 'escritorio',
    nombre: 'Escritorio',
    recibe: [],
    enviaA: ['tablero', 'bandeja', 'habitos', 'mesa-analisis', 'finanzas', 'biblioteca'],
    icono: 'hoja',
    material: 'wood',
  },
  tablero: {
    id: 'tablero',
    nombre: 'Tablero de Corcho',
    recibe: ['escritorio'],
    enviaA: ['archivador'],
    icono: 'corcho',
    material: 'cork',
  },
  /**
   * Asuntos (Sprint de Producto 003). El Tablero es para lo que podés
   * empezar vos; la Bandeja es donde descansa lo que depende de otro.
   * `enviaA: ['tablero']` no es decorativo: el día que un asunto deja de
   * depender de un tercero, deja de ser un asunto y pasa a ser una
   * misión — el grafo lo dice antes que cualquier pantalla.
   */
  bandeja: {
    id: 'bandeja',
    nombre: 'Bandeja',
    recibe: ['escritorio'],
    enviaA: ['tablero', 'archivador'],
    icono: 'bandeja de madera',
    material: 'wood',
  },
  habitos: {
    id: 'habitos',
    nombre: 'Calendario',
    recibe: ['escritorio'],
    enviaA: [],
    icono: 'registro semanal',
    material: 'paper',
  },
  'mesa-analisis': {
    id: 'mesa-analisis',
    nombre: 'Mesa de Análisis',
    recibe: ['escritorio'],
    enviaA: [],
    icono: 'expediente',
    material: 'wood',
  },
  diario: {
    id: 'diario',
    nombre: 'Diario',
    recibe: [],
    enviaA: [],
    icono: 'cuaderno de cuero',
    material: 'leather',
  },
  archivador: {
    id: 'archivador',
    nombre: 'Archivador',
    recibe: ['tablero'],
    enviaA: [],
    icono: 'carpeta histórica',
    material: 'metal',
  },
  finanzas: {
    id: 'finanzas',
    nombre: 'Finanzas',
    recibe: ['escritorio'],
    enviaA: [],
    icono: 'libro contable',
    material: 'paper',
  },
  biblioteca: {
    id: 'biblioteca',
    nombre: 'Biblioteca',
    recibe: ['escritorio'],
    enviaA: [],
    icono: 'ficha bibliográfica',
    material: 'wood',
  },
}

export type HistoryEvento = 'creada' | 'movida'

/**
 * Una entrada de historial nunca se borra, solo se agrega (parte 4).
 * `diario` es la única excepción al grafo de recibe/enviaA: cada hoja
 * queda registrada ahí en el momento de nacer, para siempre — no
 * porque se haya "movido" a ningún lado (parte 8).
 */
export interface HistoryEntry {
  readonly evento: HistoryEvento
  readonly furniture: FurnitureId
  readonly fecha: string
}
