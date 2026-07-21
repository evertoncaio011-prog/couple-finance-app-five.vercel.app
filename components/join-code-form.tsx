'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { joinSharedAccount } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Entrando…' : 'Entrar com código'}
    </Button>
  )
}

export function JoinCodeForm() {
  const [state, formAction] = useActionState(joinSharedAccount, {})

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <div className="grid gap-2">
        <Label htmlFor="join-code">Código de convite</Label>
        <Input
          id="join-code"
          name="code"
          placeholder="Ex.: 4F9A2B7C"
          className="uppercase tracking-widest"
          required
        />
        <p className="text-xs text-muted-foreground">
          Peça o código para seu parceiro(a) na aba &quot;Convidar&quot;
          dele(a).
        </p>
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
