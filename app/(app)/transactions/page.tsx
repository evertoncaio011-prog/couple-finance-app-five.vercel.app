import { requireAccount, getTransactions, getCategories, getCards } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { TransactionRow } from '@/components/transaction-row'
import { TransactionFilters } from '@/components/transaction-filters'
import { deleteTransaction } from '@/app/actions'
import { monthKey, monthLabel } from '@/lib/format'
import type { TransactionWithMeta } from '@/lib/types'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; category?: string; type?: string }>
}) {
  const { account } = await requireAccount()
  const [txs, categories, cards] = await Promise.all([
    getTransactions(account.id),
    getCategories(account.id),
    getCards(account.id),
  ])

  const params = await searchParams
  const month = params.month ?? ''
  const categoryId = params.category ?? ''
  const type = params.type ?? ''

  const months = Array.from(new Set(txs.map((t) => monthKey(t.date))))
    .sort()
    .reverse()

  const filtered = txs.filter((t) => {
    if (month && monthKey(t.date) !== month) return false
    if (categoryId && t.category_id !== categoryId) return false
    if (type && t.type !== type) return false
    return true
  })

  const groups = new Map<string, TransactionWithMeta[]>()
  for (const t of filtered) {
    const key = monthKey(t.date)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(t)
  }

  return (
    <div className="flex flex-col gap-4 pb-10">
      <PageHeader
        title="Transações"
        subtitle={`${filtered.length} de ${txs.length} lançamentos`}
      />

      <div className="px-5">
        <TransactionFilters months={months} categories={categories} />
      </div>

      {filtered.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground animate-in fade-in-0 duration-300">
          Nenhuma transação corresponde a esses filtros.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {Array.from(groups.entries()).map(([key, items], groupIndex) => (
            <section
              key={key}
              className="px-1 animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both"
              style={{ animationDelay: `${groupIndex * 60}ms`, animationDuration: '350ms' }}
            >
              <h2 className="px-5 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {monthLabel(key)}
              </h2>
              <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
                <ul className="divide-y divide-border">
                  {items.map((tx) => (
                    <li key={tx.id}>
                      <TransactionRow
                        tx={tx}
                        categories={categories}
                        cards={cards}
                        onDelete={deleteTransaction.bind(null, tx.id)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
