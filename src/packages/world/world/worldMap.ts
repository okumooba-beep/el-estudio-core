import type { FurnitureId } from '../studio/furniture'

/**
 * World Map (Sprint "World Map"): la geografía persistente de El
 * Estudio. Vive junto a worldRules.ts a propósito — mismo principio:
 * sin UI, sin lógica, solo la verdad contra la que se puede chequear
 * cualquier decisión futura ("¿este lugar nuevo ya existe en el mapa,
 * o lo estoy inventando porque una pantalla lo pide?").
 *
 * No es el Furniture System (ver src/packages/world/studio/furniture.ts): ese
 * grafo (`recibe`/`enviaA`) describe cómo se mueve el contenido entre
 * muebles — es dirigido y es sobre flujo. Este mapa describe dónde
 * existe cada lugar dentro de la habitación — es no dirigido y es
 * sobre geografía. Un lugar puede existir acá sin tener mueble
 * todavía (Rincón de Lectura, Muro de Proyectos no tienen `furniture`
 * propio); un mueble reservado (Biblioteca) ya tiene lugar propio
 * aunque ninguna pantalla lo use todavía.
 *
 * `position` no es visual: es la misma escala 0-100 que ya usan los
 * dos focos de luz fijos de la habitación (room-layer-window en
 * 17/15, room-layer-lamp en 83/87 — ver src/index.css), aplicada acá
 * al nivel de la habitación entera en vez de al escritorio (que ya
 * tiene la suya propia, RoomObjectPosition, ver
 * src/types/roomObject.ts). Nadie todavía dibuja estas coordenadas —
 * existen para que un futuro plano, o una futura cámara, tengan de
 * dónde partir sin tener que inventar la geografía en ese momento.
 *
 * `adjacentTo` es simétrico (si A está junto a B, B está junto a A) —
 * a diferencia de `recibe`/`enviaA`, acá no hay dirección: solo
 * cercanía real dentro del mismo cuarto.
 */

export type WorldPlaceId = 'escritorio' | 'ventana' | 'rincon-lectura' | 'muro-proyectos' | 'biblioteca'

export interface WorldPlacePosition {
  readonly x: number
  readonly y: number
}

export interface WorldPlace {
  readonly id: WorldPlaceId
  readonly nombre: string
  /** Conceptual, 0-100, misma escala que los focos fijos de luz. Nunca usada para renderizar todavía. */
  readonly position: WorldPlacePosition
  /** Relación simétrica de cercanía real dentro de la habitación, nunca de flujo de contenido. */
  readonly adjacentTo: readonly WorldPlaceId[]
  /** Solo si el lugar ya tiene un mueble físico (ver furniture.ts). Ausente cuando el lugar todavía no tiene forma. */
  readonly furnitureId?: FurnitureId
}

/**
 * El mapa es parcial a propósito, igual que MUEBLES en muebles.ts:
 * cinco lugares porque son los únicos que el Estudio ya puede nombrar
 * con confianza. Ningún lugar nuevo se agrega para que una pantalla
 * futura lo necesite — se agrega porque ya es cierto que ese lugar
 * existe dentro de la habitación.
 */
export const WORLD_PLACES: Record<WorldPlaceId, WorldPlace> = {
  escritorio: {
    id: 'escritorio',
    nombre: 'Escritorio',
    position: { x: 78, y: 65 },
    adjacentTo: ['ventana', 'muro-proyectos'],
    furnitureId: 'escritorio',
  },
  ventana: {
    id: 'ventana',
    nombre: 'Ventana',
    position: { x: 17, y: 15 },
    adjacentTo: ['escritorio', 'rincon-lectura'],
  },
  'rincon-lectura': {
    id: 'rincon-lectura',
    nombre: 'Rincón de Lectura',
    position: { x: 12, y: 40 },
    adjacentTo: ['ventana', 'biblioteca'],
  },
  'muro-proyectos': {
    id: 'muro-proyectos',
    nombre: 'Muro de Proyectos',
    position: { x: 50, y: 10 },
    adjacentTo: ['escritorio'],
    furnitureId: 'tablero',
  },
  biblioteca: {
    id: 'biblioteca',
    nombre: 'Biblioteca',
    position: { x: 15, y: 55 },
    adjacentTo: ['rincon-lectura'],
    furnitureId: 'biblioteca',
  },
}
