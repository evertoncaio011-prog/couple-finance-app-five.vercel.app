import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase com a service_role key — contorna TODAS as políticas de
 * RLS. NUNCA importe isso em um componente cliente ('use client') ou
 * exponha o resultado de uma chamada feita com ele diretamente para o
 * navegador sem antes filtrar os dados.
 *
 * Uso permitido apenas em:
 * 1. Rotas de servidor que verificam autorização antes de usar (ex.: o
 *    webhook do Stripe, que valida a assinatura do evento).
 * 2. Páginas/ações do painel admin, que já checam requireAdmin() antes.
 *
 * O pacote "server-only" faz o build falhar se este arquivo acabar sendo
 * importado, direta ou indiretamente, por código que roda no navegador.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    'https://your-project-ref.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurada. Pegue a chave "service_role" em Supabase > Project Settings > API e adicione ao seu .env.local (nunca ao NEXT_PUBLIC_*, e nunca commitada).',
    )
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
