import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { liveQuery } from 'dexie'
import type { User } from '@supabase/supabase-js'
import { db } from '@/lib/db/db'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase/client'

/**
 * "Primeros pasos": checklist para cuentas nuevas, montado arriba de todo
 * en Hoy. No es un tour — cada ítem se tilda solo con una acción real
 * (modo standalone, o datos reales en Dexie leídos con liveQuery).
 *
 * Solo existe para cuentas creadas después de este despliegue
 * (CUENTAS_DESDE) y sin datos previos en los módulos del checklist: datos
 * con createdAt anterior al alta de la cuenta (con margen por relojes
 * desfasados) son datos migrados de antes, y ahí el checklist no tiene
 * sentido. Para cualquier cuenta más vieja ni siquiera se consulta Dexie.
 *
 * Oculto y completado se guardan en user_metadata de Supabase Auth
 * (updateUser), así no reaparece en otro dispositivo sin tabla ni columna
 * nueva; localStorage solo adelanta el estado en este dispositivo
 * mientras llega la sesión actualizada.
 */
const CUENTAS_DESDE = '2026-10-01T23:00:00Z'
const MARGEN_DATOS_PREVIOS_MS = 10 * 60 * 1000

type ClaveItem = 'instalar' | 'mision' | 'habito' | 'marcar' | 'ingreso' | 'gasto' | 'nota'

const ITEMS: Array<{ clave: ClaveItem; texto: string; ruta?: string }> = [
  { clave: 'instalar', texto: 'Instalar la app en tu celular' },
  { clave: 'mision', texto: 'Crear tu primera misión', ruta: '/misiones' },
  { clave: 'habito', texto: 'Crear un hábito', ruta: '/habitos' },
  { clave: 'marcar', texto: 'Marcar un hábito en el día', ruta: '/habitos' },
  { clave: 'ingreso', texto: 'Registrar un ingreso', ruta: '/finanzas' },
  { clave: 'gasto', texto: 'Registrar un gasto', ruta: '/finanzas' },
  { clave: 'nota', texto: 'Escribir una nota', ruta: '/notas' },
]

interface EstadoDatos {
  previos: boolean
  hechos: Record<Exclude<ClaveItem, 'instalar'>, boolean>
}

interface EventoInstalacion extends Event {
  prompt(): Promise<void>
}

function hoyLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function leerLocal(clave: string): string | null {
  try {
    return localStorage.getItem(clave)
  } catch {
    return null
  }
}

function escribirLocal(clave: string, valor: string): void {
  try {
    localStorage.setItem(clave, valor)
  } catch {
    /* sin storage: queda solo el estado remoto */
  }
}

function estaInstalada(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

function esIos(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

function esCuentaNueva(user: User | null): user is User {
  return Boolean(user?.created_at && Date.parse(user.created_at) >= Date.parse(CUENTAS_DESDE))
}

function guardarEnCuenta(datos: Record<string, string>): void {
  void supabase?.auth.updateUser({ data: datos }).then(({ error }) => {
    if (error) console.error('[primeros pasos] no se pudo guardar el estado:', error.message)
  })
}

function useDatosChecklist(user: User | null): EstadoDatos | null {
  const [estado, setEstado] = useState<EstadoDatos | null>(null)
  const nueva = esCuentaNueva(user)
  const altaMs = nueva ? Date.parse(user.created_at) : 0

  useEffect(() => {
    if (!nueva) return
    const limite = altaMs - MARGEN_DATOS_PREVIOS_MS
    const anterior = (fecha: string | undefined) => Boolean(fecha && Date.parse(fecha) < limite)
    const suscripcion = liveQuery(async () => {
      const [ideas, checks, movimientos, notas] = await Promise.all([
        db.ideas.filter((i) => (i.destino === 'misiones' || i.destino === 'habitos') && !i.deletedAt).toArray(),
        db.habitChecks.filter((c) => c.checked).toArray(),
        db.financeMovimientos.filter((m) => !m.deletedAt).toArray(),
        db.notesNotes.filter((n) => !n.deletedAt).toArray(),
      ])
      return {
        previos:
          ideas.some((i) => anterior(i.createdAt)) ||
          checks.some((c) => anterior(c.updatedAt)) ||
          movimientos.some((m) => anterior(m.createdAt)) ||
          notas.some((n) => anterior(n.createdAt)),
        hechos: {
          mision: ideas.some((i) => i.destino === 'misiones'),
          habito: ideas.some((i) => i.destino === 'habitos'),
          marcar: checks.length > 0,
          ingreso: movimientos.some((m) => m.tipo === 'ingreso'),
          gasto: movimientos.some((m) => m.tipo === 'egreso'),
          nota: notas.length > 0,
        },
      }
    }).subscribe({
      next: setEstado,
      error: (error: unknown) => console.error('[primeros pasos] no se pudo leer el progreso:', error),
    })
    return () => suscripcion.unsubscribe()
  }, [nueva, altaMs])

  return nueva ? estado : null
}

export function OnboardingChecklist() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const datos = useDatosChecklist(user)
  const userId = user?.id ?? ''
  const clave = (sufijo: string) => `onboarding.${userId}.${sufijo}`
  const metadata = (user?.user_metadata ?? {}) as { onboarding_oculto?: string; onboarding_completado?: string }

  const [instalada, setInstalada] = useState(estaInstalada)
  const [eventoInstalar, setEventoInstalar] = useState<EventoInstalacion | null>(null)
  const [verInstrucciones, setVerInstrucciones] = useState(false)
  const [confirmandoOcultar, setConfirmandoOcultar] = useState(false)
  const [colapsadaLocal, setColapsadaLocal] = useState<boolean | null>(null)
  const [ocultaLocal, setOcultaLocal] = useState(false)

  useEffect(() => {
    const alInstalable = (e: Event) => {
      e.preventDefault()
      setEventoInstalar(e as EventoInstalacion)
    }
    const modo = window.matchMedia('(display-mode: standalone)')
    const alCambiarModo = () => setInstalada(estaInstalada())
    window.addEventListener('beforeinstallprompt', alInstalable)
    modo.addEventListener('change', alCambiarModo)
    return () => {
      window.removeEventListener('beforeinstallprompt', alInstalable)
      modo.removeEventListener('change', alCambiarModo)
    }
  }, [])

  const hechos: Record<ClaveItem, boolean> | null = datos ? { instalar: instalada, ...datos.hechos } : null
  const cantidad = hechos ? ITEMS.filter((item) => hechos[item.clave]).length : 0
  const completo = cantidad === ITEMS.length
  const claveCompletado = clave('completado')
  const completadoEl = metadata.onboarding_completado ?? (userId ? leerLocal(claveCompletado) : null)

  useEffect(() => {
    if (!completo || !userId || metadata.onboarding_completado) return
    const fecha = leerLocal(claveCompletado) ?? hoyLocal()
    escribirLocal(claveCompletado, fecha)
    guardarEnCuenta({ onboarding_completado: fecha })
  }, [completo, userId, claveCompletado, metadata.onboarding_completado])

  if (!datos || !hechos || datos.previos) return null
  if (ocultaLocal || metadata.onboarding_oculto || leerLocal(clave('oculto'))) return null
  if (completadoEl && completadoEl < hoyLocal()) return null

  const colapsada = colapsadaLocal ?? leerLocal(clave('colapsada')) === '1'

  function alternarColapsada() {
    const siguiente = !colapsada
    setColapsadaLocal(siguiente)
    escribirLocal(clave('colapsada'), siguiente ? '1' : '0')
  }

  function ocultar() {
    const ahora = new Date().toISOString()
    setOcultaLocal(true)
    escribirLocal(clave('oculto'), ahora)
    guardarEnCuenta({ onboarding_oculto: ahora })
  }

  function tocarItem(item: (typeof ITEMS)[number]) {
    if (item.ruta) navigate(item.ruta)
    else if (!instalada) setVerInstrucciones((v) => !v)
  }

  return (
    <section className="flex flex-col gap-3 rounded-(--radius-sm) border border-border/40 px-4 py-3.5">
      <button
        type="button"
        onClick={alternarColapsada}
        aria-expanded={!colapsada}
        className="flex w-full appearance-none items-center justify-between gap-3 border-0 bg-transparent p-0 text-left"
      >
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Primeros pasos</h2>
        <span className="font-mono text-[11px] text-ink-faint">
          {cantidad} de {ITEMS.length} {colapsada ? '▾' : '▴'}
        </span>
      </button>
      <div className="h-0.5 overflow-hidden rounded-full bg-border/40" aria-hidden>
        <div className="h-full bg-accent/60 transition-[width] duration-300" style={{ width: `${(cantidad / ITEMS.length) * 100}%` }} />
      </div>

      {completo ? <p className="text-[14px] text-ink-dim">Listo, ya tenés el sistema andando.</p> : null}

      {colapsada ? null : (
        <>
          <ul className="flex flex-col">
            {ITEMS.map((item) => {
              const hecho = hechos[item.clave]
              return (
                <li key={item.clave} className="border-b border-border/40 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => tocarItem(item)}
                    disabled={item.clave === 'instalar' && instalada}
                    className="group flex w-full appearance-none items-center gap-3 border-0 bg-transparent py-2.5 text-left"
                  >
                    <span
                      aria-hidden
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] leading-none ${
                        hecho ? 'border-accent/70 text-accent' : 'border-ink-faint'
                      }`}
                    >
                      {hecho ? '✓' : null}
                    </span>
                    <span
                      className={`text-[14px] transition-colors ${
                        hecho ? 'text-ink-faint line-through decoration-ink-faint/50' : 'text-ink-dim group-active:text-ink'
                      }`}
                    >
                      {item.texto}
                    </span>
                    <span className="sr-only">{hecho ? '(hecho)' : '(pendiente)'}</span>
                  </button>
                  {item.clave === 'instalar' && !instalada && verInstrucciones ? (
                    <div className="flex flex-col gap-2 pb-3 pl-7 text-[13px] text-ink-dim">
                      {esIos() ? (
                        <p>En Safari, tocá Compartir → Agregar a pantalla de inicio.</p>
                      ) : eventoInstalar ? (
                        <button
                          type="button"
                          onClick={() => void eventoInstalar.prompt().then(() => setEventoInstalar(null))}
                          className="self-start rounded-(--radius-sm) border border-border/60 bg-transparent px-3 py-1 text-[13px] text-ink"
                        >
                          Instalar
                        </button>
                      ) : (
                        <p>Desde el menú del navegador, elegí Instalar app o Agregar a pantalla de inicio.</p>
                      )}
                      <p className="text-ink-faint">Se tilda cuando abras la app desde el ícono.</p>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>

          <div className="flex justify-end text-[12px]">
            {confirmandoOcultar ? (
              <span className="flex items-center gap-3 text-ink-dim">
                ¿Ocultar primeros pasos?
                <button type="button" onClick={ocultar} className="appearance-none border-0 bg-transparent p-0 text-ink">
                  Sí, ocultar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoOcultar(false)}
                  className="appearance-none border-0 bg-transparent p-0 text-ink-faint"
                >
                  No
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmandoOcultar(true)}
                className="appearance-none border-0 bg-transparent p-0 text-ink-faint transition-colors active:text-ink"
              >
                Ocultar
              </button>
            )}
          </div>
        </>
      )}
    </section>
  )
}
