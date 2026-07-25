import type { WorldPlaceId } from './worldMap'

/**
 * The Gaze (Sprint "The Gaze"): el primer estado de atención
 * persistente. No es cámara, no es navegación, no es efecto — es la
 * intención que existirá antes de que cualquiera de esas cosas se
 * construya (ver worldRules.ts, "world-precedes-user": el lugar ya
 * existe, el usuario solo entra; acá el usuario decide, primero,
 * hacia dónde mira dentro de ese lugar).
 *
 * Vive junto a worldMap.ts a propósito: la mirada siempre apunta a un
 * WorldPlaceId ya existente en el mapa — nunca se inventa un lugar
 * nuevo para que la mirada tenga dónde posarse. Guardado en memoria
 * de módulo, no en localStorage: igual que applyLight() en
 * src/packages/world/light/applyLight.ts, es estado real del mundo, no
 * preferencia de usuario que deba sobrevivir a un cierre de pestaña.
 *
 * Por qué lo va a reutilizar el futuro sistema espacial: cuando
 * existan cámara y navegación, necesitarán saber HACIA DÓNDE moverse
 * — hoy ese "hacia dónde" ya existe acá, separado por completo de
 * CÓMO llegar. getGaze() será la fuente de verdad que decida el
 * destino de un futuro paneo o corte de cámara; ese sistema no va a
 * tener que inventar de nuevo la pregunta de dónde está la atención,
 * solo va a tener que responderla con movimiento.
 *
 * Sprint "Crossing the Threshold": setGaze ahora también refleja el
 * estado en el DOM (data-gaze en <html>), igual que applyLight()
 * escribe la luz como propiedades CSS — un solo lugar donde el estado
 * del mundo se vuelve físico. Ver src/index.css: html[data-gaze] es lo
 * que le permite al cruce de umbral hacia el Escritorio ser una
 * consecuencia de la intención (esta función), nunca su origen.
 */
let currentGaze: WorldPlaceId | null = null

export function setGaze(place: WorldPlaceId | null): void {
  currentGaze = place
  if (place) {
    document.documentElement.dataset.gaze = place
  } else {
    delete document.documentElement.dataset.gaze
  }
}

export function getGaze(): WorldPlaceId | null {
  return currentGaze
}
