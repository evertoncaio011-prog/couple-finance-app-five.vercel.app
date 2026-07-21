'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { updateDisplayName, updatePassword } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando…' : 'Salvar'}
    </Button>
  )
}

export function ProfileForm({ defaultValue }: { defaultValue: string }) {
  const [state, formAction] = useActionState(updateDisplayName, {})

  useEffect(() => {
    if (state.success) toast.success('Nome atualizado!')
  }, [state.success])

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          name="display_name"
          defaultValue={defaultValue}
          placeholder="Seu nome"
          required
        />
        <SubmitButton />
      </div>
      {state.error && (
        <p className="text-sm font-medium text-destructive animate-in fade-in-0 slide-in-from-top-1">
          {state.error}
        </p>
      )}
    </form>
  )
}

export function PasswordForm() {
  const [state, formAction] = useActionState(updatePassword, {})

  useEffect(() => {
    if (state.success) toast.success('Senha atualizada!')
  }, [state.success])

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input id="password" name="password" type="password" placeholder="Digite a nova senha" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm_password">Confirmar senha</Label>
        <Input id="confirm_password" name="confirm_password" type="password" placeholder="Repita a nova senha" required />
      </div>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
      {state.error && (
        <p className="text-sm font-medium text-destructive animate-in fade-in-0 slide-in-from-top-1">
          {state.error}
        </p>
      )}
    </form>
  )
}
