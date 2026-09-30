import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'

export type EspacioReflexion = 'misiones' | 'habitos' | 'finanzas'

const COLUMNA_NOTA: Record<EspacioReflexion, string> = {
  misiones: 'nota_misiones',
  habitos: 'nota_habitos',
  finanzas: 'nota_finanzas',
}

const COLUMNA_LEIDA: Record<EspacioReflexion, string> = {
  misiones: 'leida_misiones_en',
  habitos: 'leida_habitos_en',
  finanzas: 'leida_finanzas_en',
}

/**
 * Trae la reflexión semanal más reciente todavía sin leer para `espacio`
 * (Misiones/Hábitos/Finanzas). "Leída" es server-side (columna
 * `leida_<espacio>_en` en `reflexiones_semanales`), no localStorage: el
 * usuario puede tener la PWA en más de un dispositivo (ver
 * push_schema.sql) y el banner debe desaparecer en todos apenas se marca
 * leída en cualquiera.
 *
 * No usa el motor de sync (Dexie) del resto de la app — a diferencia de
 * Misiones/Hábitos/Finanzas, la reflexión la escribe la Edge Function
 * weekly-reflection del lado del servidor, nunca el cliente, así que
 * alcanza con una consulta directa a Supabase.
 */
export function useReflexionSemanal(espacio: EspacioReflexion) {
  const { user } = useAuth()
  const [id, setId] = useState<string | null>(null)
  const [nota, setNota] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase || !user) return
    let cancelado = false

    const columnas: string = `id, ${COLUMNA_NOTA[espacio]}, ${COLUMNA_LEIDA[espacio]}`

    void supabase
      .from('reflexiones_semanales')
      .select(columnas)
      .eq('user_id', user.id)
      .is(COLUMNA_LEIDA[espacio], null)
      .order('semana_inicio', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelado || !data) return
        const fila = data as unknown as Record<string, string | null>
        setId(fila.id ?? null)
        setNota(fila[COLUMNA_NOTA[espacio]] ?? null)
      })

    return () => {
      cancelado = true
    }
  }, [espacio, user])

  function marcarLeida() {
    if (!supabase || !id) return
    setNota(null)
    void supabase
      .from('reflexiones_semanales')
      .update({ [COLUMNA_LEIDA[espacio]]: new Date().toISOString() })
      .eq('id', id)
  }

  return { nota, marcarLeida }
}
