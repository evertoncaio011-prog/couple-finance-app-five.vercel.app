'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-bold">
          Não foi possível carregar esta página
        </h2>
        <p className="max-w-xs text-sm text-muted-foreground text-pretty">
          Verifique sua conexão com a internet e tente novamente.
        </p>
      </div>
      <Button onClick={() => reset()}>Tentar novamente</Button>
    </div>
  )
}
