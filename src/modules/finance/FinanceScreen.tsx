import { useIdeas } from '@modules/work-table/public'
import { createFinanceEngine } from '@/components/finance-engine/createFinanceEngine'
import { FinanceEngineScreen } from '@/components/finance-engine/FinanceEngineScreen'
import { db } from '@/lib/db/db'

const engine = createFinanceEngine(db.financeAccounts, db.financeMovimientos, db.financeGoals, db.financeIncomePeriods)

/**
 * Finanzas general del usuario — thin wrapper sobre el motor compartido
 * (ver FinanceEngineScreen.tsx, mismo criterio que NotesScreen.tsx con
 * notes-engine). Lo único que este archivo aporta que "Mi proyecto" no
 * tiene es la captura automática Umbral→Finanzas: arma `ideaCapture` a
 * partir de `useIdeas()` y se lo pasa al motor; "Mi proyecto" no tiene
 * Umbral propio, así que instancia el mismo motor sin ese prop.
 */
export function FinanceScreen() {
  const finance = engine.useEngine()
  const { ideas, moveSheet } = useIdeas()

  return (
    <FinanceEngineScreen
      engine={finance}
      ideaCapture={{
        ideas: ideas.filter((idea) => idea.destino === 'finanzas'),
        onDescartar: (ideaId) => {
          const idea = ideas.find((i) => i.id === ideaId)
          if (idea) void moveSheet(idea, 'archivador')
        },
      }}
    />
  )
}
