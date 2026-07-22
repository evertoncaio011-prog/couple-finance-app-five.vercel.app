'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Wallet, Ban, Coins } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  invoiceTotal,
  paidSoFar,
}: {
  cardId: string
  competencia: string
  /** Valor ainda em aberto (o que falta pagar). */
  total: number
  /** Valor cheio da fatura, sem descontar nenhum adiantamento. */
  invoiceTotal?: number
  /** Quanto já foi adiantado/pago dessa fatura até agora. */
  paidSoFar?: number
}) {
  const [open, setOpen] = useState(false)
  const [affectsBalance, setAffectsBalance] = useState(true)
  const [isPartial, setIsPartial] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [pending, startTransition] = useTransition()

  const parsedAmount = Number(customAmount.replace(',', '.'))
  const amountValid =
    !isPartial || (customAmount.trim() !== '' && parsedAmount > 0 && parsedAmount <= total)

  function handleConfirm() {
    if (!amountValid) return
    const amountToSend = isPartial ? parsedAmount : undefined

    startTransition(async () => {
      const res = await payCardInvoice(cardId, competencia, affectsBalance, amountToSend)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      if (isPartial) {
        toast.success('Adiantamento registrado! O restante da fatura continua em aberto.')
      } else {
        toast.success(
          affectsBalance
            ? 'Fatura paga! O valor já saiu do saldo em conta.'
            : 'Fatura marcada como paga. O saldo em conta não foi alterado.',
        )
      }
      setOpen(false)
      setIsPartial(false)
      setCustomAmount('')
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
            <SheetDescription>
              {isPartial ? 'Valor em aberto' : 'Pagar fatura'}
            </SheetDescription>
            <SheetTitle className="text-3xl font-bold tabular-nums">
              {formatCurrency(total)}
            </SheetTitle>
            {typeof invoiceTotal === 'number' && typeof paidSoFar === 'number' && paidSoFar > 0 && (
              <p className="text-xs text-muted-foreground">
                Fatura total {formatCurrency(invoiceTotal)} · já adiantado{' '}
                {formatCurrency(paidSoFar)}
              </p>
            )}
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

            <div className="border-t border-border pt-4">
              <label className="flex items-start gap-3 rounded-2xl p-1 text-left">
                <input
                  type="checkbox"
                  checked={isPartial}
                  onChange={(e) => setIsPartial(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                />
                <span className="flex items-start gap-2">
                  <Coins className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="block font-medium">Foi só um adiantamento</span>
                    <span className="block text-xs text-muted-foreground">
                      Pagar um valor parcial. O restante continua em aberto nessa fatura.
                    </span>
                  </span>
                </span>
              </label>

              {isPartial && (
                <div className="mt-3 grid gap-1.5">
                  <Label htmlFor="partial_amount">Valor adiantado</Label>
                  <Input
                    id="partial_amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    max={total}
                    placeholder={`Até ${formatCurrency(total)}`}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                  {customAmount.trim() !== '' && !amountValid && (
                    <p className="text-xs font-medium text-destructive">
                      Informe um valor maior que zero e até {formatCurrency(total)}.
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={pending || !amountValid}
              onClick={handleConfirm}
            >
              {pending ? 'Pagando…' : 'Confirmar pagamento'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
