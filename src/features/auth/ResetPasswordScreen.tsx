import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthContext'
import { AuthLayout, authInputClass } from './AuthLayout'

/**
 * Se llega acá desde el link del email de recuperación — el cliente de
 * Supabase (detectSessionInUrl, default en createClient) ya intercambia
 * ese link por una sesión de recuperación antes de que este componente
 * monte, así que `user`/`loading` de AuthContext reflejan esa sesión sin
 * lógica extra acá.
 */
export function ResetPasswordScreen() {
  const { updatePassword, user, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setEnviando(true)
    setError(null)
    const { error: authError } = await updatePassword(password)
    setEnviando(false)
    if (authError) {
      setError(authError)
      return
    }
    navigate('/', { replace: true })
  }

  if (loading) return null

  if (!user) {
    return (
      <AuthLayout title="Restablecer contraseña">
        <p className="text-[14px] text-ink">El enlace no es válido o ya venció.</p>
        <Link to="/olvide-password" className="idea-destino self-start">
          Pedir un enlace nuevo
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Restablecer contraseña">
      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña nueva"
          aria-label="Contraseña nueva"
          autoComplete="new-password"
          required
          className={authInputClass}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repetir contraseña"
          aria-label="Repetir contraseña"
          autoComplete="new-password"
          required
          className={authInputClass}
        />
        {error && <p className="text-[13px] text-critical">{error}</p>}
        <button type="submit" disabled={enviando} className="accion-primaria self-start px-4 py-2 text-[14px] disabled:opacity-40">
          {enviando ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </AuthLayout>
  )
}
