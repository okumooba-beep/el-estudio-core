const PREFIX = 'lifeos.'

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // El almacenamiento puede fallar (modo privado, cuota llena).
    // Fallar en silencio: nunca romper la experiencia por no poder guardar.
  }
}
