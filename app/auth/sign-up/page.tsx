'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandMark } from '@/components/brand-mark'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('As senhas não coincidem.')
      setIsLoading(false)
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            display_name: displayName,
          },
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? traduzirErroSupabase(error.message)
          : 'Ocorreu um erro. Tente novamente.',
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
              Comece a controlar juntos
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Crie sua conta e depois convide seu parceiro(a).
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSignUp}
          className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Seu nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Maria"
              autoComplete="name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
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
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="repeat-password">Repita a senha</Label>
            <Input
              id="repeat-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm font-medium text-destructive animate-in fade-in-0 slide-in-from-top-1">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Criando conta…' : 'Criar conta'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
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

function traduzirErroSupabase(message: string): string {
  const mapa: Record<string, string> = {
    'User already registered': 'Já existe uma conta com esse e-mail.',
    'Password should be at least 6 characters':
      'A senha deve ter pelo menos 6 caracteres.',
    'Unable to validate email address: invalid format':
      'Endereço de e-mail inválido.',
  }
  return mapa[message] ?? message
}
