'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { Calendar, Tag, User, FileText, Pencil, Trash2, Hash, CreditCard, Ban } from 'lucide-react'

import { formatCurrency, formatDateShort } from '@/lib/format'
import type { Card, Category, TransactionWithMeta } from '@/lib/types'
import { TransactionForm } from '@/components/transaction-form'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void

  transaction: TransactionWithMeta
  categories: Category[]
  cards?: Card[]

  /** Deletes this transaction. Rendered/confirmed entirely inside the Sheet. */
  onDelete?: () => Promise<{ error?: string; success?: boolean }>
}

export function TransactionSheet({
  open,
  onOpenChange,
  transaction,
  categories,
  cards = [],
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [deleting, startDelete] = useTransition()

  // Always land back on the details view next time the Sheet opens —
  // never resume mid-edit for a different (or the same) transaction.
  useEffect(() => {
    if (!open) setEditing(false)
  }, [open])

  const isIncome = transaction.type === 'income'
  const isNeutral = transaction.type === 'neutral'
  const typeLabel = isIncome ? 'Receita' : isNeutral ? 'Outros' : 'Despesa'
  // "Outros" soma junto com os gastos do mês, então usa o mesmo sinal/cor
  // de despesa aqui — só o rótulo acima muda para deixar claro o que é.
  const amountSign = isIncome ? '+' : '-'
  const amountColor = isIncome ? 'text-emerald-600' : 'text-rose-600'

  function handleDelete() {
    if (!onDelete) return
    if (!window.confirm('Excluir esta transação? Essa ação não pode ser desfeita.')) return
    startDelete(async () => {
      const res = await onDelete()
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Transação excluída')
      onOpenChange(false)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
        {editing ? (
          <>
            <SheetHeader className="space-y-1 text-center">
              <SheetDescription>Editar transação</SheetDescription>
              <SheetTitle className="text-2xl font-bold">
                {typeLabel}
              </SheetTitle>
            </SheetHeader>

            <TransactionForm
              mode="edit"
              transaction={transaction}
              categories={categories}
              cards={cards}
              onSuccess={() => setEditing(false)}
            />

            <div className="px-5 pb-6">
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="space-y-2 text-center">
              <SheetDescription>{typeLabel}</SheetDescription>
              <SheetTitle className={`text-4xl font-bold ${amountColor}`}>
                {amountSign}
                {formatCurrency(Number(transaction.amount))}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-4 px-4 pb-6">
              <Card>
                <CardContent className="space-y-5 pt-5">
                  <div className="flex items-start gap-3">
                    <Tag className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Categoria</p>
                      <p className="font-medium">
                        {transaction.category?.name ?? 'Sem categoria'}
                      </p>
                    </div>
                  </div>

                  {transaction.card && (
                    <div className="flex items-start gap-3">
                      <CreditCard className="mt-1 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Forma de pagamento</p>
                        <p className="font-medium">Cartão · {transaction.card.name}</p>
                      </div>
                    </div>
                  )}

                  {transaction.affects_balance === false && (
                    <div className="flex items-start gap-3">
                      <Ban className="mt-1 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Saldo em conta</p>
                        <p className="font-medium">Esta transação não descontou do saldo</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Calendar className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Data</p>
                      <p className="font-medium">{formatDateShort(transaction.date)}</p>
                    </div>
                  </div>

                  {transaction.author && (
                    <div className="flex items-start gap-3">
                      <User className="mt-1 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Lançado por</p>
                        <p className="font-medium">{transaction.author.display_name}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <FileText className="mt-1 h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Descrição</p>
                      <p className="whitespace-pre-wrap font-medium">
                        {transaction.description || 'Sem descrição'}
                      </p>
                    </div>
                  </div>

                  {transaction.note && (
                    <div className="flex items-start gap-3">
                      <FileText className="mt-1 h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Observação</p>
                        <p className="whitespace-pre-wrap">{transaction.note}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Hash className="mt-1 h-4 w-4 text-muted-foreground/50" />
                    <div>
                      <p className="text-xs text-muted-foreground">ID</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {transaction.id}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button className="w-full" size="lg" onClick={() => setEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar transação
                </Button>

                {onDelete && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                    disabled={deleting}
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleting ? 'Excluindo…' : 'Excluir transação'}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
