import { IMPLEMENTED_MATERIALS, MATERIALS } from '@world/studio/materials'

/**
 * Material Inspector (Sprint 2.4, punto 07): pantalla de desarrollo,
 * nunca enlazada desde ningún lugar visible del Estudio ni incluida en
 * producción — la ruta que la sirve solo existe cuando
 * `import.meta.env.DEV` (ver src/App.tsx). Muestra los materiales en
 * crudo, uno al lado del otro: es un catálogo de superficies, nunca de
 * componentes — por eso ningún swatch es una <IdeaSheet>, una
 * <Libreta> ni una chincheta real, solo la clase .material-* aplicada
 * a un div sin nada más encima.
 */
export function MaterialInspector() {
  return (
    <div className="min-h-dvh bg-[#111417] p-8 text-white">
      <h1 className="mb-1 text-lg font-semibold">Material Inspector</h1>
      <p className="mb-8 max-w-[60ch] text-[13px] text-white/50">
        Catálogo crudo de src/packages/world/studio/materials.ts — cada material responde las mismas seis
        preguntas (luz, envejecimiento, sombra, foco, tiempo, uso). Solo development.
      </p>
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {IMPLEMENTED_MATERIALS.map((id) => {
          const material = MATERIALS[id]
          return (
            <div key={id} className="flex flex-col gap-3">
              <div className={`relative h-36 w-full ${material.className}`} />
              <div>
                <p className="font-mono text-[13px] text-white/80">{material.id}</p>
                <dl className="mt-2 flex flex-col gap-1.5 text-[12px] leading-snug text-white/55">
                  <div>
                    <dt className="inline font-semibold text-white/75">luz — </dt>
                    <dd className="inline">{material.light}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-white/75">envejecimiento — </dt>
                    <dd className="inline">{material.aging}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-white/75">sombra — </dt>
                    <dd className="inline">{material.shadow}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-white/75">foco — </dt>
                    <dd className="inline">{material.focus}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-white/75">tiempo — </dt>
                    <dd className="inline">{material.time}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-white/75">uso — </dt>
                    <dd className="inline">{material.use}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
