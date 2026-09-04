import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthContext'
import { AuthLayout, authInputClass } from './AuthLayout'

export function RegisterScreen() {
  const { signUp, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Si el proyecto de Supabase no exige confirmación de email, `signUp`
   * ya deja una sesión activa y `user` se actualiza solo (via
   * onAuthStateChange en AuthContext) — este efecto es lo que redirige a
   * Hoy en ese caso. Si exige confirmación, `user` sigue null y se
   * queda en esta pantalla mostrando el aviso de abajo.
   */
  useEffect(() => {
    if (enviado && user) navigate('/', { replace: true })
  }, [enviado, user, navigate])

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
    const { error: authError } = await signUp(email.trim(), password)
    setEnviando(false)
    if (authError) {
      setError(authError)
      return
    }
    setEnviado(true)
  }

  if (enviado && !user) {
    return (
      <AuthLayout title="Registro">
        <p className="text-[14px] text-ink">
          Cuenta creada. Revisá tu email para confirmarla y después{' '}
          <Link to="/login" className="text-ink underline underline-offset-2">
            iniciá sesión
          </Link>
          .
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Crear cuenta">
      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          aria-label="Email"
          autoComplete="email"
          required
          className={authInputClass}
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          aria-label="Contraseña"
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
          {enviando ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="text-[13px] text-ink-dim">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="text-ink underline underline-offset-2">
          Iniciá sesión
        </Link>
      </p>
    </AuthLayout>
  )
}
