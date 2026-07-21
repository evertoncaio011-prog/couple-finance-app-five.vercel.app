import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { MailCheck } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm animate-in fade-in-0 zoom-in-95 duration-500">
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary animate-in zoom-in-50 duration-500 delay-150">
            <MailCheck className="h-7 w-7" aria-hidden />
          </span>
          <div className="space-y-1.5">
            <h1 className="font-heading text-xl font-bold text-balance">
              Confirme seu e-mail
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Enviamos um link de confirmação para você. Clique nele para
              verificar sua conta e depois entre para configurar seu
              orçamento compartilhado.
            </p>
          </div>
          <Button render={<Link href="/auth/login" />} variant="outline" className="w-full">
            Voltar para login
          </Button>
        </div>
      </div>
    </main>
  )
}
