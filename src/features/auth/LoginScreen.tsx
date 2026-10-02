import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthContext'
import { descartarErrorDeLinkAuth, errorDeLinkAuth } from '@/lib/auth/authUrlError'
import { AuthLayout, authInputClass } from './AuthLayout'
import { PasswordInput } from './PasswordInput'

const AVISO_LINK_VENCIDO = 'El link de confirmación venció o ya se usó. Pedí uno nuevo.'
const AVISO_SIN_CONFIRMAR = 'Todavía no confirmaste tu email. Revisá tu bandeja o reenviá el correo.'
const ENFRIAMIENTO_MS = 60_000

/** A nivel de módulo: el enfriamiento sobrevive a ir a Registro y volver. */
let ultimoReenvio = 0

function ReenviarConfirmacion({ email }: { email: string }) {
  const { resendConfirmation } = useAuth()
  const [ahora, setAhora] = useState(() => Date.now())
  const [resultado, setResultado] = useState<string | null>(null)
  const restante = Math.max(0, Math.ceil((ultimoReenvio + ENFRIAMIENTO_MS - ahora) / 1000))
  const enEspera = restante > 0

  useEffect(() => {
    if (!enEspera) return
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [enEspera])

  async function reenviar() {
    const destino = email.trim()
    if (!destino) {
      setResultado('Escribí tu email arriba para mandarte el correo de nuevo.')
      return
    }
    ultimoReenvio = Date.now()
    setAhora(ultimoReenvio)
    setResultado(null)
    const { error, code } = await resendConfirmation(destino)
    if (error) {
      setResultado(
        code === 'over_email_send_rate_limit'
          ? 'Pediste muchos correos seguidos. Esperá un rato y probá de nuevo.'
          : 'No se pudo reenviar el correo. Probá de nuevo en un rato.',
      )
      return
    }
    descartarErrorDeLinkAuth()
    setResultado(`Listo, te mandamos un correo nuevo a ${destino}. Fijate también en spam.`)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void reenviar()}
        disabled={enEspera}
        className="idea-destino self-start disabled:opacity-40"
      >
        {enEspera ? `Reenviar correo de confirmación (${restante} s)` : 'Reenviar correo de confirmación'}
      </button>
      {resultado && <p className="text-[13px] text-ink-dim" aria-live="polite">{resultado}</p>}
    </>
  )
}

export function LoginScreen() {
  const { signIn, user, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(() => (errorDeLinkAuth() ? AVISO_LINK_VENCIDO : null))

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setEnviando(true)
    setError(null)
    const { error: authError, code } = await signIn(email.trim(), password)
    setEnviando(false)
    if (code === 'email_not_confirmed') {
      setAviso(AVISO_SIN_CONFIRMAR)
      return
    }
    if (authError) {
      setError(authError)
      return
    }
    descartarErrorDeLinkAuth()
    navigate('/', { replace: true })
  }

  // Ya hay sesión (p. ej. el link de confirmación funcionó): directo a la app, sin pasar por el login.
  if (!loading && user) return <Navigate to="/" replace />

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
        <PasswordInput
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          aria-label="Contraseña"
          autoComplete="current-password"
          required
        />
        {aviso && (
          <div className="flex flex-col gap-2">
            <p role="alert" className="text-[13px] text-critical">
              {aviso}
            </p>
            <ReenviarConfirmacion email={email} />
          </div>
        )}
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
