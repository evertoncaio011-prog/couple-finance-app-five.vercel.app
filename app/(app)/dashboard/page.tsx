import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import {
  requireAccount,
  getTransactions,
  getCategories,
  getMyAccounts,
  getCards,
  getCardInvoicePayments,
} from '@/lib/data'
import { BrandMark } from '@/components/brand-mark'
import { AccountSwitcher } from '@/components/account-switcher'
import { BalanceCard } from '@/components/balance-card'
import { InvoicesCard } from '@/components/invoices-card'
import { IncomeExpenseChart, CategoryDonut } from '@/components/spending-charts'
import { TransactionRow } from '@/components/transaction-row'
import {
  computeAccountBalance,
  currentMonthTotals,
  expenseByCategory,
  monthlySeries,
  openInvoicesByCard,
} from '@/lib/summary'
import { currentMonthKey, formatCurrency, monthKey } from '@/lib/format'

export default async function DashboardPage() {
  const { account } = await requireAccount()
  const [transactions, categories, myAccounts, cards] = await Promise.all([
    getTransactions(account.id),
    getCategories(account.id),
    getMyAccounts(),
    getCards(account.id),
  ])
  const invoicePayments = await getCardInvoicePayments(cards.map((c) => c.id))

  // Saldo em conta real: compras no cartão de crédito não entram aqui até
  // a fatura ser paga (ver computeAccountBalance em lib/summary.ts).
  const balance = computeAccountBalance(account.initial_balance, transactions)
  const openInvoices = openInvoicesByCard(cards, transactions, invoicePayments)
  const totalOpenInvoices = openInvoices.reduce((acc, inv) => acc + inv.total, 0)

  const { income: monthIncome, expense: monthExpense } = currentMonthTotals(transactions)
  const series = monthlySeries(transactions, 6)
  const categorySlices = expenseByCategory(
    transactions.filter((t) => monthKey(t.date) === currentMonthKey()),
  )
  const recent = transactions.slice(0, 3)

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="flex items-center justify-between py-1 pr-5 pl-16 pt-6 lg:pl-5">
        <BrandMark showIcon={false} />
        {myAccounts.length > 1 && <AccountSwitcher accounts={myAccounts} />}
      </header>

      <BalanceCard
        accountName={account.name}
        balance={balance}
        monthIncome={monthIncome}
        monthExpense={monthExpense}
      />

      {cards.length > 0 && (
        <InvoicesCard total={totalOpenInvoices} invoices={openInvoices} />
      )}

      <section className="mx-5 rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Últimos 6 meses</h2>
        <div className="mt-4">
          <IncomeExpenseChart data={series} />
        </div>
      </section>

      <section className="mx-5 rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Este mês por categoria</h2>
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

      <section>
        <div className="flex items-center justify-between px-5">
          <h2 className="font-heading text-base font-semibold">Atividade recente</h2>
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
