'use client'

import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Target,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'

export function BalanceCard({
  totalBalance,
  availableBalance,
  goalsReserved,
  goalsProgressPercent,
  hasGoals,
  monthIncome,
  monthExpense,
  accountName,
}: {
  totalBalance: number
  availableBalance: number
  goalsReserved: number
  goalsProgressPercent: number
  hasGoals: boolean
  monthIncome: number
  monthExpense: number
  accountName: string
}) {
  const [hidden, setHidden] = useState(false)
  const net = monthIncome - monthExpense
  const isHealthy = net >= 0

  const mask = (value: number) => (hidden ? '••••••' : formatCurrency(value))

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {accountName} · saldo disponível
          </p>
          <button
            type="button"
            onClick={() => setHidden((v) => !v)}
            aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>

        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isHealthy ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-600'
          }`}
        >
          {isHealthy ? (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          )}
          {isHealthy ? 'Saudável' : 'Mês no vermelho'}
        </span>
      </div>

      <p className="mt-3 break-words font-heading text-4xl font-extrabold tracking-tight tabular-nums">
        {mask(availableBalance)}
      </p>

      {hasGoals && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Target className="h-3.5 w-3.5" aria-hidden />
              Nas metas
            </span>
            <span className="font-bold tabular-nums">{goalsProgressPercent.toFixed(0)}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${goalsProgressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 divide-x divide-border border-t border-border pt-4">
        <div className="pr-4">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            Entradas
          </p>
          <p className="mt-1 break-words text-lg font-bold tabular-nums">
            {mask(monthIncome)}
          </p>
        </div>
        <div className="pl-4">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" aria-hidden />
            Saídas
          </p>
          <p className="mt-1 break-words text-lg font-bold tabular-nums">
            {mask(monthExpense)}
          </p>
        </div>
      </div>

      {goalsReserved > 0 && (
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs">
          <span className="text-muted-foreground">Reservado em metas</span>
          <span className="font-semibold tabular-nums">{mask(goalsReserved)}</span>
        </div>
      )}

      <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
        <span className="text-muted-foreground">Saldo total (com metas)</span>
        <span className="font-semibold tabular-nums">{mask(totalBalance)}</span>
      </div>
    </div>
  )
}
