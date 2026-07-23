import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Next.js 16 renomeou "middleware" para "proxy": este arquivo precisa
// ficar na raiz do projeto e exportar uma função chamada "proxy" (ou um
// default export). É o que roda antes de qualquer página protegida.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    'https://your-project-ref.supabase.co'
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    'your-anon-public-key'

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  // Não rode nada entre createServerClient e getUser(): pode causar
  // logout aleatório de usuários (ver docs do Supabase sobre SSR).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rotas que exigem sessão autenticada. Cada página também se protege
  // sozinha via requireAccount(), mas checar aqui evita que a requisição
  // chegue a renderizar qualquer coisa sem usuário logado.
  const protectedPrefixes = [
    '/dashboard',
    '/transactions',
    '/categories',
    '/cards',
    '/profile',
    '/settings',
    '/onboarding',
  ]
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}