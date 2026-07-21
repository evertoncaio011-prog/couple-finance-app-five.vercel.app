import { requireAccount, getCategories, getCards } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { TransactionForm } from '@/components/transaction-form'
import { todayISO } from '@/lib/format'

export default async function NewTransactionPage() {
  const { account } = await requireAccount()
  const [categories, cards] = await Promise.all([
    getCategories(account.id),
    getCards(account.id),
  ])

  return (
    <div className="flex flex-col gap-4 pb-10">
      <PageHeader
        title="Nova transação"
        subtitle="Registre uma receita ou despesa compartilhada."
      />
      <TransactionForm categories={categories} cards={cards} initialDate={todayISO()} />
    </div>
  )
}
