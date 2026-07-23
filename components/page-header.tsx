export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-4 py-4 pr-5 pl-16 pt-6 lg:pl-5">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground text-pretty">{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  )
}
