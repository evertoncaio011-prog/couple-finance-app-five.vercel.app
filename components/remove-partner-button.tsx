'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { UserMinus } from 'lucide-react'
import { removePartner } from '@/app/actions'
import { Button } from '@/components/ui/button'

export function RemovePartnerButton({
  partnerId,
  partnerName,
}: {
  partnerId: string
  partnerName: string
}) {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    if (
      !window.confirm(
        `Remover ${partnerName} deste orçamento? A pessoa vai deixar de ver essas transações e categorias.`,
      )
    )
      return
    startTransition(async () => {
      const res = await removePartner(partnerId)
      if (res?.error) toast.error(res.error)
      else toast.success(`${partnerName} foi removido(a) do orçamento.`)
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="shrink-0 text-muted-foreground transition-colors hover:text-destructive active:scale-90"
      onClick={handleClick}
      disabled={pending}
      aria-label={`Remover ${partnerName}`}
    >
      <UserMinus className="h-4 w-4" aria-hidden />
    </Button>
  )
}
