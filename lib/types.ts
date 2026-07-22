// 1. Definições de Tipos Base
export type TxType = 'expense' | 'income' | 'neutral';
export type CategoryType = 'income' | 'expense' | 'both';

// 2. Interfaces do Sistema
export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  /** @deprecated substituído por account_members + active_account_id */
  shared_account_id: string | null
  active_account_id: string | null
  created_at: string
}

export interface SharedAccount {
  id: string
  name: string
  initial_balance: number
  created_by: string | null
  created_at: string
}

/** Um orçamento do qual o usuário logado é membro, retornado por get_my_accounts(). */
export interface MyAccount {
  id: string
  name: string
  initial_balance: number
  created_by: string | null
  created_at: string
  is_active: boolean
}

export interface Category {
  id: string
  account_id: string
  name: string
  type: CategoryType
  color: string
  is_default: boolean
  created_at: string
}

export interface Transaction {
  id: string
  account_id: string
  user_id: string | null
  type: TxType // Agora aceita 'neutral'
  amount: number
  category_id: string | null
  description: string | null
  note: string | null
  date: string
  created_at: string
  /** Se preenchido, esta é uma compra no cartão de crédito — não afeta o
   * saldo em conta, só compõe o total da fatura até ela ser paga. */
  card_id: string | null
  /** Marca a transação de saída gerada automaticamente ao pagar uma
   * fatura. Por padrão afeta o saldo, mas é excluída dos totais de gasto
   * por categoria (que já contam as compras originais do cartão). */
  is_invoice_payment: boolean
  /** Se false, esta transação NÃO desconta do saldo em conta (ver
   * computeAccountBalance em lib/summary.ts). Usado principalmente no
   * pagamento de fatura, quando o usuário escolhe pagar "por fora"
   * (ex.: dinheiro que não passa pela conta compartilhada) e só quer
   * marcar a fatura como paga, sem mexer no saldo. Todas as outras
   * transações usam o padrão (true). */
  affects_balance: boolean
}

export interface TransactionWithMeta extends Transaction {
  category: Pick<Category, 'id' | 'name' | 'color' | 'type'> | null
  author: Pick<Profile, 'id' | 'display_name'> | null
  card: Pick<Card, 'id' | 'name' | 'color'> | null
}

export interface Card {
  id: string
  account_id: string
  name: string
  credit_limit: number
  /** Dia do mês (1-28) em que a fatura fecha. */
  closing_day: number
  /** Dia do mês (1-28) em que a fatura vence. */
  due_day: number
  color: string
  created_at: string
}

/** Uma linha em card_invoice_payments — registra quanto já foi pago da
 * fatura de um cartão numa competência ('YYYY-MM'). `amount` é o total
 * acumulado já pago (pode ser menor que o valor da fatura em caso de
 * pagamento parcial/adiantamento). */
export interface CardInvoicePayment {
  id: string
  card_id: string
  competencia: string
  amount: number
  paid_at: string
  payment_transaction_id: string | null
  created_at: string
}

/** Fatura (paga ou em aberto) de um cartão para uma competência,
 * calculada no app a partir das transações + card_invoice_payments. */
export interface CardInvoice {
  card: Card
  competencia: string
  /** Valor ainda em aberto (o que falta pagar): invoiceTotal - paidSoFar. */
  total: number
  /** Valor total de todas as compras dessa competência, sem descontar
   * nenhum pagamento/adiantamento já feito. */
  invoiceTotal: number
  /** Quanto já foi pago/adiantado dessa fatura até agora. */
  paidSoFar: number
  paid: boolean
}