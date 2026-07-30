import { requireAccount, getTransactions, getCards, getCardInvoicePayments } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { CardForm } from '@/components/card-form'
import { CardListItem } from '@/components/card-list-item'
import { openInvoicesByCard } from '@/lib/summary'
import { invoiceCompetencia } from '@/lib/format'

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

      {/* Igual ao padrão da tela de Metas: no celular empilha, no
          desktop o formulário fica fixo à esquerda e a lista à direita. */}
      <div className="flex flex-col gap-6 px-5 lg:grid lg:grid-cols-5 lg:items-start lg:gap-6 lg:px-8">
        <section className="lg:sticky lg:top-6 lg:col-span-2">
          <CardForm />
        </section>

        <section className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {cards.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Nenhum cartão cadastrado ainda.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {cards.map((c) => {
                  const invoices = openInvoices
                    .filter((inv) => inv.card.id === c.id)
                    .map((inv) => ({
                      ...inv,
                      // Quais transações compõem o valor dessa fatura —
                      // mesma regra de competência usada pra somar o total
                      // (ver openInvoicesByCard em lib/summary.ts).
                      transactions: transactions
                        .filter(
                          (t) =>
                            t.card_id === c.id &&
                            invoiceCompetencia(t.date, c.closing_day) === inv.competencia,
                        )
                        .sort((a, b) => b.date.localeCompare(a.date)),
                    }))
                  const totalOpen = invoices.reduce((acc, inv) => acc + inv.total, 0)

                  return (
                    <li key={c.id}>
                      <CardListItem card={c} invoices={invoices} totalOpen={totalOpen} />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
