import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type {
  Card,
  CardInvoicePayment,
  Category,
  MyAccount,
  Profile,
  SharedAccount,
  TransactionWithMeta,
} from '@/lib/types'

export async function getSessionContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, profile: null, account: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  // O orçamento "ativo" é o que aparece no dashboard/transações agora.
  // Um usuário pode pertencer a vários orçamentos (account_members) e
  // trocar entre eles sem perder acesso a nenhum.
  let account: SharedAccount | null = null
  if (profile?.active_account_id) {
    const { data } = await supabase
      .from('shared_accounts')
      .select('*')
      .eq('id', profile.active_account_id)
      .single<SharedAccount>()
    account = data
  }

  return { supabase, user, profile, account }
}

/** Todos os orçamentos do usuário logado, com o ativo marcado. */
export async function getMyAccounts(): Promise<MyAccount[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_accounts')
  if (error) {
    console.error('Falha ao carregar orçamentos:', error.message)
    return []
  }
  return (data as MyAccount[]) ?? []
}

export async function requireAccount() {
  const ctx = await getSessionContext()
  if (!ctx.user) redirect('/auth/login')
  if (!ctx.account) redirect('/onboarding')
  return {
    supabase: ctx.supabase,
    user: ctx.user,
    profile: ctx.profile!,
    account: ctx.account!,
  }
}

export async function getCategories(accountId: string): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('account_id', accountId)
    .order('type', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Falha ao carregar categorias:', error.message)
    return []
  }
  return (data as Category[]) ?? []
}

export async function getTransactions(
  accountId: string,
  limit?: number,
): Promise<TransactionWithMeta[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('transactions')
    .select(
      '*, category:categories(id, name, color, type), author:profiles(id, display_name), card:cards(id, name, color)',
    )
    .eq('account_id', accountId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data, error } = await query
  
  if (error) {
    console.error('Falha ao carregar transações:', error.message)
    return []
  }

  return (data as unknown as TransactionWithMeta[]) ?? []
}

export async function getMembers(accountId: string): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('account_members')
    .select('profile:profiles(*)')
    .eq('account_id', accountId)
  if (error) {
    console.error('Falha ao carregar membros:', error.message)
    return []
  }
  return ((data ?? []) as unknown as { profile: Profile }[])
    .map((row) => row.profile)
    .filter(Boolean)
}

export async function getCards(accountId: string): Promise<Card[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('account_id', accountId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Falha ao carregar cartões:', error.message)
    return []
  }
  return (data as Card[]) ?? []
}

/** Faturas já pagas dos cartões do orçamento (usado para excluir essas
 * competências do cálculo de fatura em aberto). */
export async function getCardInvoicePayments(
  cardIds: string[],
): Promise<CardInvoicePayment[]> {
  if (cardIds.length === 0) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('card_invoice_payments')
    .select('*')
    .in('card_id', cardIds)

  if (error) {
    console.error('Falha ao carregar faturas pagas:', error.message)
    return []
  }
  return (data as CardInvoicePayment[]) ?? []
}