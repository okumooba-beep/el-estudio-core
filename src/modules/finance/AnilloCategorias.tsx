import { CATEGORIA_COLOR } from './categorias'
import type { GrupoCategoria } from './mes'

const RADIO = 52
const GROSOR = 13
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

/**
 * El anillo del mes (Sprint de Producto 004). Es la única visual del
 * módulo, y es deliberadamente una sola: la referencia que pidió el
 * brief es Monefy, no un panel de control — captura rápida y un gráfico
 * que se entiende sin leer.
 *
 * SVG a mano, sin librería de charts: son diez arcos y traer una
 * dependencia entera para eso sería exactamente el peso muerto que
 * ARCHITECTURE_RATIFIED.md evita. Los colores salen del design system
 * (ver categorias.ts): maderas y ocres apagados, no la paleta saturada
 * de una app de finanzas — esto se mira de noche.
 *
 * El centro lleva el total gastado, no un porcentaje: la pregunta real
 * al abrir Finanzas es "cuánto llevo este mes", y el reparto por
 * categoría es la respuesta secundaria.
 */
export function AnilloCategorias({ grupos, total }: { grupos: readonly GrupoCategoria[]; total: string }) {
  let acumulado = 0

  return (
    <svg viewBox="0 0 140 140" className="h-[140px] w-[140px]" role="img" aria-label={`Gastado este mes: ${total}`}>
      <circle cx="70" cy="70" r={RADIO} fill="none" stroke="var(--border)" strokeWidth={GROSOR} />
      {grupos.map((grupo) => {
        const largo = grupo.parte * CIRCUNFERENCIA
        const offset = acumulado * CIRCUNFERENCIA
        acumulado += grupo.parte
        return (
          <circle
            key={grupo.categoria}
            cx="70"
            cy="70"
            r={RADIO}
            fill="none"
            stroke={CATEGORIA_COLOR[grupo.categoria]}
            strokeWidth={GROSOR}
            strokeDasharray={`${largo} ${CIRCUNFERENCIA - largo}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 70 70)"
          />
        )
      })}
      <text
        x="70"
        y="70"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-ink"
        style={{ fontSize: total.length > 9 ? 15 : 18, fontFamily: 'var(--font-mono)' }}
      >
        {total}
      </text>
    </svg>
  )
}
