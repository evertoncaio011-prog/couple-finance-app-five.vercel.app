import { requireAccount, getGoals } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { AddGoalSheet } from '@/components/add-goal-sheet'
import { GoalCard } from '@/components/goal-card'

export default async function GoalsPage() {
  const { account } = await requireAccount()
  const goals = await getGoals(account.id)

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader title="Metas" subtitle="Guardem juntos para o que importa." />

      {/* No celular o botão de adicionar fica em cima da lista. No
          desktop os dois ficam lado a lado: botão fixo à esquerda, metas
          em grid à direita, aproveitando a tela larga. */}
      <div className="flex flex-col gap-6 px-5 lg:grid lg:grid-cols-5 lg:items-start lg:gap-6 lg:px-8">
        <section className="lg:sticky lg:top-6 lg:col-span-2">
          <AddGoalSheet />
        </section>

        <section className="flex flex-col gap-3 lg:col-span-3">
          {goals.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
              Nenhuma meta criada ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3">
              {goals.map((goal, i) => (
                <div
                  key={goal.id}
                  className="animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both"
                  style={{ animationDelay: `${i * 30}ms`, animationDuration: '300ms' }}
                >
                  <GoalCard goal={goal} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
