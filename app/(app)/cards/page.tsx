import { requireAccount, getTransactions, getCards, getCardInvoicePayments } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { CardForm } from '@/components/card-form'
import { DeleteButton } from '@/components/delete-button'
import { PayInvoiceButton } from '@/components/pay-invoice-button'
import { deleteCard } from '@/app/actions'
import { openInvoicesByCard } from '@/lib/summary'
import { formatCurrency, monthLabel } from '@/lib/format'

export default async function CardsPage() {
  const { account } = await requireAccount()
  const [cards, transactions] = await Promise.all([
    getCards(account.id),
    getTransactions(account.id),
  ])
  const payments = await getCardInvoicePayments(cards.map((c) => c.id))

  const openInvoices = openInvoicesByCard(cards, transactions, payments)

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        title="Cartões"
        subtitle="Compras no crédito só saem do saldo quando você paga a fatura."
      />

      <section className="px-5">
        <CardForm />
      </section>

      <section className="px-1">
        <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
          {cards.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              Nenhum cartão cadastrado ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {cards.map((c, i) => {
                const invoices = openInvoices.filter((inv) => inv.card.id === c.id)
                const totalOpen = invoices.reduce((acc, inv) => acc + inv.total, 0)

                return (
                  <li
                    key={c.id}
                    className="flex flex-col gap-3 px-5 py-4 animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both"
                    style={{ animationDelay: `${i * 30}ms`, animationDuration: '300ms' }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="h-8 w-8 shrink-0 rounded-full"
                        style={{ backgroundColor: `${c.color}22`, border: `1px solid ${c.color}` }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          Fecha dia {c.closing_day} · Vence dia {c.due_day}
                          {Number(c.credit_limit) > 0 &&
                            ` · Limite ${formatCurrency(Number(c.credit_limit))}`}
                        </p>
                      </div>
                      <DeleteButton
                        onDelete={deleteCard.bind(null, c.id)}
                        label="Excluir cartão"
                        confirmMessage="Excluir este cartão? As compras já lançadas nele mantêm o valor, mas perdem o vínculo com o cartão."
                      />
                    </div>

                    {invoices.length === 0 ? (
                      <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                        Nenhuma fatura em aberto.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {totalOpen > invoices[0].total && (
                          <p className="text-xs font-medium text-muted-foreground">
                            Total em aberto: {formatCurrency(totalOpen)}
                          </p>
                        )}
                        {invoices.map((inv) => (
                          <div
                            key={inv.competencia}
                            className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2.5"
                          >
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Fatura de {monthLabel(inv.competencia)}
                              </p>
                              <p className="font-bold tabular-nums">
                                {formatCurrency(inv.total)}
                              </p>
                            </div>
                            <PayInvoiceButton
                              cardId={c.id}
                              competencia={inv.competencia}
                              total={inv.total}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
