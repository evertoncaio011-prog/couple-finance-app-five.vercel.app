'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { addGoal } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Criando…' : 'Criar meta'}
    </Button>
  )
}

const DEFAULT_COLOR = '#0ea5e9'

export function GoalForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [state, formAction] = useActionState(addGoal, {})
  const [color, setColor] = useState(DEFAULT_COLOR)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      toast.success('Meta criada!')
      formRef.current?.reset()
      setColor(DEFAULT_COLOR)
      onSuccess?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-2">
        <Label htmlFor="goal-name">Nome</Label>
        <Input id="goal-name" name="name" placeholder="Ex.: Viagem para a praia" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="goal-description">
          Descrição <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="goal-description"
          name="description"
          placeholder="Algum detalhe sobre essa meta…"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="goal-target">Valor alvo</Label>
        <Input
          id="goal-target"
          name="target_amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          placeholder="0,00"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="goal-color">Cor</Label>
        <input
          id="goal-color"
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
