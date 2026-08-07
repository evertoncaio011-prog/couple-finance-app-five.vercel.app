import { currentMonthKey, invoiceCompetencia, monthKey } from '@/lib/format'
import type { Card, CardInvoice, CardInvoicePayment, Goal, TransactionWithMeta } from '@/lib/types'

export interface Totals {
  income: number
  expense: number
  net: number
}

export function computeTotals(txs: TransactionWithMeta[]): Totals {
  let income = 0
  let expense = 0
  for (const t of txs) {
    // Ignora lançamentos marcados para não afetar o saldo (hoje só
    // acontece com pagamento de fatura via "não descontar do saldo").
    if (t.affects_balance === false) continue
    // Compras no cartão de crédito (card_id preenchido) NÃO contam aqui:
    // o dinheiro só sai de fato da conta quando a fatura é paga. Nesse
    // momento a própria transação de pagamento (is_invoice_payment, sem
    // card_id) conta como saída, no mês em que o pagamento aconteceu —
    // e não no mês em que a compra foi feita. Isso evita tanto duplicar
    // o valor quanto "sumir" com ele quando compra e pagamento caem em
    // meses diferentes.
    if (t.card_id && !t.is_invoice_payment) continue
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
 *
 * affects_balance = false marca uma transação que não deve mexer no saldo
 * mesmo sendo do tipo 'expense' — hoje só acontece quando o pagamento de
 * fatura é feito escolhendo "não descontar do saldo" (dinheiro que não
 * passou pela conta compartilhada).
 */
export function computeAccountBalance(
  initialBalance: number,
  txs: TransactionWithMeta[],
): number {
  return (
    Number(initialBalance) +
    txs.reduce((acc, t) => {
      if (t.affects_balance === false) return acc
      if (t.type === 'income') return acc + Number(t.amount)
      if (t.type === 'expense' && !t.card_id) return acc - Number(t.amount)
      return acc
    }, 0)
  )
}

/**
 * Saldo disponível individual: só as receitas e despesas lançadas por
 * esse usuário específico, sem misturar com o que o outro membro do
 * casal lançou. Segue as mesmas regras do saldo da conta (compras no
 * cartão não descontam até a fatura ser paga, "Outros" nunca afeta,
 * `affects_balance: false` é ignorado) — só que sem saldo inicial, já
 * que esse valor pertence à conta como um todo, não a uma pessoa.
 *
 * `adjustment` é o ajuste manual dessa pessoa (ver "Conferir saldo" e
 * balance_adjustment em account_members) — soma direto, sem passar pelas
 * regras acima, porque representa uma correção já conferida à mão.
 */
function normalizeGoalContributions(contributions?: Record<string, number> | null): Record<string, number> {
  if (!contributions || typeof contributions !== 'object') return {}
  return Object.fromEntries(
    Object.entries(contributions).filter(([, amount]) => Number(amount) > 0),
  )
}

export function computeUserGoalReservation(goals: Goal[], userId: string): number {
  return goals.reduce((acc, goal) => {
    const reserved = Number(goal.current_amount ?? 0) - Number(goal.excluded_amount ?? 0)
    if (reserved <= 0) return acc

    const contributions = normalizeGoalContributions(goal.contributions)
    const totalContribution = Object.values(contributions).reduce(
      (sum, amount) => sum + Number(amount),
      0,
    )

    if (totalContribution > 0) {
      const userContribution = Number(contributions[userId] ?? 0)
      return acc + (userContribution / totalContribution) * reserved
    }

    // Para metas antigas sem histórico de contribuições, divide igualmente.
    return acc + reserved / 2
  }, 0)
}

export function computeUserBalance(
  txs: TransactionWithMeta[],
  userId: string,
  adjustment = 0,
  goals: Goal[] = [],
): number {
  const baseBalance =
    computeAccountBalance(
      0,
      txs.filter((t) => t.user_id === userId),
    ) + Number(adjustment)

  return baseBalance - computeUserGoalReservation(goals, userId)
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
    const id = t.category?.id ?? 'outros'
    const existing = map.get(id)
    if (existing) {
      existing.value += Number(t.amount)
    } else {
      map.set(id, {
        id,
        name: t.category?.name ?? 'Outros',
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
    // Mesma regra de computeTotals: compra no cartão não conta como saída
    // (só o pagamento da fatura conta, no mês em que foi de fato pago).
    if (t.affects_balance === false) continue
    if (t.card_id && !t.is_invoice_payment) continue
    const p = index.get(monthKey(t.date))
    if (!p) continue
    if (t.type === 'income') p.income += Number(t.amount)
    else if (t.type === 'expense' || t.type === 'neutral') p.expense += Number(t.amount)
  }
  return points
}

/**
 * Faturas em aberto (ainda não pagas, total ou parcialmente) de cada
 * cartão, agrupadas por competência. Cada compra no cartão é agrupada
 * pela competência que ela ocupa (calculada a partir do dia de
 * fechamento).
 *
 * O valor em aberto de cada fatura é sempre `total das compras dessa
 * competência − soma já paga (card_invoice_payments.amount)`. Isso
 * cobre os três casos:
 * - Nunca paga: nada em card_invoice_payments, valor em aberto = total.
 * - Paga parcialmente (adiantamento): valor em aberto = total − o que já
 *   foi adiantado, e continua aparecendo aqui até zerar.
 * - Paga integralmente: valor em aberto chega a 0 (ou menos) e some da
 *   lista. Novas compras na mesma competência depois disso voltam a
 *   aumentar o total e reabrem a fatura automaticamente.
 */
export function openInvoicesByCard(
  cards: Card[],
  txs: TransactionWithMeta[],
  payments: CardInvoicePayment[],
): CardInvoice[] {
  const paidAmount = new Map<string, number>()
  for (const p of payments) {
    paidAmount.set(`${p.card_id}:${p.competencia}`, Number(p.amount))
  }

  const totals = new Map<string, number>()
  for (const t of txs) {
    if (!t.card_id) continue
    const card = cards.find((c) => c.id === t.card_id)
    if (!card) continue
    const competencia = invoiceCompetencia(t.date, card.closing_day)
    const key = `${card.id}:${competencia}`
    totals.set(key, (totals.get(key) ?? 0) + Number(t.amount))
  }

  const result: CardInvoice[] = []
  for (const [key, invoiceTotal] of totals) {
    const [cardId, competencia] = key.split(':')
    const card = cards.find((c) => c.id === cardId)
    if (!card) continue
    const paidSoFar = paidAmount.get(key) ?? 0
    const total = invoiceTotal - paidSoFar
    if (total <= 0) continue
    result.push({ card, competencia, total, invoiceTotal, paidSoFar, paid: false })
  }
  return result.sort((a, b) => a.competencia.localeCompare(b.competencia))
}

/**
 * Quanto do saldo em conta já está "reservado" nas metas — a soma de
 * current_amount de todas as metas (concluídas ou não). É dinheiro que
 * já está guardado na conta, mas com destino certo, então não deve
 * contar como "saldo disponível" pra gastar.
 */
export function sumGoalsReserved(goals: Goal[]): number {
  return goals.reduce(
    (acc, g) => acc + Math.max(0, Number(g.current_amount) - Number(g.excluded_amount ?? 0)),
    0,
  )
}

/**
 * Soma do que foi guardado nas metas sem descontar do saldo (dinheiro que
 * nunca passou pela conta compartilhada — ver `affectsBalance` em
 * addGoalAmount/setGoalContribution). Esse valor não está refletido em
 * computeAccountBalance (não veio de nenhuma transação), então precisa ser
 * somado à parte para o "Saldo total (com metas)" refletir o total real
 * guardado pelo casal, dentro e fora da conta.
 */
export function sumGoalsExternal(goals: Goal[]): number {
  return goals.reduce((acc, g) => acc + Math.max(0, Number(g.excluded_amount ?? 0)), 0)
}
