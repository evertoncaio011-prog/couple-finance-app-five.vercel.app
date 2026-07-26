import { ArrowDownRight, ArrowUpRight, Target } from 'lucide-react'
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
  return (
    <div className="mx-5 rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/20 transition-shadow hover:shadow-xl hover:shadow-primary/25">
      <p className="text-sm font-medium text-primary-foreground/80">
        {accountName} · Saldo disponível
      </p>
      <p className="mt-1 font-heading text-4xl font-extrabold tracking-tight tabular-nums">
        {formatCurrency(availableBalance)}
      </p>

      {goalsReserved > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary-foreground/10 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-primary-foreground/80">
            <Target className="h-4 w-4" aria-hidden />
            <span className="text-xs font-medium">Reservado em metas</span>
          </div>
          <span className="text-sm font-bold tabular-nums">
            {formatCurrency(goalsReserved)}
          </span>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between px-3 py-1 text-xs text-primary-foreground/70">
        <span>Saldo total (com metas)</span>
        <span className="font-semibold tabular-nums">{formatCurrency(totalBalance)}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-primary-foreground/10 p-3 transition-colors hover:bg-primary-foreground/15">
          <div className="flex items-center gap-1.5 text-primary-foreground/80">
            <ArrowUpRight className="h-4 w-4" aria-hidden />
            <span className="text-xs font-medium">Receita (mês)</span>
          </div>
          <p className="mt-1 text-lg font-bold tabular-nums">
            {formatCurrency(monthIncome)}
          </p>
        </div>
        <div className="rounded-2xl bg-primary-foreground/10 p-3 transition-colors hover:bg-primary-foreground/15">
          <div className="flex items-center gap-1.5 text-primary-foreground/80">
            <ArrowDownRight className="h-4 w-4" aria-hidden />
            <span className="text-xs font-medium">Gasto (mês)</span>
          </div>
          <p className="mt-1 text-lg font-bold tabular-nums">
            {formatCurrency(monthExpense)}
          </p>
        </div>
      </div>
    </div>
  )
}
