-- ============================================================================
-- Saldo individual — "Conferir saldo" — execute no SQL Editor do Supabase.
-- Adiciona um ajuste manual por pessoa dentro de cada orçamento. Ele soma
-- ao saldo calculado a partir das transações (ver computeUserBalance em
-- lib/summary.ts), sem nunca mexer no saldo do outro membro do casal nem
-- no saldo inicial da conta como um todo (shared_accounts.initial_balance,
-- que é compartilhado).
-- ============================================================================

alter table public.account_members
  add column if not exists balance_adjustment numeric(14,2) not null default 0;

alter table public.account_members enable row level security;

-- Cada pessoa só pode editar a PRÓPRIA linha (user_id = auth.uid()), e só
-- a coluna balance_adjustment — o grant abaixo restringe a coluna, e a
-- policy restringe a linha. As duas coisas juntas impedem alguém de
-- alterar o ajuste do parceiro(a) ou qualquer outro campo da tabela.
drop policy if exists "account_members_update_own_adjustment" on public.account_members;
create policy "account_members_update_own_adjustment"
  on public.account_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke update on public.account_members from authenticated;
grant update (balance_adjustment) on public.account_members to authenticated;
