import Link from 'next/link'
import { ChevronRight, Sparkles, TrendingUp, PieChart } from 'lucide-react'
import {
  requireAccount,
  getTransactions,
  getCategories,
  getMyAccounts,
  getCards,
  getCardInvoicePayments,
  getGoals,
} from '@/lib/data'
import { AccountSwitcher } from '@/components/account-switcher'
import { BalanceCard } from '@/components/balance-card'
import { DashboardShortcuts } from '@/components/dashboard-shortcuts'
import { InvoicesCard } from '@/components/invoices-card'
import { IncomeExpenseChart, CategoryDonut } from '@/components/spending-charts'
import { TransactionRow } from '@/components/transaction-row'
import {
  computeAccountBalance,
  currentMonthTotals,
  expenseByCategory,
  monthlySeries,
  openInvoicesByCard,
  sumGoalsReserved,
} from '@/lib/summary'
import { currentMonthKey, formatCurrency, monthKey } from '@/lib/format'

export default async function DashboardPage() {
  const { account, profile } = await requireAccount()
  const [transactions, categories, myAccounts, cards, goals] = await Promise.all([
    getTransactions(account.id),
    getCategories(account.id),
    getMyAccounts(),
    getCards(account.id),
    getGoals(account.id),
  ])
  const invoicePayments = await getCardInvoicePayments(cards.map((c) => c.id))

  // Saldo em conta real: compras no cartão de crédito não entram aqui até
  // a fatura ser paga (ver computeAccountBalance em lib/summary.ts).
  const totalBalance = computeAccountBalance(account.initial_balance, transactions)
  const goalsReserved = sumGoalsReserved(goals)
  // Saldo disponível = o que sobra pra gastar livremente, descontando o
  // que já está guardado dentro das metas. Nunca mostra negativo aqui
  // (se as metas passarem do saldo total, o "disponível" só zera).
  const availableBalance = Math.max(0, totalBalance - goalsReserved)
  const openInvoices = openInvoicesByCard(cards, transactions, invoicePayments)
  const totalOpenInvoices = openInvoices.reduce((acc, inv) => acc + inv.total, 0)

  const { income: monthIncome, expense: monthExpense } = currentMonthTotals(transactions)
  const series = monthlySeries(transactions, 6)
  const categorySlices = expenseByCategory(
    transactions.filter((t) => monthKey(t.date) === currentMonthKey()),
  )
  const recent = transactions.slice(0, 3)
  const firstName = profile.display_name?.trim().split(' ')[0] || 'você'

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="flex items-start justify-between gap-3 py-1 pr-5 pl-16 pt-6 lg:pl-5">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight lg:text-3xl">
            Olá, {firstName}!
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Acompanhem juntos as finanças de {account.name}.
          </p>
        </div>
        {myAccounts.length > 1 && (
          <div className="shrink-0 pt-1">
            <AccountSwitcher accounts={myAccounts} />
          </div>
        )}
      </header>

      <BalanceCard
        accountName={account.name}
        totalBalance={totalBalance}
        availableBalance={availableBalance}
        goalsReserved={goalsReserved}
        monthIncome={monthIncome}
        monthExpense={monthExpense}
      />

      {cards.length > 0 && (
        <InvoicesCard total={totalOpenInvoices} invoices={openInvoices} />
      )}

      <DashboardShortcuts />

      <section className="mx-5 rounded-3xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-1.5 font-heading text-base font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
          Últimos 6 meses
        </h2>
        <div className="mt-4">
          <IncomeExpenseChart data={series} />
        </div>
      </section>

      <section className="mx-5 rounded-3xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-1.5 font-heading text-base font-semibold">
          <PieChart className="h-4 w-4 text-primary" aria-hidden />
          Este mês por categoria
        </h2>
        {categorySlices.length === 0 ? (
          <p className="mt-6 py-6 text-center text-sm text-muted-foreground">
            Nenhum gasto registrado este mês ainda.
          </p>
        ) : (
          <>
            <div className="mt-2">
              <CategoryDonut data={categorySlices} />
            </div>
            <ul className="mt-4 space-y-2">
              {categorySlices.map((slice) => (
                <li key={slice.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    {slice.name}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(slice.value)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="mx-5 overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="flex items-center gap-1.5 font-heading text-base font-semibold">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            Atividade recente
          </h2>
          <Link
            href="/transactions"
            className="flex items-center gap-0.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
          >
            Ver tudo
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhuma transação registrada ainda.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-border">
            {recent.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} categories={categories} cards={cards} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
