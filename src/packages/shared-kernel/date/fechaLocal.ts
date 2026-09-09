/**
 * "Hoy" en fecha local (YYYY-MM-DD) — nunca vía `toISOString().slice(0,
 * 10)`: ese método convierte a UTC antes de recortar, así que en un huso
 * horario negativo (Argentina, UTC-3) las últimas horas del día local ya
 * caen en el día siguiente en UTC — "hoy" se lee mal después de cierta
 * hora, y una fecha guardada así corre un día. Mismo bug, misma causa
 * raíz, apareció por separado en Finanzas y en Agenda — un único punto
 * de verdad acá, no una corrección duplicada por módulo.
 */
export function fechaLocalISO(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}
