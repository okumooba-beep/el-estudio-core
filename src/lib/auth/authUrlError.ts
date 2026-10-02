/**
 * Link de confirmación fallido (vencido, ya usado, abierto antes por un
 * antivirus del correo): Supabase redirige con `#error=…&error_code=…`
 * (flujo implícito) o `?error=…` (PKCE). auth-js no limpia esa URL y no
 * deja sesión, así que RequireAuth mandaba a /login y el error se perdía
 * en silencio. Se lee una sola vez al cargar este módulo (antes del
 * primer render) y se limpia la URL. /restablecer-password queda fuera:
 * esa pantalla ya muestra su propio aviso de enlace vencido.
 */
const CLAVES = ['error', 'error_code', 'error_description'] as const

function leerYLimpiar(): string | null {
  if (typeof window === 'undefined' || window.location.pathname === '/restablecer-password') return null
  const url = new URL(window.location.href)
  const hash = new URLSearchParams(url.hash.slice(1))
  const enHash = CLAVES.some((clave) => hash.has(clave))
  const enQuery = CLAVES.some((clave) => url.searchParams.has(clave))
  if (!enHash && !enQuery) return null
  const fuente = enHash ? hash : url.searchParams
  const codigo = fuente.get('error_code') ?? fuente.get('error') ?? 'unspecified_error'
  if (enHash) url.hash = ''
  for (const clave of CLAVES) url.searchParams.delete(clave)
  window.history.replaceState(window.history.state, '', url.pathname + url.search)
  return codigo
}

let errorPendiente = leerYLimpiar()

/** Código de error del link (p. ej. 'otp_expired'), o null. Lectura pura: sobrevive re-montajes (StrictMode, ir a Registro y volver). */
export function errorDeLinkAuth(): string | null {
  return errorPendiente
}

/** Se llama cuando el aviso ya no aplica (reenvío exitoso o login correcto). */
export function descartarErrorDeLinkAuth(): void {
  errorPendiente = null
}
