import { useEffect, useMemo, useState } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { useMisionesPrincipales } from '@modules/missions/public'
import { useAgendaSemana, calcularConflictosDia, extraerRangoHora, crearBloqueDesdeCorreccion } from '@modules/agenda/public'
import { formatearHora12 } from '@shared-kernel/text/interpretarTexto'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuditoria } from './useAuditoria'
import { mondayOf, weekDays, semanaDesplazada } from './semanas'
import { calcularEvidencia } from './evidencia'
import type { RupturaTipo, AuditCorreccionSemanal } from '@/types/auditoria'

const CAMPO = 'w-full border-b border-border/60 bg-transparent text-[15px] text-ink outline-none'

const ETIQUETA_RUPTURA: Record<RupturaTipo, string> = {
  direccion: 'Dirección',
  sistema: 'Sistema/Calendario',
  ejecucion: 'Ejecución',
  correccion: 'Corrección',
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function horaHHMM(fecha: Date): string {
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`
}

function nombreDiaCorto(fechaISO: string): string {
  const fecha = new Date(`${fechaISO}T00:00:00.000Z`)
  const texto = fecha.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * Auditoría ("¿el sistema se está corrigiendo?"): capa de observación y
 * corrección sobre Agenda y Misiones — nunca un segundo calendario ni una
 * segunda entidad de misión. Todo lo que este componente muestra sobre
 * eventos/bloques/misiones se lee en vivo vía `agenda/public.ts` y
 * `missions/public.ts` (mismas funciones puras que ya usa AgendaScreen);
 * lo único que Auditoría persiste por su cuenta son Rupturas, Premortems,
 * Correcciones semanales y su Config (ver auditoriaRepository.ts).
 *
 * Un solo archivo a propósito ("Regla 8: menos archivos, más reuso" del
 * proyecto) — ocho secciones del mismo ciclo DIRECCIÓN → CALENDARIO →
 * EJECUCIÓN → EVIDENCIA → RUPTURA → CORRECCIÓN → PRÓXIMA SEMANA, ninguna
 * lo bastante grande como para justificar partirla.
 */
export function AuditoriaScreen() {
  const {
    rupturas,
    premortems,
    correcciones,
    config,
    ready: auditReady,
    addRuptura,
    addPremortem,
    deletePremortem,
    guardarCorreccion,
    marcarCorreccionAplicada,
    updateConfig,
  } = useAuditoria()
  const { ideas } = useIdeas()
  const misionesPrincipales = useMisionesPrincipales()

  const [semanaOffset, setSemanaOffset] = useState(0)
  const hoy = hoyISO()
  const semanaId = useMemo(() => semanaDesplazada(mondayOf(hoy), semanaOffset), [hoy, semanaOffset])
  const dias = useMemo(() => weekDays(semanaId), [semanaId])
  const { eventos, bloques, ready: agendaReady } = useAgendaSemana(dias)

  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const esSemanaActual = semanaOffset === 0
  const bloquesActivos = useMemo(() => bloques.filter((bloque) => !bloque.archivado), [bloques])
  const eventosHoy = useMemo(() => eventos.filter((evento) => evento.fecha === hoy), [eventos, hoy])
  const bloquesHoy = useMemo(() => bloquesActivos.filter((bloque) => bloque.dia === hoy), [bloquesActivos, hoy])
  const conflictosHoy = useMemo(() => calcularConflictosDia(eventosHoy, bloquesHoy), [eventosHoy, bloquesHoy])
  const hayConflictoHoy = conflictosHoy.conflictosPorEvento.size > 0

  type ItemHoy = {
    id: string
    tipo: 'evento' | 'bloque'
    texto: string
    hora: string | null
    protegido?: boolean | undefined
    completado: boolean
  }
  const itemsHoy = useMemo<ItemHoy[]>(
    () =>
      [
        ...eventosHoy.map((e) => ({ id: e.id, tipo: 'evento' as const, texto: e.texto, hora: e.hora, completado: e.completado })),
        ...bloquesHoy.map((b) => ({
          id: b.id,
          tipo: 'bloque' as const,
          texto: b.texto,
          hora: b.hora,
          protegido: b.protegido,
          completado: b.completado,
        })),
      ].sort((a, b) => (a.hora ?? '99:99').localeCompare(b.hora ?? '99:99')),
    [eventosHoy, bloquesHoy],
  )
  const horaActual = horaHHMM(ahora)
  const enCurso = useMemo(
    () =>
      itemsHoy.find((item) => {
        const rango = extraerRangoHora(item.texto)
        return rango ? rango.inicio <= horaActual && horaActual <= rango.fin : false
      }) ?? null,
    [itemsHoy, horaActual],
  )
  const siguienteBloque = useMemo(
    () => itemsHoy.find((item) => !item.completado && item.hora && item.hora >= horaActual) ?? null,
    [itemsHoy, horaActual],
  )
  const bloquesProtegidosHoy = useMemo(
    () => bloquesHoy.filter((b) => b.protegido).sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? '')),
    [bloquesHoy],
  )

  const misionActual = misionesPrincipales[0] ?? null

  const evidencia = useMemo(
    () => (config ? calcularEvidencia(dias, bloques, ideas, config, hoy) : null),
    [dias, bloques, ideas, config, hoy],
  )

  const premortemsSemana = useMemo(() => premortems.filter((p) => p.semanaId === semanaId), [premortems, semanaId])
  const correccionSemana = useMemo(() => correcciones.find((c) => c.semanaId === semanaId) ?? null, [correcciones, semanaId])

  const [rupturaTexto, setRupturaTexto] = useState('')
  const [rupturaTipo, setRupturaTipo] = useState<RupturaTipo>('ejecucion')

  const [premortemPatron, setPremortemPatron] = useState('')
  const [premortemSeñal, setPremortemSeñal] = useState('')
  const [premortemCuando, setPremortemCuando] = useState('')
  const [premortemRespuesta, setPremortemRespuesta] = useState('')

  const [señalRojaEdit, setSeñalRojaEdit] = useState(false)
  const [condicionForm, setCondicionForm] = useState('')
  const [respuestaSeñalForm, setRespuestaSeñalForm] = useState('')
  useEffect(() => {
    if (config) {
      setCondicionForm(config.señalRoja.condicion)
      setRespuestaSeñalForm(config.señalRoja.respuesta)
    }
  }, [config])

  const [resultadoDominanteForm, setResultadoDominanteForm] = useState('')
  useEffect(() => {
    if (config) setResultadoDominanteForm(config.resultadoDominante)
  }, [config])

  type CorreccionForm = Omit<AuditCorreccionSemanal, 'id' | 'semanaId' | 'bloqueCreadoId' | 'createdAt' | 'updatedAt' | 'pendingSync'>
  const CORRECCION_VACIA: CorreccionForm = {
    promesa: '',
    ejecutadoReal: '',
    evidenciaProducida: '',
    capaRuptura: 'ejecucion',
    aprendizaje: '',
    correccionUnica: '',
    dondeEnCalendario: '',
  }
  const [correccionForm, setCorreccionForm] = useState<CorreccionForm>(CORRECCION_VACIA)
  useEffect(() => {
    setCorreccionForm(
      correccionSemana
        ? {
            promesa: correccionSemana.promesa,
            ejecutadoReal: correccionSemana.ejecutadoReal,
            evidenciaProducida: correccionSemana.evidenciaProducida,
            capaRuptura: correccionSemana.capaRuptura,
            aprendizaje: correccionSemana.aprendizaje,
            correccionUnica: correccionSemana.correccionUnica,
            dondeEnCalendario: correccionSemana.dondeEnCalendario,
          }
        : CORRECCION_VACIA,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semanaId, correccionSemana?.id])

  const semanaRealId = useMemo(() => mondayOf(hoy), [hoy])
  const historial = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => {
        const id = semanaDesplazada(semanaRealId, -i)
        return { semanaId: id, correccion: correcciones.find((c) => c.semanaId === id) ?? null }
      }),
    [semanaRealId, correcciones],
  )

  if (!auditReady || !agendaReady || !config) return null

  async function aplicarCorreccion() {
    if (!correccionSemana || correccionSemana.bloqueCreadoId) return
    const proximaSemanaId = semanaDesplazada(semanaId, 1)
    const texto = `Corrección: ${correccionSemana.correccionUnica}${
      correccionSemana.dondeEnCalendario ? ` (${correccionSemana.dondeEnCalendario})` : ''
    }`
    const bloqueCreado = await crearBloqueDesdeCorreccion({ texto, dia: proximaSemanaId })
    await marcarCorreccionAplicada(correccionSemana.id, bloqueCreado.id)
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 pb-10">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent">Auditoría</p>
      </div>

      <div className="flex items-center justify-between">
        <button type="button" className="idea-destino" onClick={() => setSemanaOffset((o) => o - 1)}>
          ← Semana anterior
        </button>
        <span className="text-[12.5px] text-ink-faint">
          {nombreDiaCorto(dias[0] ?? semanaId)} – {nombreDiaCorto(dias[6] ?? semanaId)}
          {esSemanaActual ? ' · actual' : ''}
        </span>
        <button type="button" className="idea-destino" onClick={() => setSemanaOffset((o) => o + 1)}>
          Semana siguiente →
        </button>
      </div>
      {!esSemanaActual ? (
        <button type="button" className="idea-destino self-start" onClick={() => setSemanaOffset(0)}>
          Volver a la semana actual
        </button>
      ) : null}

      {/* DIRECCIÓN */}
      <section className="flex flex-col gap-1.5">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Dirección</h2>
        <label className="flex flex-col gap-1">
          <span className="text-[12.5px] text-ink-faint">Resultado dominante</span>
          <input
            className={CAMPO}
            value={resultadoDominanteForm}
            onChange={(e) => setResultadoDominanteForm(e.target.value)}
            onBlur={() => {
              if (resultadoDominanteForm.trim() && resultadoDominanteForm !== config.resultadoDominante) {
                void updateConfig({ resultadoDominante: resultadoDominanteForm.trim() })
              }
            }}
          />
        </label>
      </section>

      {/* CALENDARIO / EJECUCIÓN — vista temporal */}
      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Ahora</h2>
        {esSemanaActual && hayConflictoHoy ? (
          <p className="text-[13px] text-ink">⚠ Hay un conflicto sin resolver hoy — resolvelo en Agenda.</p>
        ) : null}
        {esSemanaActual ? (
          <>
            <p className="text-[15px] text-ink">
              {enCurso ? `${enCurso.tipo === 'bloque' ? '■' : '·'} ${enCurso.texto}` : 'Nada en curso.'}
            </p>
            <p className="text-[12.5px] text-ink-faint">
              Siguiente:{' '}
              {siguienteBloque
                ? `${siguienteBloque.hora ? `${formatearHora12(siguienteBloque.hora)} · ` : ''}${siguienteBloque.texto}`
                : 'nada más por hoy'}
            </p>
          </>
        ) : null}
        <div className="flex flex-col gap-1">
          <p className="text-[12.5px] text-ink-faint">Bloques protegidos de hoy</p>
          {bloquesProtegidosHoy.length === 0 ? (
            <p className="text-[13.5px] text-ink-faint">Ninguno.</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {bloquesProtegidosHoy.map((b) => (
                <li key={b.id} className="text-[14px] text-ink">
                  {b.completado ? '✓' : '○'} {b.hora ? `${formatearHora12(b.hora)} · ` : ''}
                  {b.texto}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Misión actual */}
      <section className="flex flex-col gap-1.5">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Misión actual</h2>
        <p className="text-[15px] text-ink">{misionActual ? misionActual.texto : 'Sin misión principal elegida.'}</p>
        {bloquesProtegidosHoy.length > 0 ? (
          <p className="text-[13.5px] text-ink-faint">
            {bloquesProtegidosHoy.map((b) => (b.completado ? '●' : '○')).join(' ')}
          </p>
        ) : null}
      </section>

      {/* EVIDENCIA */}
      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Evidencia de la semana</h2>
        {evidencia ? (
          <>
            {evidencia.porRutina.length === 0 ? (
              <EmptyState title="Sin rutinas configuradas." description="Agregalas en la config de Auditoría." />
            ) : (
              <ul className="flex flex-col gap-0.5">
                {evidencia.porRutina.map((r) => (
                  <li key={r.etiqueta} className="text-[14px] text-ink">
                    {r.etiqueta}: {r.ejecutados}/{r.planificados}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[13.5px] text-ink-faint">
              Horas protegidas ejecutadas: {evidencia.horasEjecutadas.toFixed(1)} / {evidencia.horasProtegidas.toFixed(1)}
            </p>
            <p className="text-[13.5px] text-ink-faint">
              Misiones: {evidencia.misionesCompletadas}/{evidencia.misionesProgramadas}
            </p>
            {evidencia.bloquesOmitidos > 0 ? (
              <p className="text-[13.5px] text-ink">Bloques protegidos omitidos: {evidencia.bloquesOmitidos}</p>
            ) : null}
          </>
        ) : null}
      </section>

      {/* RUPTURA */}
      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Rupturas</h2>
        {rupturas.length === 0 ? (
          <EmptyState title="Sin rupturas registradas." />
        ) : (
          <ul className="flex flex-col gap-1">
            {rupturas.slice(0, 10).map((r) => (
              <li key={r.id} className="border-b border-border/40 pb-1 text-[14px] text-ink">
                {r.fecha} · {ETIQUETA_RUPTURA[r.tipo]} · {r.texto}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-1.5">
          <input
            className={CAMPO}
            placeholder="Registrar como ruptura…"
            value={rupturaTexto}
            onChange={(e) => setRupturaTexto(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <select
              className="border-b border-border/60 bg-transparent text-[13px] text-ink outline-none"
              value={rupturaTipo}
              onChange={(e) => setRupturaTipo(e.target.value as RupturaTipo)}
            >
              {(Object.keys(ETIQUETA_RUPTURA) as RupturaTipo[]).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {ETIQUETA_RUPTURA[tipo]}
                </option>
              ))}
            </select>
            {rupturaTexto.trim() ? (
              <button
                type="button"
                className="accion-primaria px-3 py-1.5 text-[13px]"
                onClick={() => {
                  void addRuptura({ fecha: hoy, texto: rupturaTexto.trim(), tipo: rupturaTipo })
                  setRupturaTexto('')
                }}
              >
                Guardar
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* PREMORTEM + señal roja */}
      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Premortem de la semana</h2>
        {premortemsSemana.length === 0 ? (
          <EmptyState title="Sin riesgos anticipados para esta semana." />
        ) : (
          <ul className="flex flex-col gap-1">
            {premortemsSemana.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-2 border-b border-border/40 pb-1 text-[14px] text-ink">
                <span>
                  {p.patron} — primera señal: {p.primeraSeñal} ({p.cuando}) → {p.respuesta}
                </span>
                <button type="button" className="idea-destino shrink-0" onClick={() => void deletePremortem(p.id)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-1.5">
          <input className={CAMPO} placeholder="¿Qué patrón podría fallar?" value={premortemPatron} onChange={(e) => setPremortemPatron(e.target.value)} />
          <input className={CAMPO} placeholder="Primera señal" value={premortemSeñal} onChange={(e) => setPremortemSeñal(e.target.value)} />
          <input className={CAMPO} placeholder="¿Cuándo suele aparecer?" value={premortemCuando} onChange={(e) => setPremortemCuando(e.target.value)} />
          <input className={CAMPO} placeholder="Respuesta pre-decidida" value={premortemRespuesta} onChange={(e) => setPremortemRespuesta(e.target.value)} />
          {premortemPatron.trim() && premortemSeñal.trim() && premortemCuando.trim() && premortemRespuesta.trim() ? (
            <button
              type="button"
              className="accion-primaria self-start px-3 py-1.5 text-[13px]"
              onClick={() => {
                void addPremortem({
                  semanaId,
                  patron: premortemPatron.trim(),
                  primeraSeñal: premortemSeñal.trim(),
                  cuando: premortemCuando.trim(),
                  respuesta: premortemRespuesta.trim(),
                })
                setPremortemPatron('')
                setPremortemSeñal('')
                setPremortemCuando('')
                setPremortemRespuesta('')
              }}
            >
              Guardar
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-1 border-t border-border/40 pt-2">
          <p className="text-[12.5px] text-ink-faint">Señal roja</p>
          {señalRojaEdit ? (
            <div className="flex flex-col gap-1.5">
              <input className={CAMPO} value={condicionForm} onChange={(e) => setCondicionForm(e.target.value)} />
              <input className={CAMPO} value={respuestaSeñalForm} onChange={(e) => setRespuestaSeñalForm(e.target.value)} />
              <button
                type="button"
                className="accion-primaria self-start px-3 py-1.5 text-[13px]"
                onClick={() => {
                  void updateConfig({ señalRoja: { condicion: condicionForm.trim(), respuesta: respuestaSeñalForm.trim() } })
                  setSeñalRojaEdit(false)
                }}
              >
                Guardar
              </button>
            </div>
          ) : (
            <button type="button" className="flex flex-col items-start gap-0.5 text-left" onClick={() => setSeñalRojaEdit(true)}>
              <span className="text-[14px] text-ink">Si: {config.señalRoja.condicion}</span>
              <span className="text-[13.5px] text-ink-faint">Entonces: {config.señalRoja.respuesta}</span>
            </button>
          )}
        </div>
      </section>

      {/* CORRECCIÓN SEMANAL */}
      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Corrección semanal</h2>
        <label className="flex flex-col gap-1">
          <span className="text-[12.5px] text-ink-faint">1. ¿Qué prometí ejecutar esta semana?</span>
          <input className={CAMPO} value={correccionForm.promesa} onChange={(e) => setCorreccionForm((f) => ({ ...f, promesa: e.target.value }))} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12.5px] text-ink-faint">2. ¿Qué hice realmente?</span>
          <input className={CAMPO} value={correccionForm.ejecutadoReal} onChange={(e) => setCorreccionForm((f) => ({ ...f, ejecutadoReal: e.target.value }))} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12.5px] text-ink-faint">3. ¿Qué evidencia produje?</span>
          <input className={CAMPO} value={correccionForm.evidenciaProducida} onChange={(e) => setCorreccionForm((f) => ({ ...f, evidenciaProducida: e.target.value }))} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12.5px] text-ink-faint">4. ¿En qué capa apareció la ruptura?</span>
          <select
            className="border-b border-border/60 bg-transparent text-[15px] text-ink outline-none"
            value={correccionForm.capaRuptura}
            onChange={(e) => setCorreccionForm((f) => ({ ...f, capaRuptura: e.target.value as RupturaTipo }))}
          >
            {(Object.keys(ETIQUETA_RUPTURA) as RupturaTipo[]).map((tipo) => (
              <option key={tipo} value={tipo}>
                {ETIQUETA_RUPTURA[tipo]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12.5px] text-ink-faint">5. ¿Qué aprendí?</span>
          <input className={CAMPO} value={correccionForm.aprendizaje} onChange={(e) => setCorreccionForm((f) => ({ ...f, aprendizaje: e.target.value }))} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12.5px] text-ink-faint">6. ¿Cuál es la única corrección que aplicaré?</span>
          <input className={CAMPO} value={correccionForm.correccionUnica} onChange={(e) => setCorreccionForm((f) => ({ ...f, correccionUnica: e.target.value }))} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12.5px] text-ink-faint">7. ¿Dónde aparece esa corrección en el calendario de la próxima semana?</span>
          <input className={CAMPO} value={correccionForm.dondeEnCalendario} onChange={(e) => setCorreccionForm((f) => ({ ...f, dondeEnCalendario: e.target.value }))} />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="accion-primaria self-start px-3 py-1.5 text-[13px]"
            onClick={() => void guardarCorreccion(semanaId, correccionForm)}
          >
            Guardar
          </button>
          {correccionSemana && !correccionSemana.bloqueCreadoId ? (
            <button type="button" className="idea-destino" onClick={() => void aplicarCorreccion()}>
              Aplicar a próxima semana
            </button>
          ) : null}
          {correccionSemana?.bloqueCreadoId ? <span className="text-[12.5px] text-ink-faint">Ya aplicada.</span> : null}
        </div>
      </section>

      {/* PRÓXIMA SEMANA — historial de 4 semanas */}
      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Historial (4 semanas)</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border/40 text-left text-ink-faint">
                <th className="py-1 pr-2 font-normal">Semana</th>
                <th className="py-1 pr-2 font-normal">Promesa</th>
                <th className="py-1 pr-2 font-normal">Evidencia</th>
                <th className="py-1 pr-2 font-normal">Ruptura</th>
                <th className="py-1 font-normal">Corrección</th>
              </tr>
            </thead>
            <tbody>
              {historial.map(({ semanaId: id, correccion }) => (
                <tr key={id} className="border-b border-border/20 align-top text-ink">
                  <td className="py-1 pr-2">{nombreDiaCorto(id)}</td>
                  <td className="py-1 pr-2">{correccion?.promesa || '—'}</td>
                  <td className="py-1 pr-2">{correccion?.evidenciaProducida || '—'}</td>
                  <td className="py-1 pr-2">{correccion ? ETIQUETA_RUPTURA[correccion.capaRuptura] : '—'}</td>
                  <td className="py-1">{correccion?.correccionUnica || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
