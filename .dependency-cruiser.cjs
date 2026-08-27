/**
 * F15.5 (ARCHITECTURE_RATIFIED.md §1): la única fuente mecánica de
 * verdad para las fronteras de import. Reemplaza los overrides
 * `no-restricted-imports` de `.oxlintrc.json` — esa regla no existe en
 * oxlint (confirmado: `--rules` no la lista bajo ningún plugin, ni
 * siquiera con `--import-plugin`), así que esos overrides nunca
 * bloquearon nada. dependency-cruiser resuelve los alias vía
 * `tsconfig.app.json` y compara rutas de archivo reales, así que
 * también atrapa violaciones hechas con imports relativos, no solo con
 * el alias.
 */
module.exports = {
  forbidden: [
    {
      name: 'design-system-is-a-leaf',
      severity: 'error',
      comment: 'estudio-design-system no puede depender de cognitive-engine, world, shared-kernel, modules ni del árbol de aplicación (ARCHITECTURE_RATIFIED.md §2).',
      from: { path: '^src/packages/estudio-design-system' },
      to: { path: '^src/(packages/(cognitive-engine|world|shared-kernel)|modules|app|features|components|lib|types|main\\.tsx|App\\.tsx)' },
    },
    {
      name: 'cognitive-engine-no-dom',
      severity: 'error',
      comment: 'cognitive-engine no puede depender de React/DOM (ARCHITECTURE_RATIFIED.md §4).',
      from: { path: '^src/packages/cognitive-engine' },
      to: { path: '^node_modules/(react|react-dom)/' },
    },
    {
      name: 'cognitive-engine-boundaries',
      severity: 'error',
      comment: 'cognitive-engine no puede depender de estudio-design-system, world, modules ni del árbol de aplicación (ARCHITECTURE_RATIFIED.md §4).',
      from: { path: '^src/packages/cognitive-engine' },
      to: { path: '^src/(packages/(estudio-design-system|world)|modules|app|features|components|lib|types|main\\.tsx|App\\.tsx)' },
    },
    {
      name: 'shared-kernel-is-a-leaf',
      severity: 'error',
      comment: 'shared-kernel no puede depender de estudio-design-system, cognitive-engine, world, modules ni del árbol de aplicación (ARCHITECTURE_RATIFIED.md §11).',
      from: { path: '^src/packages/shared-kernel' },
      to: { path: '^src/(packages/(estudio-design-system|cognitive-engine|world)|modules|app|features|components|lib|types|main\\.tsx|App\\.tsx)' },
    },
    {
      name: 'world-boundaries',
      severity: 'error',
      comment: 'world no puede depender de cognitive-engine, de un módulo específico ni del árbol de aplicación (ARCHITECTURE_RATIFIED.md §3).',
      from: { path: '^src/packages/world' },
      to: { path: '^src/(packages/cognitive-engine|modules|app|features|components|lib|types|main\\.tsx|App\\.tsx)' },
    },
    {
      name: 'module-no-world',
      severity: 'error',
      comment: 'un módulo no puede depender de world — el mundo solo reacciona a señales genéricas (ARCHITECTURE_RATIFIED.md §7). Excepciones documentadas (código de sprints anteriores a F15.5/F16, nunca antes verificado mecánicamente, relocado sin cambio de comportamiento): work-table/IdeaCapture.tsx, missions/MisionesScreen.tsx, habits/HabitosScreen.tsx y trading/TradingScreen.tsx ya llamaban a setGaze/MUEBLES/WORLD_PLACES/getSheetPlacement directamente. Condición de remoción: un sprint dedicado a reemplazar esas llamadas directas por el bus de eventos, para cada archivo.',
      from: {
        path: '^src/modules',
        pathNot: '^src/modules/work-table/IdeaCapture\\.tsx$|^src/modules/missions/MisionesScreen\\.tsx$|^src/modules/habits/HabitosScreen\\.tsx$|^src/modules/trading/TradingScreen\\.tsx$',
      },
      to: { path: '^src/packages/world' },
    },
    {
      name: 'module-no-app-tree',
      severity: 'error',
      comment: 'un módulo no puede depender del árbol de aplicación todavía no migrado (ARCHITECTURE_RATIFIED.md §7). Excluye a `today`, que tiene su propia regla dedicada (today-app-tree-boundaries) por ser el orquestador declarado. Excepciones universales documentadas: (1) src/lib/db/db.ts es la instancia Dexie compartida que todo Repository necesita — todavía no migrada a shared-kernel/persistence. (2) src/app/shell/comprehensionEngine.ts es el singleton de composición que work-table/IdeaCapture.tsx consume directamente — Foundation §17 fase 3 lo corrige formalmente. (3) src/components/ui/EmptyState.tsx es UI compartida (usada por missions, habits, journal, trading, library) todavía no migrada a estudio-design-system (F9 solo migró tokens, sin componentes). Condición de remoción: (1) cuando db.ts se relocalice a shared-kernel/persistence; (2) cuando se ejecute esa fase 3; (3) cuando EmptyState se relocalice a estudio-design-system.',
      from: { path: '^src/modules', pathNot: '^src/modules/today/' },
      to: {
        path: '^src/(app|features|components|lib|types|main\\.tsx|App\\.tsx)',
        pathNot: '^src/lib/db/db\\.ts$|^src/app/shell/comprehensionEngine\\.ts$|^src/components/ui/EmptyState\\.tsx$',
      },
    },
    {
      name: 'today-app-tree-boundaries',
      severity: 'error',
      comment: 'today (renombrado de `hoy` en F16) es el único módulo orquestador declarado (ARCHITECTURE_RATIFIED.md §1/§7; Foundation §6). Excepciones documentadas: HoyScreen.tsx ya componía memoria, workspace y room antes de existir enforcement mecánico; PhraseSlot.tsx ya usaba lib/voice/voiceEngine. Además hereda las 3 excepciones universales de module-no-app-tree. Condición de remoción: (1) cuando memoria, workspace y room se relocalicen cada uno a su propio módulo (mismo patrón que F16), today debería importar sus public.ts en vez de sus internos; (2) cuando lib/voice se relocalice a su paquete lógico definitivo.',
      from: { path: '^src/modules/today' },
      to: {
        path: '^src/(app|features|components|lib|types|main\\.tsx|App\\.tsx)',
        pathNot: '^src/lib/db/db\\.ts$|^src/app/shell/comprehensionEngine\\.ts$|^src/components/ui/EmptyState\\.tsx$|^src/features/memoria/|^src/features/workspace/|^src/features/room/|^src/components/room/|^src/lib/voice/',
      },
    },
    {
      name: 'module-no-cross-module-import',
      severity: 'error',
      comment: 'un módulo nunca importa el interior de otro módulo — solo su public.ts o el bus de eventos. `today` puede importar el public.ts de cualquier módulo, como orquestador declarado (ARCHITECTURE_RATIFIED.md §7; renombrado de `hoy` en F16). Excepción adicional explícita (misma cláusula de §7: "cualquier módulo futuro que pida el mismo privilegio requiere una entrada nueva"): cualquier módulo de contenido puede importar `work-table/public.ts` — work-table es la infraestructura compartida de enrutamiento de ideas que todo destino de contenido consume por diseño (ver `IdeaDestino` en src/types/idea.ts), sancionado explícitamente por el roadmap F15 (`actualizar habitos, diario, misiones para importar solo desde public.ts`). `auditoria` queda excluido de esta regla general porque tiene su propia regla dedicada (auditoria-boundaries, más abajo): su privilegio es más angosto que el de `today` (dos public.ts puntuales, no cualquiera).',
      from: { path: '^src/modules/(?!today/|auditoria/|settings/)([^/]+)/' },
      to: { path: '^src/modules/(?!$1/)[^/]+/', pathNot: '^src/modules/work-table/public\\.ts$' },
    },
    {
      name: 'settings-boundaries',
      severity: 'error',
      comment: 'Módulo Ajustes — pantalla de utilidades (exportar datos, actualizar la PWA), nunca un panel que reimplementa la lógica de otros módulos. Ejerce el mismo privilegio angosto que auditoria-boundaries: solo puede importar `finance/public.ts` (necesita `obtenerDatosParaExportar` para el backup de Finanzas) — nunca el interior de ese módulo, y nunca el public.ts de ningún otro.',
      from: { path: '^src/modules/settings/' },
      to: {
        path: '^src/modules/(?!settings/)[^/]+/',
        pathNot: '^src/modules/finance/public\\.ts$',
      },
    },
    {
      name: 'auditoria-boundaries',
      severity: 'error',
      comment: 'Módulo Auditoría — capa de observación/corrección sobre Agenda y Misiones, nunca un segundo calendario ni una segunda entidad de misión (brief del sprint). Ejerce acá el mismo privilegio que la cláusula de §7 de module-no-cross-module-import prevé para "cualquier módulo futuro que pida el mismo privilegio": puede importar `agenda/public.ts` y `missions/public.ts` (más `work-table/public.ts`, universal) — nunca el interior de esos módulos, y nunca el public.ts de ningún otro.',
      from: { path: '^src/modules/auditoria/' },
      to: {
        path: '^src/modules/(?!auditoria/)[^/]+/',
        pathNot: '^src/modules/(work-table|agenda|missions)/public\\.ts$',
      },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.app.json' },
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '\\.test\\.(ts|tsx)$' },
  },
}
