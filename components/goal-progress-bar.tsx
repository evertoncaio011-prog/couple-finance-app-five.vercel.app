import { cn } from '@/lib/utils'

export function GoalProgressBar({
  percent,
  color,
  className,
}: {
  /** 0-100, já calculado e limitado pelo chamador. */
  percent: number
  color: string
  className?: string
}) {
  return (
    <div
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  )
}
