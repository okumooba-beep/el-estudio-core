/**
 * Guardado silencioso (Implementación 09, punto 05): el día que Guardar
 * deje de ser un botón, el disparo va a vivir acá — un temporizador que
 * guarda solo mientras el usuario está en silencio, nunca mientras
 * sigue escribiendo. Todavía no está conectado a IdeaCapture; el botón
 * sigue siendo el único disparador real. No implementar la conexión
 * hasta que el silencio se sienta seguro, no solo posible.
 */
export function scheduleSilentSave(save: () => void, pauseMs = 2000): () => void {
  const id = setTimeout(save, pauseMs)
  return () => clearTimeout(id)
}
