import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Cliente Supabase com a service_role key.
 *
 * NUNCA importe em componentes cliente ('use client').
 * Uso somente em código server-side.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    'https://your-project-ref.supabase.co'

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurada. Adicione a chave service_role do Supabase no .env.local.',
    )
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}


/**
 * Verifica se um email possui permissão de administrador.
 */
export function isAdminEmail(email?: string | null) {
  if (!email) return false

  const adminEmails = [
    process.env.ADMIN_EMAIL,
  ].filter(Boolean)

  return adminEmails.includes(email)
}


/**
 * Exige usuário administrador autenticado.
 *
 * Usado em páginas e actions protegidas.
 */
export async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Usuário não autenticado')
  }

  if (!isAdminEmail(user.email)) {
    throw new Error('Acesso negado: usuário sem permissão de administrador')
  }

  return user
}