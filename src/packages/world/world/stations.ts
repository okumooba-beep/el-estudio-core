export interface Station {
  id: string
  label: string
  /** Texto corto visible bajo el label en el hotspot — qué se hace ahí, no cómo se llama el módulo. */
  subtitle?: string
  /** Metadata: la pantalla completa equivalente, si existe (para el nav de AppShell / deep-link). La cámara ya no navega ahí sola — cada estación crece su interfaz dentro de la habitación (ver ROOM_MODULES en features/room/roomModules.tsx). */
  route?: string
  /** Punto focal (% del plano) y zoom al que la cámara se acerca para esta estación. Coordenadas box-space: % sobre el propio inset(-25%) de .scene-camera, que ahora coincide 1:1 con el % de contenido de la foto North Star (public/room/estudio-hero.png). */
  camera: { x: number; y: number; scale: number }
}

/**
 * North Star (Fase 2, El Estudio): la foto real reemplaza el arte dibujado
 * a mano. Cada estación apunta a la región de la FOTO que mejor sirve ese
 * sistema — no hay pizarra de tiza literal ni corcho literal en la imagen
 * aprobada, así que "pizarra" se recalibró al panel de concreto iluminado
 * sobre los monitores (superficie de estrategia más cercana en la foto) y
 * "corcho" a la estantería retroiluminada con libros/marcos (documentos y
 * referencias). El Escritorio no tiene "route": ya es esta escena, la
 * cámara solo se acerca a él. Todas las coordenadas se ajustaron para que
 * el viewport de zoom de cada estación ([x±50/scale, y±50/scale]) no se
 * salga de [0,100] — la foto es un asset real con bordes duros, a
 * diferencia de los degradados infinitos del arte anterior.
 */
export const STATIONS: Station[] = [
  { id: 'centro', label: 'La habitación', camera: { x: 50, y: 48, scale: 1 } },
  {
    id: 'escritorio',
    label: 'Estudio',
    subtitle: 'Trabajo profundo sin distracciones',
    camera: { x: 61, y: 55, scale: 1.9 },
  },
  {
    id: 'pizarra',
    label: 'Pizarra',
    subtitle: 'Metas, misiones, hábitos y estrategia',
    camera: { x: 68, y: 27, scale: 2.0 },
  },
  {
    id: 'corcho',
    label: 'Archivo',
    subtitle: 'Notas, documentos y referencias',
    camera: { x: 80, y: 32, scale: 2.6 },
  },
  {
    id: 'archivador',
    label: 'Diario',
    subtitle: 'Reflexiones, aprendizajes y claridad',
    route: '/diario',
    camera: { x: 44, y: 76, scale: 2.1 },
  },
]

export const CENTER_STATION_ID = 'centro'
