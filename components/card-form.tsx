'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { addCard } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Adicionando…' : 'Adicionar cartão'}
    </Button>
  )
}

const DEFAULT_COLOR = '#7c3aed'

export function CardForm() {
  const [state, formAction] = useActionState(addCard, {})
  const [color, setColor] = useState(DEFAULT_COLOR)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      toast.success('Cartão adicionado!')
      formRef.current?.reset()
      setColor(DEFAULT_COLOR)
    }
  }, [state.success])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
    >
      <div className="grid gap-2">
        <Label htmlFor="card-name">Nome</Label>
        <Input id="card-name" name="name" placeholder="Ex.: Nubank" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="card-limit">Limite (opcional)</Label>
        <Input
          id="card-limit"
          name="credit_limit"
          type="number"
          step="0.01"
          min="0"
          placeholder="0,00"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="card-closing-day">Dia de fechamento</Label>
          <Input
            id="card-closing-day"
            name="closing_day"
            type="number"
            min="1"
            max="28"
            placeholder="Ex.: 20"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="card-due-day">Dia de vencimento</Label>
          <Input
            id="card-due-day"
            name="due_day"
            type="number"
            min="1"
            max="28"
            placeholder="Ex.: 27"
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="card-color">Cor</Label>
        <input
          id="card-color"
          name="color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-full cursor-pointer rounded-lg border border-input bg-transparent p-1 transition-transform active:scale-95"
        />
      </div>

      {state.error && (
        <p className="text-sm font-medium text-destructive animate-in fade-in-0 slide-in-from-top-1">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
