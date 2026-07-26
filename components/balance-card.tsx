import { ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

export function BalanceCard({
  totalBalance,
  availableBalance,
  goalsReserved,
  monthIncome,
  monthExpense,
  accountName,
}: {
  totalBalance: number
  availableBalance: number
  goalsReserved: number
  monthIncome: number
  monthExpense: number
  accountName: string
}) {
  const net = monthIncome - monthExpense
  const isPositive = net >= 0

  return (
    <div className="mx-5 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            {accountName}
          </p>
          <p className="mt-0.5 font-heading text-lg font-bold text-foreground">
            Saldo disponível
          </p>
        </div>
        <span
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </span>
        </span>
      </div>

      <p className="mt-3 break-words font-heading text-3xl font-extrabold tracking-tight text-primary tabular-nums sm:text-4xl">
        {formatCurrency(availableBalance)}
      </p>

      <span
        className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
          isPositive ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-rose-600'
        }`}
      >
        {isPositive ? (
          <TrendingUp className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <TrendingDown className="h-3.5 w-3.5" aria-hidden />
        )}
        {isPositive ? 'Mês positivo' : 'Mês no vermelho'}
      </span>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600"
            >
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <p className="text-xs text-muted-foreground">Receita (mês)</p>
          </div>
          <p className="break-words text-base font-bold tabular-nums leading-tight">
            {formatCurrency(monthIncome)}
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600"
            >
              <ArrowDownRight className="h-4 w-4" />
            </span>
            <p className="text-xs text-muted-foreground">Gasto (mês)</p>
          </div>
          <p className="break-words text-base font-bold tabular-nums leading-tight">
            {formatCurrency(monthExpense)}
          </p>
        </div>
      </div>

      {goalsReserved > 0 && (
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs">
          <span className="text-muted-foreground">Reservado em metas</span>
          <span className="font-semibold tabular-nums">{formatCurrency(goalsReserved)}</span>
        </div>
      )}

      <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
        <span className="text-muted-foreground">Saldo total (com metas)</span>
        <span className="font-semibold tabular-nums">{formatCurrency(totalBalance)}</span>
      </div>
    </div>
  )
}
