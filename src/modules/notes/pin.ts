/**
 * Hash simple y local del PIN vía Web Crypto (SHA-256), nativo del
 * navegador — cero dependencias nuevas. No es para un sistema de
 * seguridad crítico (uso personal): alcanza con no guardar el PIN en
 * texto plano. Sin recuperación: si se olvida, la única salida es
 * eliminar la carpeta (documentado en el reporte de cierre).
 */
export async function hashPin(pin: string): Promise<string> {
  const bytes = new TextEncoder().encode(pin)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function esPinValido(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}
