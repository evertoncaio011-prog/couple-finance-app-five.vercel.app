import { requireAccount, getGoals } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { GoalForm } from '@/components/goal-form'
import { GoalCard } from '@/components/goal-card'

export default async function GoalsPage() {
  const { account } = await requireAccount()
  const goals = await getGoals(account.id)

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader title="Metas" subtitle="Guardem juntos para o que importa." />

      <section className="px-5">
        <GoalForm />
      </section>

      <section className="flex flex-col gap-3 px-5">
        {goals.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhuma meta criada ainda.
          </p>
        ) : (
          goals.map((goal, i) => (
            <div
              key={goal.id}
              className="animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both"
              style={{ animationDelay: `${i * 30}ms`, animationDuration: '300ms' }}
            >
              <GoalCard goal={goal} />
            </div>
          ))
        )}
      </section>
    </div>
  )
}
