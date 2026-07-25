import type { CSSProperties, ReactNode } from 'react'
import { colors, materials, motion, paperInk, radius, shadows, spacing, typography } from '@design-system/tokens'

/**
 * Design System Gallery (Sprint F11, Parte I §2, ratificación punto 2):
 * mismo patrón ya probado de MaterialInspector — pantalla de desarrollo,
 * nunca enlazada desde ningún lugar visible del Estudio ni incluida en
 * producción, servida solo cuando `import.meta.env.DEV` (ver src/App.tsx).
 * Es el instrumento que hace verificable, y no solo esperable, la fidelidad
 * de cada token de estudio-design-system/tokens a la referencia aprobada.
 *
 * Parte I §2 pide también "cada estado de componente (Idle/Hover/Focused/
 * Active/Selected/Thinking/Processing/Completed/Archived/Disabled) lado a
 * lado con su especificación" — esa parte queda deliberadamente fuera de
 * este sprint: Foundation §8 distingue Tokens de Componentes, y hasta F10
 * solo la capa de Tokens existe (F9) con un primer consumidor real (F10).
 * No existe todavía ninguna primitiva sin marca (Surface/Text/Stack) ni
 * componente con marca cuyos estados esta Galería pueda mostrar sin
 * inventar un componente nuevo — eso es una decisión de arquitectura de
 * un sprint futuro, no de éste. Esta Galería cubre las siete categorías de
 * Tokens que sí existen (color, materiales, tipografía, spacing, motion,
 * sombra, radio) y se amplía con estados de componente cuando esa capa
 * exista.
 */
export function DesignSystemGallery() {
  return (
    <div className="min-h-dvh bg-[#111417] p-8 text-white">
      <h1 className="mb-1 text-lg font-semibold">Design System Gallery</h1>
      <p className="mb-8 max-w-[60ch] text-[13px] text-white/50">
        Catálogo crudo de src/packages/estudio-design-system/tokens — cada token lado a lado con su
        especificación. Solo development.
      </p>

      <Section title="Color">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(colors).map(([name, value]) => (
            <Swatch key={name} name={name} value={value} style={{ background: value }} />
          ))}
        </div>
      </Section>

      <Section title="Materiales">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(materials).map(([name, value]) => (
            <Swatch key={name} name={name} value={value} style={{ background: value }} tall />
          ))}
        </div>
        <p className="mt-6 mb-3 text-[12px] font-semibold text-white/75">Papel — tinta</p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {Object.entries(paperInk).map(([name, value]) => (
            <Swatch key={name} name={name} value={value} style={{ background: value }} />
          ))}
        </div>
      </Section>

      <Section title="Tipografía">
        <div className="flex flex-col gap-5">
          {Object.entries(typography).map(([name, value]) => (
            <div key={name}>
              <p className="font-mono text-[12px] text-white/55">{name} — {value}</p>
              <p className="text-[22px]" style={{ fontFamily: value }}>
                El Estudio no es una aplicación. Es un lugar.
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing">
        <div className="flex flex-col gap-3">
          {Object.entries(spacing).map(([name, value]) => (
            <div key={name} className="flex items-center gap-4">
              <p className="w-16 shrink-0 font-mono text-[12px] text-white/55">{name}</p>
              <div className="h-3 bg-white/80" style={{ width: value }} />
              <p className="font-mono text-[12px] text-white/55">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Motion">
        <div className="flex flex-col gap-1.5">
          {Object.entries(motion).map(([name, token]) => (
            <p key={name} className="font-mono text-[12px] text-white/55">
              <span className="text-white/80">{name}</span> — {token.duration}, {token.easing}
            </p>
          ))}
        </div>
      </Section>

      <Section title="Sombra">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {Object.entries(shadows).map(([name, value]) => (
            <div key={name} className="flex flex-col gap-3">
              <div className="h-24 w-full rounded-md bg-[#1B1612]" style={{ boxShadow: value }} />
              <p className="font-mono text-[12px] text-white/55">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radio">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {Object.entries(radius).map(([name, value]) => (
            <div key={name} className="flex flex-col gap-3">
              <div className="h-24 w-full bg-white/80" style={{ borderRadius: value }} />
              <p className="font-mono text-[12px] text-white/55">
                {name} — {value}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-12">
      <h2 className="mb-4 text-[13px] font-semibold text-white/75">{title}</h2>
      {children}
    </div>
  )
}

function Swatch({
  name,
  value,
  style,
  tall,
}: {
  name: string
  value: string
  style: CSSProperties
  tall?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className={tall ? 'h-36 w-full' : 'h-16 w-full'} style={style} />
      <p className="font-mono text-[12px] text-white/55">{name}</p>
      <p className="font-mono text-[11px] break-all text-white/35">{value}</p>
    </div>
  )
}
