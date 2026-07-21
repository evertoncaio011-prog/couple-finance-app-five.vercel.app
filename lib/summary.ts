import { currentMonthKey, invoiceCompetencia, monthKey } from '@/lib/format'
import type { Card, CardInvoice, CardInvoicePayment, TransactionWithMeta } from '@/lib/types'

export interface Totals {
  income: number
  expense: number
  net: number
}

export function computeTotals(txs: TransactionWithMeta[]): Totals {
  let income = 0
  let expense = 0
  for (const t of txs) {
    // Pagamentos de fatura (is_invoice_payment) ficam de fora daqui: a
    // compra original no cartão já foi contada como gasto no mês em que
    // ela aconteceu, então contar o pagamento de novo duplicaria o valor.
    if (t.is_invoice_payment) continue
    // 'neutral' ("Outros") é organizacional, mas por pedido do usuário ele
    // soma junto com as despesas do mês (não influencia o saldo real,
    // que é calculado à parte a partir das transações de income/expense).
    if (t.type === 'income') income += Number(t.amount)
    else if (t.type === 'expense' || t.type === 'neutral') expense += Number(t.amount)
  }
  return { income, expense, net: income - expense }
}

/**
 * Saldo real em conta: entradas de dinheiro menos apenas as saídas que de
 * fato saíram da conta. Compras no cartão de crédito (card_id preenchido)
 * NÃO entram aqui — elas só afetam o saldo quando a fatura é paga, e nesse
 * momento a própria transação de pagamento (com card_id nulo) já cobre o
 * valor. 'neutral' nunca afetou o saldo e continua de fora.
 */
export function computeAccountBalance(
  initialBalance: number,
  txs: TransactionWithMeta[],
): number {
  return (
    Number(initialBalance) +
    txs.reduce((acc, t) => {
      if (t.type === 'income') return acc + Number(t.amount)
      if (t.type === 'expense' && !t.card_id) return acc - Number(t.amount)
      return acc
    }, 0)
  )
}

export function currentMonthTotals(
  txs: TransactionWithMeta[],
  key = currentMonthKey(),
): Totals {
  return computeTotals(txs.filter((t) => monthKey(t.date) === key))
}

export interface CategorySlice {
  id: string
  name: string
  color: string
  value: number
}

export function expenseByCategory(
  txs: TransactionWithMeta[],
): CategorySlice[] {
  const map = new Map<string, CategorySlice>()
  for (const t of txs) {
    if (t.is_invoice_payment) continue
    // Despesas e "Outros" (neutral) contam juntos na visão por categoria.
    if (t.type !== 'expense' && t.type !== 'neutral') continue
    const id = t.category?.id ?? 'uncategorized'
    const existing = map.get(id)
    if (existing) {
      existing.value += Number(t.amount)
    } else {
      map.set(id, {
        id,
        name: t.category?.name ?? 'Sem categoria',
        color: t.category?.color ?? '#94a3b8',
        value: Number(t.amount),
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value)
}

export interface MonthPoint {
  key: string
  income: number
  expense: number
}

export function monthlySeries(
  txs: TransactionWithMeta[],
  months = 6,
): MonthPoint[] {
  const points: MonthPoint[] = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    points.push({ key, income: 0, expense: 0 })
  }
  const index = new Map(points.map((p) => [p.key, p]))
  for (const t of txs) {
    if (t.is_invoice_payment) continue
    const p = index.get(monthKey(t.date))
    if (!p) continue
    if (t.type === 'income') p.income += Number(t.amount)
    else if (t.type === 'expense' || t.type === 'neutral') p.expense += Number(t.amount)
  }
  return points
}

/**
 * Faturas em aberto (ainda não pagas) de cada cartão, agrupadas por
 * competência. Cada compra no cartão é agrupada pela competência que ela
 * ocupa (calculada a partir do dia de fechamento); competências que já
 * têm um registro em card_invoice_payments são excluídas.
 */
export function openInvoicesByCard(
  cards: Card[],
  txs: TransactionWithMeta[],
  payments: CardInvoicePayment[],
): CardInvoice[] {
  const paidKeys = new Set(payments.map((p) => `${p.card_id}:${p.competencia}`))
  const totals = new Map<string, number>()

  for (const t of txs) {
    if (!t.card_id) continue
    const card = cards.find((c) => c.id === t.card_id)
    if (!card) continue
    const competencia = invoiceCompetencia(t.date, card.closing_day)
    const key = `${card.id}:${competencia}`
    if (paidKeys.has(key)) continue
    totals.set(key, (totals.get(key) ?? 0) + Number(t.amount))
  }

  const result: CardInvoice[] = []
  for (const [key, total] of totals) {
    const [cardId, competencia] = key.split(':')
    const card = cards.find((c) => c.id === cardId)
    if (!card || total <= 0) continue
    result.push({ card, competencia, total, paid: false })
  }
  return result.sort((a, b) => a.competencia.localeCompare(b.competencia))
}
