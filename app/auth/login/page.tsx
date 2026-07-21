'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandMark } from '@/components/brand-mark'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      const next = new URLSearchParams(window.location.search).get('next')
      router.push(next && next.startsWith('/') ? next : '/')
      router.refresh()
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro. Tente novamente.'

      if (message.includes('Failed to fetch')) {
        setError(
          'Não foi possível conectar ao Supabase. Verifique a URL e a chave pública no ambiente local.',
        )
      } else {
        setError(traduzirErroSupabase(message))
      }
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
              Bem-vindo(a) de volta
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Entre para gerenciar suas finanças em conjunto.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleLogin}
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
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm font-medium text-destructive animate-in fade-in-0 slide-in-from-top-1">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ainda não tem conta?{' '}
          <Link
            href="/auth/sign-up"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  )
}

function traduzirErroSupabase(message: string): string {
  const mapa: Record<string, string> = {
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
    'Failed to fetch':
      'Não foi possível conectar ao Supabase. Verifique a URL e a chave pública no ambiente local.',
  }
  return mapa[message] ?? message
}
