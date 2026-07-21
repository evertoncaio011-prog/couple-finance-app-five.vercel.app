'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { payCardInvoice } from '@/app/actions'
import { formatCurrency } from '@/lib/format'

export function PayInvoiceButton({
  cardId,
  competencia,
  total,
}: {
  cardId: string
  competencia: string
  total: number
}) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (
      !window.confirm(
        `Confirmar pagamento da fatura de ${formatCurrency(total)}? Isso vai gerar uma saída no saldo em conta.`,
      )
    ) {
      return
    }
    startTransition(async () => {
      const res = await payCardInvoice(cardId, competencia)
      if (res?.error) toast.error(res.error)
      else toast.success('Fatura paga! O valor já saiu do saldo em conta.')
    })
  }

  return (
    <Button type="button" size="sm" disabled={pending} onClick={handleClick}>
      {pending ? 'Pagando…' : 'Pagar fatura'}
    </Button>
  )
}
