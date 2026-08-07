'use client'

import { useState } from 'react'
import { ChevronDown, Pencil } from 'lucide-react'
import { CardSheet } from '@/components/card-sheet'
import { PayInvoiceButton } from '@/components/pay-invoice-button'
import { formatCurrency, formatDateShort, monthLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Card, CardInvoice, TransactionWithMeta } from '@/lib/types'

type InvoiceWithTransactions = CardInvoice & { transactions: TransactionWithMeta[] }

function InvoiceRow({ invoice }: { invoice: InvoiceWithTransactions }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl bg-muted">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              Fatura de {monthLabel(invoice.competencia)}
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-transform',
                  expanded && 'rotate-180',
                )}
                aria-hidden
              />
            </p>
            <p className="font-bold tabular-nums">{formatCurrency(invoice.total)}</p>
          </div>
        </button>
        <PayInvoiceButton
          cardId={invoice.card.id}
          competencia={invoice.competencia}
          total={invoice.total}
          invoiceTotal={invoice.invoiceTotal}
          paidSoFar={invoice.paidSoFar}
        />
      </div>

      {expanded && (
        <div className="flex flex-col gap-1.5 border-t border-border/60 px-3 py-2.5">
          {invoice.transactions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhuma compra encontrada para essa fatura.
            </p>
          ) : (
            invoice.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {tx.description || tx.category?.name || 'Compra'}
                  </p>
                  <p className="truncate text-muted-foreground">
                    {tx.category?.name ?? 'Outros'} · {formatDateShort(tx.date)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  {formatCurrency(Number(tx.amount))}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function CardListItem({
  card,
  invoices,
  totalOpen,
}: {
  card: Card
  invoices: InvoiceWithTransactions[]
  totalOpen: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-xl text-left transition-colors hover:bg-muted/50"
      >
        <span
          aria-hidden
          className="h-9 w-9 shrink-0 rounded-full"
          style={{ backgroundColor: `${card.color}22`, border: `1px solid ${card.color}` }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{card.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
            <span>Fecha dia {card.closing_day}</span>
            <span aria-hidden>·</span>
            <span>Vence dia {card.due_day}</span>
            {Number(card.credit_limit) > 0 && (
              <>
                <span aria-hidden>·</span>
                <span>Limite {formatCurrency(Number(card.credit_limit))}</span>
              </>
            )}
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground/70">
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Editar
        </span>
      </button>

      {invoices.length === 0 ? (
        <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
          Nenhuma fatura em aberto.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {totalOpen > invoices[0].total && (
            <p className="text-xs font-medium text-muted-foreground">
              Total em aberto: {formatCurrency(totalOpen)}
            </p>
          )}
          {invoices.map((inv) => (
            <InvoiceRow key={inv.competencia} invoice={inv} />
          ))}
        </div>
      )}

      <CardSheet open={open} onOpenChange={setOpen} card={card} />
    </div>
  )
}
