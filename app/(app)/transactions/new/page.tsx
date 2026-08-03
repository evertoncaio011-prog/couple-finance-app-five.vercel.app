import { requireAccount, getCategories, getCards, getTransactions, getBalanceAdjustment } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { TransactionForm } from '@/components/transaction-form'
import { todayISO } from '@/lib/format'
import { computeUserBalance } from '@/lib/summary'

export default async function NewTransactionPage() {
  const { account, user } = await requireAccount()
  const [categories, cards, transactions, adjustment] = await Promise.all([
    getCategories(account.id),
    getCards(account.id),
    getTransactions(account.id),
    getBalanceAdjustment(account.id, user.id),
  ])
  const userBalance = computeUserBalance(transactions, user.id, adjustment)

  return (
    <div className="flex flex-col gap-4 pb-10">
      <PageHeader
        title="Nova transação"
        subtitle="Registre uma receita ou despesa compartilhada."
      />
      <TransactionForm
        categories={categories}
        cards={cards}
        initialDate={todayISO()}
        userBalance={userBalance}
      />
    </div>
  )
}
