import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

/** Guard de sesión — envuelve el `<Route element={<AppShell/>}>` existente en App.tsx, nunca AppShell.tsx en sí (que no tiene ningún provider ni guard). */
export function RequireAuth() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-dim">Cargando…</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
