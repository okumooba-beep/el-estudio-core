import { useReflexionSemanal, type EspacioReflexion } from '@/lib/reflexion/useReflexionSemanal'

/**
 * Banner mínimo y reusable (Misiones/Hábitos/Finanzas, punto 4 de
 * "IA en el bolsillo") — mismo criterio de silencio que PhraseSlot.tsx:
 * sin nada que mostrar, no renderiza nada, ni un espacio reservado.
 * Reusa el tratamiento visual de .ajustes-superficie (color-mix sobre
 * --surface + blur) en vez de inventar un estilo de banner nuevo.
 */
export function ReflexionBanner({ espacio }: { espacio: EspacioReflexion }) {
  const { nota, marcarLeida } = useReflexionSemanal(espacio)
  if (!nota) return null

  return (
    <div className="ajustes-superficie flex items-start justify-between gap-3 px-4 py-3">
      <p className="text-[13px] leading-relaxed text-ink-dim">{nota}</p>
      <button
        type="button"
        aria-label="Cerrar reflexión semanal"
        className="shrink-0 text-ink-faint"
        onClick={marcarLeida}
      >
        ×
      </button>
    </div>
  )
}
