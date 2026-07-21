'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function DeleteButton({
  onDelete,
  label = 'Excluir',
  confirmMessage = 'Excluir este item?',
}: {
  onDelete: () => Promise<{ error?: string; success?: boolean }>
  label?: string
  confirmMessage?: string
}) {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    if (!window.confirm(confirmMessage)) return
    startTransition(async () => {
      const res = await onDelete()
      if (res?.error) toast.error(res.error)
      else toast.success('Excluído com sucesso')
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground transition-colors hover:text-destructive active:scale-90"
      onClick={handleClick}
      disabled={pending}
      aria-label={label}
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </Button>
  )
}
