import { EmptyState } from '@/components/ui/EmptyState'

export function ModulePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center">
      <EmptyState
        title={`${title} todavía no existe.`}
        description="Se construye cuando tenga evidencia detrás, no antes."
      />
    </div>
  )
}
