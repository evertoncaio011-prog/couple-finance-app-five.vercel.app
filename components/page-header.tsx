'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  const router = useRouter()

  return (
    <header className="flex items-start justify-between gap-4 py-4 pr-5 pl-16 pt-6 lg:pl-5">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Voltar"
        className="fixed left-5 top-6 z-40 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform active:scale-90 lg:hidden"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden />
      </button>

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
