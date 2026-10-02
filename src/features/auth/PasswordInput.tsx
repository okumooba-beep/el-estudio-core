import { useState, type InputHTMLAttributes } from 'react'
import { authInputClass } from './AuthLayout'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>

/**
 * Campo de contraseña de las pantallas de auth con "ojito" para ver/ocultar
 * el texto. Cada instancia tiene su propio estado (registro y restablecer
 * tienen dos campos independientes). Botón de 44×44 para el área de toque,
 * ícono SVG inline con el mismo color tenue que los placeholders.
 */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative flex">
      <input {...props} type={visible ? 'text' : 'password'} className={`${authInputClass} w-full pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-ink-dim hover:text-ink"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
  )
}
