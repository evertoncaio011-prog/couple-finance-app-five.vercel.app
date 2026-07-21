'use client'

import { useState, useTransition } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { createInvite } from '@/app/actions'
import { Button } from '@/components/ui/button'

export function InviteCard() {
  const [pending, startTransition] = useTransition()
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function generate() {
    startTransition(async () => {
      const res = await createInvite()
      if (res.error) {
        toast.error(res.error)
        return
      }
      const data = res.data as { code: string } | undefined
      if (data?.code) setCode(data.code)
    })
  }

  async function copy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Código copiado!')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Não foi possível copiar. Copie o código manualmente.')
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Gere um código único e envie para seu parceiro(a) usar na aba
        &quot;Usar código&quot;.
      </p>
      {code ? (
        <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 animate-in fade-in-0 zoom-in-95 duration-300">
          <span className="font-mono text-lg font-bold tracking-widest">{code}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={copy}
            aria-label="Copiar código"
            className="transition-transform active:scale-90"
          >
            {copied ? (
              <Check className="h-4 w-4 text-primary" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </div>
      ) : (
        <Button type="button" onClick={generate} disabled={pending}>
          {pending ? 'Gerando…' : 'Gerar código de convite'}
        </Button>
      )}
    </div>
  )
}
