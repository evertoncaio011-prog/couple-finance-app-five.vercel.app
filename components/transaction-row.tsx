'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
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

  const color = tx.category?.color ?? (isIncome ? '#16a34a' : '#e11d48')

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full cursor-pointer text-left transition-colors hover:bg-muted/50 active:bg-muted/70"
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{
              backgroundColor: `${color}22`,
              color,
            }}
          >
            {(tx.category?.name ?? (isIncome ? 'R' : isNeutral ? 'O' : 'D')).charAt(0).toUpperCase()}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium leading-tight">
              {tx.description || tx.category?.name || (isIncome ? 'Receita' : isNeutral ? 'Outros' : 'Despesa')}
            </p>

            <p className="truncate text-xs text-muted-foreground">
              {tx.category?.name ?? 'Sem categoria'}
              {' • '}
              {formatDateShort(tx.date)}
              {tx.card && ` • Cartão ${tx.card.name}`}
              {tx.author?.display_name && ` • ${tx.author.display_name}`}
              {tx.affects_balance === false && ' • Não afeta o saldo'}
            </p>
          </div>

          <span
            className={cn(
              'shrink-0 text-base font-bold tabular-nums',
              isIncome ? 'text-emerald-600' : 'text-rose-600',
            )}
          >
            {/* O sinal de menos aparece para despesas e para "Outros" */}
            {isOutgoing ? '−' : '+'}
            {formatCurrency(Number(tx.amount))}
          </span>

          <ChevronRight
            aria-hidden
            className="h-4 w-4 shrink-0 text-muted-foreground/60"
          />
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