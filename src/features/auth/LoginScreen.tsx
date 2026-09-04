import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthContext'
import { AuthLayout, authInputClass } from './AuthLayout'

export function LoginScreen() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setEnviando(true)
    setError(null)
    const { error: authError } = await signIn(email.trim(), password)
    setEnviando(false)
    if (authError) {
      setError(authError)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <AuthLayout title="Iniciar sesión">
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
          autoComplete="current-password"
          required
          className={authInputClass}
        />
        {error && <p className="text-[13px] text-critical">{error}</p>}
        <button type="submit" disabled={enviando} className="accion-primaria self-start px-4 py-2 text-[14px] disabled:opacity-40">
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <div className="flex flex-col gap-1 text-[13px] text-ink-dim">
        <Link to="/olvide-password" className="idea-destino self-start">
          Olvidé mi contraseña
        </Link>
        <p>
          ¿No tenés cuenta?{' '}
          <Link to="/registro" className="text-ink underline underline-offset-2">
            Registrate
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
