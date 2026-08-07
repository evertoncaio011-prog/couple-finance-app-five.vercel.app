import Link from 'next/link'
import { ChevronRight, Target } from 'lucide-react'
import { GoalProgressBar } from '@/components/goal-progress-bar'
import { formatCurrency } from '@/lib/format'
import type { Goal } from '@/lib/types'

/**
 * Mostra as metas que têm dinheiro guardado, direto no dashboard — sempre,
 * independente do mês atual. As metas não têm "mês de referência": o
 * dinheiro fica reservado nelas até ser resgatado, então continuam
 * aparecendo aqui enquanto tiverem saldo guardado (current_amount > 0),
 * mesmo que a última contribuição tenha sido há vários meses.
 */
export function GoalsCard({ goals }: { goals: Goal[] }) {
  const withMoney = goals
    .filter((g) => Number(g.current_amount) > 0)
    .sort((a, b) => Number(b.current_amount) - Number(a.current_amount))

  if (withMoney.length === 0) return null

  return (
    <Link
      href="/goals"
      className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Target className="h-4 w-4" aria-hidden />
          <span className="text-sm font-medium">Metas</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/60" aria-hidden />
      </div>

      <ul className="flex flex-col gap-3">
        {withMoney.map((goal) => {
          const current = Number(goal.current_amount)
          const target = Number(goal.target_amount)
          const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0
          const isComplete = Boolean(goal.completed_at)

          return (
            <li key={goal.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate font-medium">{goal.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatCurrency(current)} de {formatCurrency(target)}
                </span>
              </div>
              <GoalProgressBar percent={percent} color={goal.color} />
              {isComplete && (
                <span className="text-xs font-medium text-primary">Meta concluída! 🎉</span>
              )}
            </li>
          )
        })}
      </ul>
    </Link>
  )
}
