'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { addTransaction, updateTransaction } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { todayISO } from '@/lib/format'
import type { Card, Category, TransactionWithMeta, TxType } from '@/lib/types'

const selectClass =
  'h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  )
}

interface TransactionFormProps {
  categories: Category[]
  cards?: Card[]
  mode?: 'create' | 'edit'
  transaction?: TransactionWithMeta
  onSuccess?: () => void
  initialDate?: string
}

export function TransactionForm({
  categories,
  cards = [],
  mode = 'create',
  transaction,
  onSuccess,
  initialDate,
}: TransactionFormProps) {
  const isEdit = mode === 'edit' && !!transaction
  // Transação gerada automaticamente pelo pagamento de uma fatura: tipo e
  // forma de pagamento não podem mudar (ver computeAccountBalance e
  // openInvoicesByCard em lib/summary.ts, que dependem desses campos
  // permanecerem exatamente como pay_card_invoice() os criou).
  const isLockedInvoicePayment = isEdit && !!transaction?.is_invoice_payment

  const action = isEdit ? updateTransaction.bind(null, transaction!.id) : addTransaction

  const [state, formAction] = useActionState(action, {})
  const [type, setType] = useState<TxType>(transaction?.type ?? 'expense')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>(
    transaction?.card_id ? 'credit' : 'cash',
  )
  const [cardId, setCardId] = useState(transaction?.card_id ?? cards[0]?.id ?? '')

  useEffect(() => {
    if (isEdit && state.success) {
      onSuccess?.()
    }
  }, [state.success, isEdit, onSuccess])

  const availableCategories = useMemo(() => {
    // "Outros" é neutro e organizacional: qualquer categoria pode ser usada
    // apenas como rótulo visual, e nenhuma é obrigatória.
    if (type === 'neutral') return categories ?? []
    return (categories ?? []).filter((c) => c.type === type || c.type === 'both')
  }, [categories, type])

  return (
    <form action={formAction} className="flex flex-col gap-5 px-5">
      <input type="hidden" name="type" value={type} readOnly />
      <input type="hidden" name="payment_method" value={paymentMethod} readOnly />
      <input type="hidden" name="card_id" value={paymentMethod === 'credit' ? cardId : ''} readOnly />

      {isLockedInvoicePayment ? (
        <div className="rounded-2xl bg-muted p-3 text-center text-sm font-semibold text-muted-foreground">
          Despesa (pagamento de fatura)
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={cn(
              'rounded-xl py-2.5 text-sm font-semibold transition-colors',
              type === 'expense' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={cn(
              'rounded-xl py-2.5 text-sm font-semibold transition-colors',
              type === 'income' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            Receita
          </button>
          <button
            type="button"
            onClick={() => setType('neutral')}
            className={cn(
              'rounded-xl py-2.5 text-sm font-semibold transition-colors',
              type === 'neutral' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            Outros
          </button>
        </div>
      )}

      {type === 'neutral' && (
        <>
          <p className="-mt-2 text-xs text-muted-foreground">
            Use "Outros" para organizar lançamentos que não entram no seu saldo
            nem nos totais de receita e despesa — por exemplo, um lembrete de
            conta paga fora do app, como o aluguel.
          </p>

          {isEdit && (
            <p className="-mt-2 text-xs text-amber-600 dark:text-amber-400">
              Aviso: ao editar este item, a alteração não interfere no valor da
              receita; ela afeta apenas os gastos.
            </p>
          )}
        </>
      )}

      {isLockedInvoicePayment && (
        <p className="-mt-2 text-xs text-amber-600 dark:text-amber-400">
          Esta transação é o pagamento de uma fatura de cartão, gerado
          automaticamente. Tipo e forma de pagamento não podem ser alterados
          aqui. Editar o valor não atualiza a fatura original.
        </p>
      )}

      {!isLockedInvoicePayment && type !== 'income' && (
        <div className="grid gap-2">
          <Label>Forma de pagamento</Label>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={cn(
                'rounded-xl py-2 text-sm font-semibold transition-colors',
                paymentMethod === 'cash' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              À vista
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('credit')}
              disabled={cards.length === 0}
              className={cn(
                'rounded-xl py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                paymentMethod === 'credit' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              Cartão de crédito
            </button>
          </div>

          {paymentMethod === 'cash' && (
            <p className="text-xs text-muted-foreground">
              Dinheiro, débito ou Pix — afeta o saldo em conta agora.
            </p>
          )}

          {paymentMethod === 'credit' && cards.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Cadastre um cartão em "Cartões" para lançar compras no crédito.
            </p>
          )}

          {paymentMethod === 'credit' && cards.length > 0 && (
            <>
              <select
                aria-label="Cartão"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                className={selectClass}
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Não afeta o saldo agora — entra na fatura do cartão, que só
                sai da conta quando você pagá-la.
              </p>
            </>
          )}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="amount">Valor</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0,00"
          required
          autoFocus={!isEdit}
          defaultValue={transaction ? Number(transaction.amount) : undefined}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="category_id">
          Categoria{type === 'neutral' && ' (opcional)'}
        </Label>
        <select
          id="category_id"
          name="category_id"
          required={type !== 'neutral'}
          defaultValue={transaction?.category_id ?? ''}
          className={selectClass}
        >
          <option value="" disabled={type !== 'neutral'}>
            {type === 'neutral' ? 'Sem categoria' : 'Escolha uma categoria'}
          </option>
          {availableCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          name="description"
          placeholder="ex: Compras no mercado"
          defaultValue={transaction?.description ?? ''}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="date">Data</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={transaction?.date ?? initialDate ?? todayISO()}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="note">Observação (opcional)</Label>
        <Input
          id="note"
          name="note"
          placeholder="Algo mais para lembrar"
          defaultValue={transaction?.note ?? ''}
        />
      </div>

      {state.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}

      <SubmitButton
        label={isEdit ? 'Salvar alterações' : 'Salvar transação'}
        pendingLabel="Salvando…"
      />
    </form>
  )
}