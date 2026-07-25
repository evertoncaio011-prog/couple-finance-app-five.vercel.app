'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { GoalProgressBar } from '@/components/goal-progress-bar'
import { GoalSheet } from '@/components/goal-sheet'
import { formatCurrency } from '@/lib/format'
import type { Goal } from '@/lib/types'

export function GoalCard({ goal }: { goal: Goal }) {
  const [open, setOpen] = useState(false)

  const current = Number(goal.current_amount)
  const target = Number(goal.target_amount)
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0
  const remaining = Math.max(0, target - current)
  const isComplete = Boolean(goal.completed_at)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${goal.color}22`, border: `1px solid ${goal.color}` }}
          >
            {isComplete && <Check className="h-4 w-4" style={{ color: goal.color }} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{goal.name}</p>
            {goal.description && (
              <p className="truncate text-xs text-muted-foreground/80">{goal.description}</p>
            )}
            <p className="truncate text-xs text-muted-foreground">
              {formatCurrency(current)} de {formatCurrency(target)}
            </p>
          </div>
          <span className="shrink-0 text-sm font-bold tabular-nums">{percent.toFixed(0)}%</span>
        </div>

        <GoalProgressBar percent={percent} color={goal.color} />

        <p className="text-xs text-muted-foreground">
          {isComplete ? 'Meta concluída! 🎉' : `Falta ${formatCurrency(remaining)}`}
        </p>
      </button>

      <GoalSheet open={open} onOpenChange={setOpen} goal={goal} />
    </>
  )
}
