interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="text-[15px] text-ink-dim">{title}</p>
      {description ? <p className="max-w-[38ch] text-[13.5px] text-ink-faint">{description}</p> : null}
    </div>
  )
}
