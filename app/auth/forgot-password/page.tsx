'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandMark } from '@/components/brand-mark'
import Link from 'next/link'
import { useState } from 'react'
import { MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const base =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL?.replace('/auth/callback', '') ??
        window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${base}/auth/callback?next=/auth/update-password`,
      })
      if (error) throw error
      // Sempre mostra sucesso, exista ou não a conta — evita que alguém
      // descubra por tentativa e erro quais e-mails têm conta no app.
      setSent(true)
    } catch {
      setSent(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <BrandMark />
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold text-balance">
              Recuperar senha
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Informe seu e-mail e enviaremos um link para você criar uma nova senha.
            </p>
          </div>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <MailCheck className="h-8 w-8 text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Se existir uma conta com o e-mail <strong className="text-foreground">{email}</strong>,
              enviamos um link de recuperação para ela. Confira sua caixa de entrada (e o spam).
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@exemplo.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive animate-in fade-in-0 slide-in-from-top-1">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Enviando…' : 'Enviar link de recuperação'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Lembrou a senha?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
