'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createSharedAccount, joinSharedAccount } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  )
}

export function OnboardingForms() {
  const [createState, createAction] = useActionState(createSharedAccount, {})
  const [joinState, joinAction] = useActionState(joinSharedAccount, {})

  return (
    <Tabs defaultValue="create" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="create">Criar orçamento</TabsTrigger>
        <TabsTrigger value="join">Entrar com convite</TabsTrigger>
      </TabsList>

      <TabsContent
        value="create"
        className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
      >
        <form
          action={createAction}
          className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do orçamento</Label>
            <Input
              id="name"
              name="name"
              placeholder="Nossa Casa"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="initial_balance">Saldo inicial</Label>
            <Input
              id="initial_balance"
              name="initial_balance"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              defaultValue="0"
            />
            <p className="text-xs text-muted-foreground">
              O dinheiro que vocês têm juntos hoje. Você pode alterar isso
              depois.
            </p>
          </div>
          {createState.error && (
            <p className="text-sm font-medium text-destructive animate-in fade-in-0 slide-in-from-top-1">
              {createState.error}
            </p>
          )}
          <SubmitButton label="Criar orçamento" pendingLabel="Criando…" />
        </form>
      </TabsContent>

      <TabsContent
        value="join"
        className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
      >
        <form
          action={joinAction}
          className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="grid gap-2">
            <Label htmlFor="code">Código de convite</Label>
            <Input
              id="code"
              name="code"
              placeholder="Ex.: 4F9A2B7C"
              className="uppercase tracking-widest"
              required
            />
            <p className="text-xs text-muted-foreground">
              Peça para seu parceiro(a) o código exibido no perfil dele(a).
            </p>
          </div>
          {joinState.error && (
            <p className="text-sm font-medium text-destructive animate-in fade-in-0 slide-in-from-top-1">
              {joinState.error}
            </p>
          )}
          <SubmitButton label="Entrar no orçamento" pendingLabel="Entrando…" />
        </form>
      </TabsContent>
    </Tabs>
  )
}
