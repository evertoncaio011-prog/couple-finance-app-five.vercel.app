'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Ban, PartyPopper, Pencil, PlusCircle, Trash2, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { GoalProgressBar } from '@/components/goal-progress-bar'
import { addGoalAmount, deleteGoal, updateGoal } from '@/app/actions'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Goal } from '@/lib/types'

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Salvando…' : 'Salvar alterações'}
    </Button>
  )
}

export function GoalSheet({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal
}) {
  const [editing, setEditing] = useState(false)
  const [addValue, setAddValue] = useState('')
  const [affectsBalance, setAffectsBalance] = useState(true)
  const [adding, startAdding] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [editState, editAction] = useActionState(updateGoal.bind(null, goal.id), {})

  // Sempre volta pra visão de detalhes ao reabrir, mesmo que tenha sido
  // fechada no meio de uma edição.
  useEffect(() => {
    if (!open) {
      setEditing(false)
      setAddValue('')
      setAffectsBalance(true)
    }
  }, [open])

  useEffect(() => {
    if (editState.success) {
      toast.success('Meta atualizada!')
      setEditing(false)
    }
  }, [editState.success])

  const current = Number(goal.current_amount)
  const target = Number(goal.target_amount)
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0
  const remaining = Math.max(0, target - current)
  const isComplete = Boolean(goal.completed_at)

  const parsedAdd = Number(addValue.replace(',', '.'))
  const addValid = addValue.trim() !== '' && Number.isFinite(parsedAdd) && parsedAdd > 0

  function handleAdd() {
    if (!addValid) return
    startAdding(async () => {
      const res = await addGoalAmount(goal.id, parsedAdd, affectsBalance)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(
        affectsBalance
          ? 'Valor adicionado! O saldo disponível foi ajustado.'
          : 'Valor adicionado! O saldo disponível não foi alterado.',
      )
      setAddValue('')
      setAffectsBalance(true)
    })
  }

  function handleDelete() {
    if (!window.confirm('Excluir esta meta? Essa ação não pode ser desfeita.')) return
    startDelete(async () => {
      const res = await deleteGoal(goal.id)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Meta excluída')
      onOpenChange(false)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
        {editing ? (
          <>
            <SheetHeader className="space-y-1 text-center">
              <SheetDescription>Editar meta</SheetDescription>
              <SheetTitle className="text-2xl font-bold">{goal.name}</SheetTitle>
            </SheetHeader>

            <form action={editAction} className="flex flex-col gap-4 px-5 pb-6">
              <div className="grid gap-2">
                <Label htmlFor="edit-goal-name">Nome</Label>
                <Input id="edit-goal-name" name="name" defaultValue={goal.name} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-goal-description">
                  Descrição <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  id="edit-goal-description"
                  name="description"
                  defaultValue={goal.description ?? ''}
                  placeholder="Algum detalhe sobre essa meta…"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-goal-target">Valor alvo</Label>
                <Input
                  id="edit-goal-target"
                  name="target_amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  defaultValue={target}
                  required
                />
              </div>

              {editState.error && (
                <p className="text-sm font-medium text-destructive animate-in fade-in-0 slide-in-from-top-1">
                  {editState.error}
                </p>
              )}

              <SaveButton />
              <Button type="button" variant="ghost" className="w-full" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </form>
          </>
        ) : (
          <>
            <SheetHeader className="space-y-2 text-center">
              <SheetDescription>{isComplete ? 'Meta concluída' : 'Meta'}</SheetDescription>
              <SheetTitle className="text-3xl font-bold">{goal.name}</SheetTitle>
            </SheetHeader>

            <div className="space-y-5 px-5 pb-6">
              {isComplete && (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600">
                  <PartyPopper className="h-5 w-5 shrink-0" aria-hidden />
                  Meta concluída! 🎉
                </div>
              )}

              {goal.description && (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {goal.description}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(current)}</p>
                  <p className="text-sm text-muted-foreground">de {formatCurrency(target)}</p>
                </div>
                <GoalProgressBar percent={percent} color={goal.color} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{percent.toFixed(0)}% concluído</span>
                  <span>
                    {isComplete ? 'Meta batida!' : `Falta ${formatCurrency(remaining)}`}
                  </span>
                </div>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <Label htmlFor="add-amount">Adicionar valor</Label>
                <div className="flex gap-2">
                  <Input
                    id="add-amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={addValue}
                    onChange={(e) => setAddValue(e.target.value)}
                  />
                  <Button type="button" disabled={!addValid || adding} onClick={handleAdd}>
                    <PlusCircle className="mr-1.5 h-4 w-4" aria-hidden />
                    {adding ? 'Adicionando…' : 'Adicionar'}
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setAffectsBalance(true)}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors',
                      affectsBalance
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:bg-muted',
                    )}
                  >
                    <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>
                      <span className="block text-sm font-medium">Descontar do saldo</span>
                      <span className="block text-xs text-muted-foreground">
                        Esse valor sai do saldo disponível, como dinheiro guardado.
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAffectsBalance(false)}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors',
                      !affectsBalance
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:bg-muted',
                    )}
                  >
                    <Ban className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>
                      <span className="block text-sm font-medium">Não descontar do saldo</span>
                      <span className="block text-xs text-muted-foreground">
                        Soma no progresso da meta, mas o saldo disponível não muda — use
                        para dinheiro que não passou pela conta.
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar meta
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting ? 'Excluindo…' : 'Excluir meta'}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
