import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthContext'
import { AuthLayout, authInputClass } from './AuthLayout'

export function ForgotPasswordScreen() {
  const { resetPasswordRequest } = useAuth()
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setEnviando(true)
    setError(null)
    const { error: authError } = await resetPasswordRequest(email.trim())
    setEnviando(false)
    if (authError) {
      setError(authError)
      return
    }
    setEnviado(true)
  }

  if (enviado) {
    return (
      <AuthLayout title="Recuperar contraseña">
        <p className="text-[14px] text-ink">
          Si esa cuenta existe, te enviamos un email con un enlace para restablecer tu contraseña.
        </p>
        <Link to="/login" className="idea-destino self-start">
          Volver a iniciar sesión
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Recuperar contraseña">
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
        {error && <p className="text-[13px] text-critical">{error}</p>}
        <button type="submit" disabled={enviando} className="accion-primaria self-start px-4 py-2 text-[14px] disabled:opacity-40">
          {enviando ? 'Enviando…' : 'Enviar enlace'}
        </button>
      </form>
      <Link to="/login" className="idea-destino self-start">
        Volver a iniciar sesión
      </Link>
    </AuthLayout>
  )
}
