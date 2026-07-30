'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ChevronRight } from 'lucide-react'
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
  currentMonthLabel,
}: {
  totalBalance: number
  availableBalance: number
  goalsReserved: number
  goalsProgressPercent: number
  hasGoals: boolean
  monthIncome: number
  monthExpense: number
  accountName: string
  currentMonthLabel: string
}) {
  const [hidden, setHidden] = useState(false)
  const mask = (value: number) => (hidden ? '••••••' : formatCurrency(value))

  // Sem metas ainda: mostra saída do mês sobre o saldo total como
  // referência de "quanto já foi usado", igual ao espírito do card de
  // referência (gasto vs. orçamento). Com metas, prioriza o progresso
  // delas, que é a informação mais relevante nesse card.
  const barPercent = hasGoals
    ? goalsProgressPercent
    : totalBalance > 0
      ? Math.min(100, (monthExpense / totalBalance) * 100)
      : 0
  const barLabel = hasGoals ? 'Nas metas' : 'Gasto do mês'

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-3xl bg-[#101014] p-6 text-white shadow-lg shadow-black/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-white/50">
              {accountName} · saldo disponível
            </p>
            <button
              type="button"
              onClick={() => setHidden((v) => !v)}
              aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'}
              className="text-white/50 transition-colors hover:text-white"
            >
              {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          <span className="shrink-0 text-xs font-medium text-white/50">
            {currentMonthLabel}
          </span>
        </div>

        <p className="mt-3 break-words font-heading text-4xl font-extrabold tracking-tight tabular-nums">
          {mask(availableBalance)}
        </p>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${barPercent}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs text-white/50">
          <span>{barLabel}</span>
          <span className="font-semibold text-white/80">{barPercent.toFixed(0)}%</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="text-xs text-white/50">Entradas (mês)</p>
            <p className="mt-1 break-words text-base font-bold tabular-nums text-emerald-400">
              {mask(monthIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/50">Saídas (mês)</p>
            <p className="mt-1 break-words text-base font-bold tabular-nums text-rose-400">
              {mask(monthExpense)}
            </p>
          </div>
        </div>

        {goalsReserved > 0 && (
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-white/10 pt-4 text-xs">
            <span className="text-white/50">Reservado em metas</span>
            <span className="font-semibold tabular-nums">{mask(goalsReserved)}</span>
          </div>
        )}

        <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
          <span className="text-white/50">Saldo total (com metas)</span>
          <span className="font-semibold tabular-nums">{mask(totalBalance)}</span>
        </div>
      </div>

      {/* Pílula flutuante espiando embaixo do card, igual à referência. */}
      <Link
        href="/transactions"
        className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold shadow-sm transition-shadow hover:shadow-md"
      >
        Ver detalhes
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  )
}
