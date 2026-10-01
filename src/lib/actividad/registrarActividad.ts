import { supabase } from '@/lib/supabase/client'

/**
 * Fase 6 (IA en el bolsillo) — marca `ultima_apertura` de este usuario en
 * `actividad_usuarios` (ver actividad_usuarios_schema.sql). Fire-and-forget
 * a propósito: nunca debe bloquear ni demorar el resto del bootstrap de
 * sesión (AuthContext.tsx), y un fallo acá no es motivo para romper el
 * login — como mucho, este usuario recibe un recordatorio de inactividad
 * de más el día que corresponda, nada del modelo local depende de esto.
 */
export function registrarActividad(userId: string): void {
  if (!supabase) return
  const ahora = new Date().toISOString()
  void supabase
    .from('actividad_usuarios')
    .upsert(
      { user_id: userId, ultima_apertura: ahora, updated_at: ahora },
      { onConflict: 'user_id' },
    )
    .then(({ error }) => {
      if (error) console.error('[actividad] registrarActividad falló:', error)
    })
}
