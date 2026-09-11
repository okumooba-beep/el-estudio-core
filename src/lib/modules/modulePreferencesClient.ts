import { supabase } from '@/lib/supabase/client'

/**
 * Persistencia de qué Espacios oculta cada usuario, una fila por usuario en
 * `module_preferences` (ver supabase/module_preferences_schema.sql) — mismo
 * mecanismo que miProyectoPrefsClient.ts/roomBackgroundClient.ts: sin Dexie
 * ni cola offline, la lista ya vive instantánea en este dispositivo vía
 * localStorage (ver modulePreferences.ts) y esto solo la refleja al resto
 * de los dispositivos del mismo usuario.
 */
export type EstadoOcultosRemoto = 'ok' | 'error'

export async function setOcultosModulos(userId: string, ocultos: string[]): Promise<EstadoOcultosRemoto> {
  if (!supabase) return 'error'
  const { error } = await supabase.from('module_preferences').upsert(
    { user_id: userId, ocultos, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  if (error) {
    console.error('[modulos] no se pudo guardar la preferencia de espacios ocultos:', error.message)
    return 'error'
  }
  return 'ok'
}

/** `null` si no hay preferencia guardada todavía (o falla la consulta) — el llamador cae al default local (nada oculto). */
export async function obtenerOcultosModulos(userId: string): Promise<string[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('module_preferences')
    .select('ocultos')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data.ocultos as string[]
}
