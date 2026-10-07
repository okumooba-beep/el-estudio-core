/**
 * Sprint 037 — "Semana de cobro": lunes a domingo, real y calculada,
 * nunca dependiente del mes. Reemplaza la idea de "período" libre que
 * Sprint 036 dejaba sin ninguna regla (el usuario podía tipear
 * cualquier par de fechas y cualquier nombre) — acá la única entrada es
 * "cualquier día de la semana que quiero", y estas funciones devuelven
 * siempre el lunes y el domingo que la contienen.
 *
 * Unificación de semanas (2026-09-30) — este archivo ya no es exclusivo
 * de Ingresos: `semanaDelMes` (agrupación por día-del-mes, el sistema
 * que antes usaban los egresos) se eliminó de `mes.ts`, y tanto el
 * selector de "¿De qué semana es este gasto?" como la vista semanal de
 * egresos (`FinanceEngineScreen.tsx`, `SeFueDetalle.tsx`) usan ahora las
 * mismas funciones de acá — una sola definición de "semana" en toda
 * Finanzas.
 */

/**
 * Fecha local a medianoche, igual que `etiquetaDia` en mes.ts — nunca vía
 * Date.parse ni toISOString, para no correr un día por huso horario.
 * `.slice(0, 10)` antes de partir: `fecha`/`fechaInicio`/`fechaFin` son
 * `timestamptz` en Supabase (ver finance_schema.sql), así que cualquier
 * fila que ya pasó por la base vuelve como "2026-08-31T00:00:00+00:00",
 * no como "2026-08-31" — sin este recorte, partir por "-" agarra basura
 * después del día y arma un Date inválido.
 */
function aFechaLocal(fechaISO: string): Date {
  const partes = fechaISO.slice(0, 10).split('-')
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

/**
 * Bug reportado de nuevo (2026-09-24): dos períodos con el mismo lunes real
 * coexistían sin fusionarse y una semana con ingresos reales mostraba "Sin
 * ingresos" + "Crear esta semana" (como si no existiera ningún período).
 * Causa real, más profunda que la fusión de duplicados ya existente: un
 * período que pasó por Supabase vuelve con `fechaInicio` como
 * "2026-08-31T00:00:00+00:00" (timestamptz, mismo motivo que obliga a
 * `.slice(0, 10)` en `aFechaLocal` de acá arriba), mientras uno recién
 * creado localmente (`normalizarSemana`) es siempre "2026-08-31" plano —
 * cualquier comparación con `===` entre un período sincronizado y una
 * fecha plana (o entre dos períodos de distinto origen) fallaba en
 * silencio: el período existía, pero nunca "calzaba". Esto normaliza
 * cualquier `fechaInicio`/`fechaFin`, sin importar su origen, al mismo
 * formato plano — usarlo en toda comparación por fecha evita que el
 * formato de origen decida si dos semanas son "la misma".
 */
export function fechaCorta(fechaISO: string): string {
  return fechaISO.slice(0, 10)
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

/**
 * El día que representa a la semana a fines de "a qué mes pertenece" —
 * el jueves, no el lunes. Antes un ingreso cargado contra una semana
 * (`fechaInicio`, siempre lunes) quedaba SIEMPRE en el mes del lunes,
 * aunque la semana viviera casi entera en el mes siguiente (31 ago→6
 * sep: 1 día en agosto, 6 en septiembre, y el ingreso caía en agosto).
 * El jueves es el mismo criterio que usa ISO-8601 para asignarle año a
 * una semana que cruza el 1 de enero, y funciona igual acá: en una
 * semana de 7 días, el jueves siempre cae del lado que tiene 4 días o
 * más — la mayoría real, nunca fijo al lunes.
 */
export function fechaEfectivaSemana(fechaInicio: string): string {
  const jueves = aFechaLocal(fechaInicio)
  jueves.setDate(jueves.getDate() + 3)
  return aTextoISO(jueves)
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/**
 * "22–28 sep" — o, si la semana cruza de mes, "28 sep – 4 oct": la
 * semana sigue siendo una sola entidad, la etiqueta simplemente lo dice
 * (Sprint 037, §identidad: nunca "Semana 4"). Siempre derivada de las
 * fechas, nunca tipeada por el usuario ni leída de un campo persistido
 * (unificación de semanas, 2026-09-30: antes esto se guardaba una sola
 * vez como `FinanceIncomePeriod.nombre` — un período viejo nunca
 * actualizaba su etiqueta si este formato cambiaba. Ahora se recalcula
 * siempre en vivo desde `fechaInicio`/`fechaFin`, en todos los puntos
 * donde se muestra una semana).
 */
export function etiquetaSemanaCobro(fechaInicio: string, fechaFin: string): string {
  const inicio = aFechaLocal(fechaInicio)
  const fin = aFechaLocal(fechaFin)
  const diaInicio = inicio.getDate()
  const diaFin = fin.getDate()
  const mesInicio = MESES_CORTOS[inicio.getMonth()]
  const mesFin = MESES_CORTOS[fin.getMonth()]
  if (mesInicio === mesFin) return `${diaInicio}–${diaFin} ${mesFin}`
  return `${diaInicio} ${mesInicio} – ${diaFin} ${mesFin}`
}

/** La semana real que está `delta` semanas antes (negativo) o después (positivo) de la que arranca en `fechaInicio`. */
export function sumarSemanas(fechaInicio: string, delta: number): { fechaInicio: string; fechaFin: string } {
  const fecha = aFechaLocal(fechaInicio)
  fecha.setDate(fecha.getDate() + delta * 7)
  return normalizarSemana(aTextoISO(fecha))
}

/**
 * `true` si `fechaISO` cae dentro de [fechaInicio, fechaFin] (comparación
 * lexicográfica, válida porque el formato es YYYY-MM-DD). `fechaCorta`: un
 * movimiento sincronizado trae "2026-10-04T00:00:00+00:00", que sin el
 * recorte queda "después" de un domingo "2026-10-04" y se caía de su semana.
 */
export function fechaEnSemana(fechaISO: string, fechaInicio: string, fechaFin: string): boolean {
  const fecha = fechaCorta(fechaISO)
  return fecha >= fechaInicio && fecha <= fechaFin
}

/**
 * Sprint 040 — "Ingresos siempre muestra todas las semanas del mes".
 * Devuelve todas las semanas reales cuyo "mes efectivo" (criterio del
 * jueves, ver fechaEfectivaSemana) cae en `mes`, en orden cronológico —
 * con o sin período creado todavía. `EntroDetalle` cruza esta lista
 * contra los períodos existentes: donde hay período, muestra sus
 * ingresos; donde no, un estado vacío. Unificación de semanas
 * (2026-09-30): `SeFueDetalle` reutiliza esta misma función para su
 * acordeón de egresos por semana — un solo criterio de "a qué mes
 * pertenece esta semana" para las dos secciones.
 */
export function semanasRealesDelMes(mes: string): { fechaInicio: string; fechaFin: string }[] {
  const semanas: { fechaInicio: string; fechaFin: string }[] = []
  let cursor = mondayOf(`${mes}-01`)
  while (fechaEfectivaSemana(cursor).slice(0, 7) <= mes) {
    if (fechaEfectivaSemana(cursor).slice(0, 7) === mes) {
      semanas.push({ fechaInicio: cursor, fechaFin: sundayOf(cursor) })
    }
    const siguiente = aFechaLocal(cursor)
    siguiente.setDate(siguiente.getDate() + 7)
    cursor = aTextoISO(siguiente)
  }
  return semanas
}

/**
 * Unificación de semanas (2026-09-30) — "el selector muestra las semanas
 * que tocan el mes de la fecha elegida; una semana que cruza meses
 * aparece en ambos". A diferencia de `semanasRealesDelMes` (que asigna
 * cada semana a un único mes "efectivo", vía el criterio del jueves),
 * esta función no decide un mes dueño: una semana entra en la lista de
 * `mes` si cualquiera de sus dos puntas (lunes o domingo) cae en `mes`,
 * así que la misma semana puede devolverse acá dos veces — una vez por
 * cada mes que toca — para que el selector de "¿De qué semana es este
 * gasto?" la muestre en los dos.
 */
export function semanasQueToquenMes(mes: string): { fechaInicio: string; fechaFin: string }[] {
  const semanas: { fechaInicio: string; fechaFin: string }[] = []
  let cursor = mondayOf(`${mes}-01`)
  while (cursor.slice(0, 7) <= mes) {
    const fechaFin = sundayOf(cursor)
    if (cursor.slice(0, 7) === mes || fechaFin.slice(0, 7) === mes) {
      semanas.push({ fechaInicio: cursor, fechaFin })
    }
    const siguiente = aFechaLocal(cursor)
    siguiente.setDate(siguiente.getDate() + 7)
    cursor = aTextoISO(siguiente)
  }
  return semanas
}
