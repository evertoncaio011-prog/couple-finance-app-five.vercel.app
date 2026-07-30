'use client'

import { useActionState, useEffect, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { deleteCard, updateCard } from '@/app/actions'
import type { Card } from '@/lib/types'

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Salvando…' : 'Salvar alterações'}
    </Button>
  )
}

export function CardSheet({
  open,
  onOpenChange,
  card,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: Card
}) {
  const [state, formAction] = useActionState(updateCard.bind(null, card.id), {})
  const [deleting, startDelete] = useTransition()

  useEffect(() => {
    if (state.success) {
      toast.success('Cartão atualizado!')
      onOpenChange(false)
    }
  }, [state.success, onOpenChange])

  function handleDelete() {
    if (
      !window.confirm(
        'Excluir este cartão? As compras já lançadas nele mantêm o valor, mas perdem o vínculo com o cartão.',
      )
    )
      return
    startDelete(async () => {
      const res = await deleteCard(card.id)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Cartão excluído')
      onOpenChange(false)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="space-y-1 text-center">
          <SheetDescription>Editar cartão</SheetDescription>
          <SheetTitle className="text-2xl font-bold">{card.name}</SheetTitle>
        </SheetHeader>

        <form action={formAction} className="flex flex-col gap-4 px-5 pb-6">
          <div className="grid gap-2">
            <Label htmlFor="edit-card-name">Nome</Label>
            <Input id="edit-card-name" name="name" defaultValue={card.name} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-card-limit">Limite (opcional)</Label>
            <Input
              id="edit-card-limit"
              name="credit_limit"
              type="number"
              step="0.01"
              min="0"
              defaultValue={Number(card.credit_limit) || undefined}
              placeholder="0,00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-card-closing-day">Dia de fechamento</Label>
              <Input
                id="edit-card-closing-day"
                name="closing_day"
                type="number"
                min="1"
                max="28"
                defaultValue={card.closing_day}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-card-due-day">Dia de vencimento</Label>
              <Input
                id="edit-card-due-day"
                name="due_day"
                type="number"
                min="1"
                max="28"
                defaultValue={card.due_day}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-card-color">Cor</Label>
            <input
              id="edit-card-color"
              name="color"
              type="color"
              defaultValue={card.color}
              className="h-8 w-full cursor-pointer rounded-lg border border-input bg-transparent p-1 transition-transform active:scale-95"
            />
          </div>

          {state.error && (
            <p className="text-sm font-medium text-destructive animate-in fade-in-0 slide-in-from-top-1">
              {state.error}
            </p>
          )}

          <SaveButton />

          <Button
            type="button"
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            disabled={deleting}
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? 'Excluindo…' : 'Excluir cartão'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
