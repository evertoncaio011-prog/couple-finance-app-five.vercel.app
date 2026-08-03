'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { createBillingPortalSession, createCheckoutSession } from '@/app/actions-billing'
import { Button } from '@/components/ui/button'

type ActionResult = { error?: string; success?: boolean }

function ActionButton({
  label,
  pendingLabel,
  variant,
}: {
  label: string
  pendingLabel: string
  variant?: 'outline'
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} className="w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  )
}

function ErrorNotice({ state }: { state: ActionResult }) {
  useEffect(() => {
    if (state.error) toast.error(state.error)
  }, [state.error])
  return null
}

export function SubscribeButton() {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    async () => (await createCheckoutSession()) ?? {},
    {},
  )
  return (
    <form action={formAction}>
      <ErrorNotice state={state} />
      <ActionButton label="Assinar Premium" pendingLabel="Abrindo checkout…" />
    </form>
  )
}

export function ManageBillingButton() {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    async () => (await createBillingPortalSession()) ?? {},
    {},
  )
  return (
    <form action={formAction}>
      <ErrorNotice state={state} />
      <ActionButton label="Gerenciar assinatura" pendingLabel="Abrindo…" variant="outline" />
    </form>
  )
}
