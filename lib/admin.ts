import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Lista de e-mails com acesso ao painel /admin, via variável de ambiente
 * (nunca hardcoded no código, pra não precisar de deploy pra trocar quem
 * é admin). Aceita um ou mais e-mails separados por vírgula:
 *   ADMIN_EMAILS=voce@example.com,parceiro@example.com
 */
function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}

/**
 * Guard de página: redireciona pra fora do /admin se a pessoa não estiver
 * logada ou não estiver na lista de ADMIN_EMAILS. Chame no topo de toda
 * page.tsx dentro de app/admin/.
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect('/dashboard')
  }

  return { user }
}
