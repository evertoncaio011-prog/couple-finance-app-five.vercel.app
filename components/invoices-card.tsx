import Link from 'next/link'
import { ChevronRight, CreditCard } from 'lucide-react'
import { formatCurrency, monthLabel } from '@/lib/format'
import type { CardInvoice } from '@/lib/types'

export function InvoicesCard({
  total,
  invoices,
}: {
  total: number
  invoices: CardInvoice[]
}) {
  return (
    <Link
      href="/cards"
      className="mx-5 flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CreditCard className="h-4 w-4" aria-hidden />
          <span className="text-sm font-medium">Fatura dos cartões</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/60" aria-hidden />
      </div>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma fatura em aberto.</p>
      ) : (
        <>
          <p className="font-heading text-2xl font-bold tabular-nums">
            {formatCurrency(total)}
          </p>
          <p className="text-xs text-muted-foreground">
            Já gasto no cartão, ainda não descontado do saldo — sai da conta
            quando você pagar a fatura.
          </p>
          <ul className="flex flex-col gap-1">
            {invoices.map((inv) => (
              <li
                key={`${inv.card.id}-${inv.competencia}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: inv.card.color }}
                  />
                  {inv.card.name} · {monthLabel(inv.competencia)}
                </span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(inv.total)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Link>
  )
}
