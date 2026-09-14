import { useEffect, useState } from 'react'

interface DebugMedidas {
  innerWidth: number
  bodyScrollWidth: number
  rojo: number | null
  azul: number | null
  verde: number | null
  naranja: number | null
}

function medir(): DebugMedidas {
  return {
    innerWidth: window.innerWidth,
    bodyScrollWidth: document.body.scrollWidth,
    rojo: document.querySelector<HTMLElement>('[data-debug="rojo"]')?.offsetWidth ?? null,
    azul: document.querySelector<HTMLElement>('[data-debug="azul"]')?.offsetWidth ?? null,
    verde: document.querySelector<HTMLElement>('[data-debug="verde"]')?.offsetWidth ?? null,
    naranja: document.querySelector<HTMLElement>('[data-debug="naranja"]')?.offsetWidth ?? null,
  }
}

/**
 * Diagnóstico temporal del bug de overflow horizontal (max-w-xl anidado).
 * Reemplaza los outlines de colores: un outline es invisible si el elemento
 * desborda fuera del viewport, así que esto muestra los números reales
 * (offsetWidth de cada contenedor + innerWidth + scrollWidth del body) en un
 * overlay fijo que no se mueve con el scroll.
 */
export function DebugOverlay() {
  const [medidas, setMedidas] = useState<DebugMedidas>(() => medir())

  useEffect(() => {
    const id = window.setInterval(() => setMedidas(medir()), 300)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'black',
        color: 'lime',
        fontSize: '10px',
        padding: '2px 4px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
      }}
    >
      {`innerWidth=${medidas.innerWidth} body.scrollWidth=${medidas.bodyScrollWidth} | rojo(carpeta)=${medidas.rojo ?? '-'} azul(switcher)=${medidas.azul ?? '-'} verde(FinanceEngineScreen)=${medidas.verde ?? '-'} naranja(SeFueDetalle)=${medidas.naranja ?? '-'}`}
    </div>
  )
}
