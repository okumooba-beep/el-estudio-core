import { supabase } from '@/lib/supabase/client'

/**
 * Sprint ROOM — persistencia del fondo elegido, una fila por usuario en
 * `room_preferences` (ver supabase/room_preferences_schema.sql). Mismo
 * mecanismo que `push_subscriptions` (src/lib/push/pushClient.ts): sin
 * Dexie ni cola offline — la elección ya vive instantáneamente en este
 * dispositivo vía localStorage (ver src/lib/room/roomBackgrounds.ts) y
 * esto solo la refleja al resto de los dispositivos del mismo usuario.
 */
export type EstadoFondoRemoto = 'ok' | 'error'

export async function setFondoSeleccionado(userId: string, fondoId: string): Promise<EstadoFondoRemoto> {
  if (!supabase) return 'error'
  const { error } = await supabase.from('room_preferences').upsert(
    { user_id: userId, fondo_id: fondoId, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  if (error) {
    console.error('[room] no se pudo guardar el fondo elegido:', error.message)
    return 'error'
  }
  return 'ok'
}

/** `null` si no hay preferencia guardada todavía (o falla la consulta) — el llamador cae al default local. */
export async function obtenerFondoSeleccionado(userId: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('room_preferences')
    .select('fondo_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data.fondo_id as string
}

/**
 * Sprint "Room / Ajustes: 4 cambios puntuales" (§4) — mismo mecanismo que
 * fondo_id, columna aparte (ver supabase/room_preferences_add_posicion_x.sql)
 * para no pisar el fondo elegido cuando solo cambia la posición, o
 * viceversa (el upsert de Supabase solo toca las columnas del payload).
 */
export async function setPosicionXSeleccionada(userId: string, posicionX: string): Promise<EstadoFondoRemoto> {
  if (!supabase) return 'error'
  const { error } = await supabase.from('room_preferences').upsert(
    { user_id: userId, posicion_x: posicionX, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  if (error) {
    console.error('[room] no se pudo guardar la posición del fondo:', error.message)
    return 'error'
  }
  return 'ok'
}

/** `null` si no hay preferencia guardada todavía (o falla la consulta) — el llamador cae al default local. */
export async function obtenerPosicionXSeleccionada(userId: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('room_preferences')
    .select('posicion_x')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data.posicion_x as string
}
