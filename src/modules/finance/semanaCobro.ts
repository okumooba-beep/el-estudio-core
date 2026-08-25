/**
 * Sprint 037 — "Semana de cobro": lunes a domingo, real y calculada,
 * nunca dependiente del mes. Reemplaza la idea de "período" libre que
 * Sprint 036 dejaba sin ninguna regla (el usuario podía tipear
 * cualquier par de fechas y cualquier nombre) — acá la única entrada es
 * "cualquier día de la semana que quiero", y estas funciones devuelven
 * siempre el lunes y el domingo que la contienen. No se toca
 * `semanaDelMes` en mes.ts: esa sigue siendo la agrupación calendario
 * por día-del-mes que usan los egresos, un concepto distinto a propósito.
 */

/** Fecha local a medianoche, igual que `etiquetaDia` en mes.ts — nunca vía Date.parse ni toISOString, para no correr un día por huso horario. */
function aFechaLocal(fechaISO: string): Date {
  const partes = fechaISO.split('-')
  const anio = Number(partes[0])
  const mes = Number(partes[1])
  const dia = Number(partes[2])
  return new Date(anio, mes - 1, dia)
}

function aTextoISO(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

/** El lunes de la semana calendario real que contiene `fechaISO`. */
export function mondayOf(fechaISO: string): string {
  const fecha = aFechaLocal(fechaISO)
  const diaSemana = fecha.getDay() // 0 = domingo ... 6 = sábado
  const diasDesdeInicioSemana = diaSemana === 0 ? 6 : diaSemana - 1
  fecha.setDate(fecha.getDate() - diasDesdeInicioSemana)
  return aTextoISO(fecha)
}

/** El domingo de la semana calendario real que contiene `fechaISO`. */
export function sundayOf(fechaISO: string): string {
  const lunes = aFechaLocal(mondayOf(fechaISO))
  lunes.setDate(lunes.getDate() + 6)
  return aTextoISO(lunes)
}

/**
 * Cualquier fecha que el usuario elija ("+ Semana de cobro") se
 * normaliza a la semana real que la contiene — nunca se guarda el pick
 * arbitrario del usuario tal cual.
 */
export function normalizarSemana(fechaCualquiera: string): { fechaInicio: string; fechaFin: string } {
  const fechaInicio = mondayOf(fechaCualquiera)
  return { fechaInicio, fechaFin: sundayOf(fechaInicio) }
}

/** La semana calendario real de hoy. */
export function semanaActual(): { fechaInicio: string; fechaFin: string } {
  return normalizarSemana(aTextoISO(new Date()))
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/**
 * "24 → 30 ago" — o, si la semana cruza de mes, "27 jul → 2 ago": la
 * semana sigue siendo una sola entidad, la etiqueta simplemente lo dice
 * (Sprint 037, §identidad: nunca "Semana 4"). Siempre derivada de las
 * fechas, nunca tipeada por el usuario.
 */
export function etiquetaSemanaCobro(fechaInicio: string, fechaFin: string): string {
  const inicio = aFechaLocal(fechaInicio)
  const fin = aFechaLocal(fechaFin)
  const diaInicio = inicio.getDate()
  const diaFin = fin.getDate()
  const mesInicio = MESES_CORTOS[inicio.getMonth()]
  const mesFin = MESES_CORTOS[fin.getMonth()]
  if (mesInicio === mesFin) return `${diaInicio} → ${diaFin} ${mesFin}`
  return `${diaInicio} ${mesInicio} → ${diaFin} ${mesFin}`
}

/** `true` si `fechaISO` cae dentro de [fechaInicio, fechaFin] (comparación lexicográfica, válida porque el formato es YYYY-MM-DD). */
export function fechaEnSemana(fechaISO: string, fechaInicio: string, fechaFin: string): boolean {
  return fechaISO >= fechaInicio && fechaISO <= fechaFin
}
