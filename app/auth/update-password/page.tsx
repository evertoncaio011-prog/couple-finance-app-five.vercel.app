'use client'

import { createClient } from '@/lib/supabase/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { BrandMark } from '@/components/brand-mark'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const router = useRouter()

  // O link do e-mail passa pelo /auth/callback, que troca o código por uma
  // sessão de recuperação válida só pra essa ação. Se a pessoa cair direto
  // nessa página sem isso (link expirado, por exemplo), avisamos.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setHasSession(Boolean(data.user)))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      router.push('/dashboard')
      router.refresh()
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : 'Ocorreu um erro. Tente novamente.',
      )
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
              Criar nova senha
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Escolha uma nova senha para sua conta.
            </p>
          </div>
        </div>

        {hasSession === false ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              Esse link de recuperação é inválido ou expirou. Solicite um novo na tela de
              recuperação de senha.
            </p>
            <Link href="/auth/forgot-password" className={buttonVariants({ className: 'mt-4 w-full' })}>
              Solicitar novo link
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="grid gap-2">
              <Label htmlFor="password">Nova senha</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive animate-in fade-in-0 slide-in-from-top-1">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading || hasSession === null}>
              {isLoading ? 'Salvando…' : 'Salvar nova senha'}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
