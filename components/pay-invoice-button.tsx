'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Wallet, Ban } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { payCardInvoice } from '@/app/actions'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

export function PayInvoiceButton({
  cardId,
  competencia,
  total,
}: {
  cardId: string
  competencia: string
  total: number
}) {
  const [open, setOpen] = useState(false)
  const [affectsBalance, setAffectsBalance] = useState(true)
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const res = await payCardInvoice(cardId, competencia, affectsBalance)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(
        affectsBalance
          ? 'Fatura paga! O valor já saiu do saldo em conta.'
          : 'Fatura marcada como paga. O saldo em conta não foi alterado.',
      )
      setOpen(false)
    })
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Pagar fatura
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="space-y-2 text-center">
            <SheetDescription>Pagar fatura</SheetDescription>
            <SheetTitle className="text-3xl font-bold tabular-nums">
              {formatCurrency(total)}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-6">
            <p className="text-sm text-muted-foreground">
              Como esse pagamento deve entrar na conta?
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setAffectsBalance(true)}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                  affectsBalance
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:bg-muted',
                )}
              >
                <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="block font-medium">Descontar do saldo</span>
                  <span className="block text-xs text-muted-foreground">
                    O valor sai do saldo em conta agora, como qualquer outra despesa.
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAffectsBalance(false)}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                  !affectsBalance
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:bg-muted',
                )}
              >
                <Ban className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="block font-medium">Não descontar do saldo</span>
                  <span className="block text-xs text-muted-foreground">
                    Marca a fatura como paga, mas o saldo em conta não muda — use quando
                    o pagamento foi feito com dinheiro que não passou pela conta.
                  </span>
                </span>
              </button>
            </div>

            <Button className="w-full" size="lg" disabled={pending} onClick={handleConfirm}>
              {pending ? 'Pagando…' : 'Confirmar pagamento'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
