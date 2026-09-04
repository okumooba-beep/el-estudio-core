import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { bootstrapFinanceSync, stopFinanceSync } from '@/lib/sync/bootstrap'

interface AuthResult {
  error: string | null
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  /** `true` hasta que se conoce la sesión inicial (o hasta que termina el bootstrap de sync de una sesión nueva). */
  loading: boolean
  signUp(email: string, password: string): Promise<AuthResult>
  signIn(email: string, password: string): Promise<AuthResult>
  signOut(): Promise<void>
  resetPasswordRequest(email: string): Promise<AuthResult>
  updatePassword(password: string): Promise<AuthResult>
}

const NOT_CONFIGURED = 'Supabase no está configurado en este entorno (faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Primer `React.createContext` del proyecto (no había ningún patrón previo
 * que imitar). Se suscribe a `supabase.auth.onAuthStateChange` y, cuando
 * aparece una sesión nueva (login/registro), dispara el bootstrap de sync
 * de Finanzas (hidratación o migración según corresponda) antes de
 * marcarse `loading: false` — así ninguna pantalla puede montarse con una
 * sesión activa pero los datos de Finanzas todavía sin resolver.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const bootstrapping = useRef<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let activo = true

    async function handleSession(nextSession: Session | null) {
      if (!activo) return
      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (nextSession?.user && bootstrapping.current !== nextSession.user.id) {
        bootstrapping.current = nextSession.user.id
        try {
          await bootstrapFinanceSync(nextSession.user.id)
        } catch (error) {
          console.error('[auth] bootstrap de sync falló:', error)
        }
      }
      if (!nextSession) {
        bootstrapping.current = null
        stopFinanceSync()
      }
      if (activo) setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => {
      void handleSession(data.session)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void handleSession(nextSession)
    })

    return () => {
      activo = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function signUp(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return { error: NOT_CONFIGURED }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }

  async function signIn(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return { error: NOT_CONFIGURED }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut(): Promise<void> {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  async function resetPasswordRequest(email: string): Promise<AuthResult> {
    if (!supabase) return { error: NOT_CONFIGURED }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer-password`,
    })
    return { error: error?.message ?? null }
  }

  async function updatePassword(password: string): Promise<AuthResult> {
    if (!supabase) return { error: NOT_CONFIGURED }
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error?.message ?? null }
  }

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut, resetPasswordRequest, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth() debe usarse dentro de <AuthProvider>')
  return context
}

export { isSupabaseConfigured }
