'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { addCategory } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Adicionando…' : 'Adicionar categoria'}
    </Button>
  )
}

const DEFAULT_COLOR = '#16a34a'

export function CategoryForm() {
  const [state, formAction] = useActionState(addCategory, {})
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [type, setType] = useState('both')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      toast.success('Categoria adicionada!')
      formRef.current?.reset()
      setColor(DEFAULT_COLOR)
      setType('both')
    }
  }, [state.success])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
    >
      <div className="grid gap-2">
        <Label htmlFor="cat-name">Nome</Label>
        <Input id="cat-name" name="name" placeholder="Ex.: Pet" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cat-type">Tipo</Label>
          <select
            id="cat-type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={selectClass}
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
            <option value="both">Ambos</option>
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="cat-color">Cor</Label>
          <input
            id="cat-color"
            name="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-full cursor-pointer rounded-lg border border-input bg-transparent p-1 transition-transform active:scale-95"
          />
        </div>
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
