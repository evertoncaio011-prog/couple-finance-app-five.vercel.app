'use server'

import { createNotification } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSessionContext } from '@/lib/data'

type ActionResult = { error?: string; success?: boolean; data?: unknown }

/* ---------- Convites, Contas e Parceiros ---------- */

export async function createInvite(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_invite', { p_email: null })
  if (error) return { error: error.message }
  revalidatePath('/profile')
  return { success: true, data }
}

export async function createSharedAccount(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Você precisa estar conectado(a).' }
  const name = String(formData.get('name') ?? '').trim()
  const initialBalance = Number(formData.get('initial_balance') ?? 0)
  if (!name) return { error: 'Dê um nome ao seu orçamento.' }
  const { error } = await supabase.rpc('create_shared_account', {
    p_name: name,
    p_initial_balance: Number.isFinite(initialBalance) ? initialBalance : 0,
  })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function joinSharedAccount(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Você precisa estar conectado(a).' }
  const code = String(formData.get('code') ?? '').trim().toUpperCase()
  if (!code) return { error: 'Digite um código de convite.' }
  const { error } = await supabase.rpc('accept_invite', { p_code: code })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// Troca qual orçamento está ativo. Não tira o usuário de nenhum
// orçamento — sempre reversível, pode trocar de volta a qualquer momento.
export async function switchActiveAccount(accountId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('switch_active_account', { p_account_id: accountId })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// Sai DEFINITIVAMENTE de um orçamento (remove a membresia). O orçamento e
// as transações/categorias dele nunca são apagados, só deixam de ser
// acessíveis por quem saiu. Diferente de switchActiveAccount (que só troca
// qual orçamento você está vendo) e de signOut (que desloga da conta).
export async function leaveAccountPermanently(accountId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('leave_shared_account_permanently', {
    p_account_id: accountId,
  })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function removePartner(partnerId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('remove_partner', { p_partner_id: partnerId })
  if (error) return { error: error.message }
  revalidatePath('/profile')
  return { success: true }
}

/* ---------- Transações ---------- */

export async function addTransaction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { user, account } = await getSessionContext()
  if (!user || !account) return { error: 'Nenhum orçamento compartilhado encontrado.' }
  const supabase = await createClient()
  const type = String(formData.get('type') ?? '')
  const amount = Number(formData.get('amount') ?? 0)
  const description = String(formData.get('description') ?? '').trim()
  const date = String(formData.get('date') ?? '')

  if (type !== 'income' && type !== 'expense' && type !== 'neutral') {
    return { error: 'Escolha receita, despesa ou outros.' }
  }

  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Informe um valor maior que zero.' }
  if (!date) return { error: 'Escolha uma data.' }

  // Cartão de crédito só faz sentido para despesa/outros — receita nunca
  // "entra" via cartão. Se for pagamento no cartão, a compra fica de fora
  // do saldo até a fatura ser paga (ver pay_card_invoice no schema).
  const paymentMethod = String(formData.get('payment_method') ?? 'cash')
  const cardId = String(formData.get('card_id') ?? '') || null
  if (paymentMethod === 'credit' && type !== 'income' && !cardId) {
    return { error: 'Escolha o cartão usado na compra.' }
  }

  const { error } = await supabase.from('transactions').insert({
    account_id: account.id, user_id: user.id, type, amount,
    category_id: String(formData.get('category_id') ?? '') || null,
    description: description || null, note: String(formData.get('note') ?? '').trim() || null, date,
    card_id: paymentMethod === 'credit' && type !== 'income' ? cardId : null,
  })

  if (error) return { error: error.message }

  const notificationTitle = type === 'income' ? 'Nova receita' : type === 'expense' ? 'Nova despesa' : 'Novo ajuste';
  await createNotification({ 
    accountId: account.id, userId: user.id, type: 'transaction_created', 
    title: notificationTitle, message: `${description || 'Sem descrição'} • R$ ${amount.toFixed(2)}` 
  })

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  redirect('/transactions')
}

export async function updateTransaction(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { user, account } = await getSessionContext()
  if (!user || !account) return { error: 'Nenhum orçamento compartilhado encontrado.' }
  const supabase = await createClient()
  const type = String(formData.get('type') ?? '')
  const amount = Number(formData.get('amount') ?? 0)
  const description = String(formData.get('description') ?? '').trim()

  if (type !== 'income' && type !== 'expense' && type !== 'neutral') {
    return { error: 'Tipo de transação inválido.' }
  }

  const paymentMethod = String(formData.get('payment_method') ?? 'cash')
  const cardId = String(formData.get('card_id') ?? '') || null
  if (paymentMethod === 'credit' && type !== 'income' && !cardId) {
    return { error: 'Escolha o cartão usado na compra.' }
  }

  const { error } = await supabase.from('transactions').update({
    type, amount, description, date: String(formData.get('date') ?? ''),
    category_id: String(formData.get('category_id') ?? '') || null,
    note: String(formData.get('note') ?? '').trim() || null,
    card_id: paymentMethod === 'credit' && type !== 'income' ? cardId : null,
  }).eq('id', id).eq('account_id', account.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  redirect('/transactions')
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const { account } = await getSessionContext()
  if (!account) return { error: 'Nenhum orçamento compartilhado encontrado.' }
  const supabase = await createClient()
  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('account_id', account.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  return { success: true }
}

/* ---------- Cartões e Faturas ---------- */

export async function addCard(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { account } = await getSessionContext()
  if (!account) return { error: 'Nenhum orçamento compartilhado encontrado.' }
  const supabase = await createClient()
  const name = String(formData.get('name') ?? '').trim()
  const creditLimit = Number(formData.get('credit_limit') ?? 0)
  const closingDay = Number(formData.get('closing_day') ?? 0)
  const dueDay = Number(formData.get('due_day') ?? 0)
  const color = String(formData.get('color') ?? '#7c3aed')

  if (!name) return { error: 'Dê um nome ao cartão.' }
  if (!Number.isInteger(closingDay) || closingDay < 1 || closingDay > 28) {
    return { error: 'Dia de fechamento deve ser entre 1 e 28.' }
  }
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
    return { error: 'Dia de vencimento deve ser entre 1 e 28.' }
  }

  const { error } = await supabase.from('cards').insert({
    account_id: account.id,
    name,
    credit_limit: Number.isFinite(creditLimit) ? creditLimit : 0,
    closing_day: closingDay,
    due_day: dueDay,
    color,
  })
  if (error) return { error: error.message }
  revalidatePath('/cards')
  return { success: true }
}

export async function deleteCard(id: string): Promise<ActionResult> {
  const { account } = await getSessionContext()
  if (!account) return { error: 'Nenhum orçamento compartilhado encontrado.' }
  const supabase = await createClient()
  const { error } = await supabase.from('cards').delete().eq('id', id).eq('account_id', account.id)
  if (error) return { error: error.message }
  revalidatePath('/cards')
  revalidatePath('/dashboard')
  return { success: true }
}

// Paga a fatura de uma competência ('YYYY-MM'): gera a transação de saída
// que, por padrão, sai do saldo em conta. Se affectsBalance for false, a
// fatura é marcada como paga do mesmo jeito, mas o valor NÃO é descontado
// do saldo (ex.: pagamento feito com dinheiro que não passou pela conta
// compartilhada). Toda a lógica (somar as compras, impedir pagar duas
// vezes) fica no banco, em pay_card_invoice().
export async function payCardInvoice(
  cardId: string,
  competencia: string,
  affectsBalance: boolean = true,
): Promise<ActionResult> {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  // Tenta a assinatura mais nova primeiro (com affects_balance) e cai para
  // assinaturas mais antigas se o banco ainda não tiver sido atualizado —
  // nesse caso, "não descontar do saldo" ainda não vai funcionar até o SQL
  // do schema ser executado no Supabase.
  const attempts = [
    { p_card_id: cardId, p_competencia: competencia, p_date: today, p_affects_balance: affectsBalance },
    { p_card_id: cardId, p_competencia: competencia, p_date: today },
    { p_card_id: cardId, p_competencia: competencia },
  ]

  let lastError: Error | null = null
  for (const params of attempts) {
    const { data, error } = await supabase.rpc('pay_card_invoice', params)
    if (!error) {
      revalidatePath('/cards')
      revalidatePath('/dashboard')
      revalidatePath('/transactions')
      return { success: true, data }
    }

    const message = error.message?.toLowerCase() ?? ''
    if (!message.includes('could not find the function') && !message.includes('does not exist')) {
      return { error: error.message }
    }

    lastError = error
  }

  if (lastError) {
    return {
      error: 'A função de pagamento da fatura ainda não está disponível no banco. Execute o SQL atualizado do schema no Supabase e tente novamente.',
    }
  }

  return { error: 'Não foi possível pagar a fatura.' }
}

/* ---------- Perfil, Categorias e Outros ---------- */

export async function addCategory(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { account } = await getSessionContext()
  if (!account) return { error: 'Nenhum orçamento compartilhado encontrado.' }
  const supabase = await createClient()
  const name = String(formData.get('name') ?? '').trim()
  const type = String(formData.get('type') ?? 'both')
  const color = String(formData.get('color') ?? '#16a34a')
  if (!name) return { error: 'A categoria precisa de um nome.' }
  const { error } = await supabase.from('categories').insert({ account_id: account.id, name, type, color })
  if (error) return { error: error.message }
  revalidatePath('/categories')
  return { success: true }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { account } = await getSessionContext()
  if (!account) return { error: 'Nenhum orçamento compartilhado encontrado.' }
  const supabase = await createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id).eq('account_id', account.id)
  if (error) return { error: error.message }
  revalidatePath('/categories')
  return { success: true }
}

export async function updateDisplayName(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { user } = await getSessionContext()
  if (!user) return { error: 'Você não está conectado(a).' }
  const supabase = await createClient()
  const name = String(formData.get('display_name') ?? '').trim()
  if (!name) return { error: 'O nome não pode ficar vazio.' }
  const { error } = await supabase.from('profiles').update({ display_name: name }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/profile')
  return { success: true }
}

export async function updatePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const currentPassword = String(formData.get('current_password') ?? '').trim()
  const password = String(formData.get('password') ?? '').trim()
  const confirmPassword = String(formData.get('confirm_password') ?? '').trim()

  if (!currentPassword) {
    return { error: 'Informe sua senha atual.' }
  }

  if (!password || !confirmPassword) {
    return { error: 'Preencha a nova senha e sua confirmação.' }
  }

  if (password.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres.' }
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas não conferem.' }
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user || !user.email) {
    return { error: 'Você precisa estar autenticado(a).' }
  }

  if (password === currentPassword) {
    return { error: 'A nova senha precisa ser diferente da atual.' }
  }

  // Confere a senha atual tentando autenticar de novo com ela. Isso não
  // troca a sessão atual do usuário — só valida a credencial antes de
  // permitir a troca (evita que alguém com a sessão aberta, mas sem saber
  // a senha, altere a senha da conta).
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (verifyError) {
    return { error: 'Senha atual incorreta.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  return { success: true }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  // Por padrão o Supabase usa scope: 'global', que invalida a sessão em
  // TODOS os dispositivos do usuário. Aqui queremos deslogar só este
  // dispositivo/navegador, então usamos scope: 'local'.
  await supabase.auth.signOut({ scope: 'local' })
  redirect('/auth/login')
}

export async function savePushSubscription(subscription: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: existingSubscription, error: selectError } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('endpoint', subscription.endpoint)
    .maybeSingle()

  if (selectError) throw new Error(`Falha ao buscar inscrição: ${selectError.message}`)

  if (existingSubscription) {
    const { error } = await supabase
      .from('push_subscriptions')
      .update({
        user_id: user.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      })
      .eq('id', existingSubscription.id)

    if (error) throw new Error(`Falha ao atualizar inscrição: ${error.message}`)
  } else {
    const { error } = await supabase.from('push_subscriptions').insert([
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    ])

    if (error) throw new Error(`Falha ao salvar inscrição: ${error.message}`)
  }

  return { success: true }
}