'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { formatCurrency, formatDateShort } from '@/lib/format'
import type { Card, Category, TransactionWithMeta } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TransactionSheet } from '@/components/transaction-sheet'

export function TransactionRow({
  tx,
  categories,
  cards,
  onDelete,
}: {
  tx: TransactionWithMeta
  categories: Category[]
  cards?: Card[]
  onDelete?: () => Promise<{ error?: string; success?: boolean }>
}) {
  const [open, setOpen] = useState(false)

  const isIncome = tx.type === 'income'
  const isExpense = tx.type === 'expense'
  const isNeutral = tx.type === 'neutral'
  // "Outros" (neutral) agora soma junto com os gastos do mês, então tem a
  // mesma cor/sinal de despesa — só o rótulo de fallback muda.
  const isOutgoing = isExpense || isNeutral

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full cursor-pointer rounded-2xl bg-card text-left shadow-sm transition-shadow hover:shadow-md active:shadow-sm"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate font-medium leading-tight">
              {tx.description || tx.category?.name || (isIncome ? 'Receita' : isNeutral ? 'Outros' : 'Despesa')}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {tx.category?.name ?? 'Outros'}
              {tx.card && ` · Cartão ${tx.card.name}`}
              {tx.author?.display_name && ` · ${tx.author.display_name}`}
              {tx.affects_balance === false && ' · Não afeta o saldo'}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p
              className={cn(
                'text-base font-bold tabular-nums leading-tight',
                isIncome ? 'text-emerald-600' : 'text-rose-600',
              )}
            >
              {/* O sinal de menos aparece para despesas e para "Outros" */}
              {isOutgoing ? '−' : '+'}
              {formatCurrency(Number(tx.amount))}
            </p>
            <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-muted-foreground">
              {formatDateShort(tx.date)}
              <Pencil className="h-3 w-3 text-muted-foreground/60" aria-hidden />
            </p>
          </div>
        </div>
      </button>

      <TransactionSheet
        open={open}
        onOpenChange={setOpen}
        transaction={tx}
        categories={categories}
        cards={cards}
        onDelete={onDelete}
      />
    </>
  )
}
