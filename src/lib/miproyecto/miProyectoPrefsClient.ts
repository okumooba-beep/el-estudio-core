import { supabase } from '@/lib/supabase/client'

/**
 * Persistencia del nombre elegido para "Mi proyecto", una fila por usuario
 * en `mi_proyecto_preferences` (ver supabase/mi_proyecto_preferences_schema.sql)
 * — mismo mecanismo que roomBackgroundClient.ts: sin Dexie ni cola offline,
 * el nombre ya vive instantáneo en este dispositivo vía localStorage (ver
 * miProyectoPrefs.ts) y esto solo lo refleja al resto de los dispositivos
 * del mismo usuario.
 */
export type EstadoNombreRemoto = 'ok' | 'error'

export async function setNombreMiProyecto(userId: string, nombre: string): Promise<EstadoNombreRemoto> {
  if (!supabase) return 'error'
  const { error } = await supabase.from('mi_proyecto_preferences').upsert(
    { user_id: userId, nombre, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  if (error) {
    console.error('[miproyecto] no se pudo guardar el nombre elegido:', error.message)
    return 'error'
  }
  return 'ok'
}

/** `null` si no hay preferencia guardada todavía (o falla la consulta) — el llamador cae al default local. */
export async function obtenerNombreMiProyecto(userId: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('mi_proyecto_preferences')
    .select('nombre')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data.nombre as string
}
