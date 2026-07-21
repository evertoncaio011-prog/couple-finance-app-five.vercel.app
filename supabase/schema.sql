-- ============================================================================
-- Twogether — Shared Finance App
-- Schema, Row Level Security policies and RPC functions.
-- Run this ONCE in Supabase: Project > SQL Editor > New query > Run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------------

create table if not exists public.shared_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  initial_balance numeric(14,2) not null default 0,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  -- Mantida por compatibilidade com instalações antigas; não é mais lida
  -- pelo app. O vínculo real usuário<->orçamento vive em account_members.
  shared_account_id uuid references public.shared_accounts (id) on delete set null,
  -- Qual orçamento está "selecionado" agora (o que aparece no
  -- dashboard/transações). Um usuário pode ser membro de vários
  -- orçamentos ao mesmo tempo e trocar entre eles livremente.
  active_account_id uuid references public.shared_accounts (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Vínculo N:N entre usuários e orçamentos — um usuário pode pertencer a
-- vários orçamentos simultaneamente (ex: um com o parceiro, outro sozinho).
create table if not exists public.account_members (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.shared_accounts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (account_id, user_id)
);

create index if not exists idx_account_members_user on public.account_members (user_id);
create index if not exists idx_account_members_account on public.account_members (account_id);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_member" on public.push_subscriptions;
create policy "push_subscriptions_select_member"
  on public.push_subscriptions for select
  to authenticated
  using (
    user_id = auth.uid()
    or user_id in (
      select am.user_id
      from public.account_members am
      join public.account_members my_am on my_am.account_id = am.account_id
      where my_am.user_id = auth.uid()
    )
  );

drop policy if exists "push_subscriptions_insert_self" on public.push_subscriptions;
create policy "push_subscriptions_insert_self"
  on public.push_subscriptions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "push_subscriptions_delete_self" on public.push_subscriptions;
create policy "push_subscriptions_delete_self"
  on public.push_subscriptions for delete
  to authenticated
  using (user_id = auth.uid());

-- shared_accounts.created_by -> profiles.id is added after profiles exists,
-- since the two tables reference each other.
alter table public.shared_accounts
  drop constraint if exists shared_accounts_created_by_fkey;
alter table public.shared_accounts
  add constraint shared_accounts_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.shared_accounts (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense', 'both')),
  color text not null default '#16a34a',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Cartões de crédito do orçamento. Uma compra no cartão não afeta o saldo
-- em conta na hora — ela só entra na "fatura" (agrupada por competência,
-- calculada a partir do dia de fechamento) e só bate no saldo quando a
-- fatura é paga (via pay_card_invoice(), que gera a transação de saída).
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.shared_accounts (id) on delete cascade,
  name text not null,
  credit_limit numeric(14,2) not null default 0,
  -- Limitado a 1-28 para não ter que lidar com meses que não têm dia 29/30/31.
  closing_day integer not null check (closing_day between 1 and 28),
  due_day integer not null check (due_day between 1 and 28),
  color text not null default '#7c3aed',
  created_at timestamptz not null default now()
);

create index if not exists idx_cards_account on public.cards (account_id);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.shared_accounts (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  -- 'neutral' = "Outros": entra em Gastos do Mês mas nunca afeta o saldo
  -- nem a receita disponível (ver computeAccountBalance em lib/summary.ts).
  type text not null check (type in ('income', 'expense', 'neutral')),
  amount numeric(14,2) not null check (amount > 0),
  category_id uuid references public.categories (id) on delete set null,
  description text,
  note text,
  date date not null,
  created_at timestamptz not null default now()
);

-- Migração para instalações que já tinham a tabela `transactions` sem estas
-- colunas: adiciona sem quebrar nada existente.
-- card_id: se preenchido, esta transação é uma compra no cartão de crédito
--   e NÃO afeta o saldo em conta — ela só compõe o total da fatura.
-- is_invoice_payment: marca a transação de saída gerada automaticamente
--   quando uma fatura é paga (pay_card_invoice()). Ela afeta o saldo
--   normalmente, mas é excluída dos totais de "gasto por categoria" para
--   não contar a mesma compra duas vezes (uma como gasto no cartão, outra
--   como pagamento de fatura).
alter table public.transactions add column if not exists card_id uuid references public.cards (id) on delete set null;
alter table public.transactions add column if not exists is_invoice_payment boolean not null default false;
-- affects_balance = false: transação não desconta do saldo em conta mesmo
-- sendo 'expense' (ver computeAccountBalance em lib/summary.ts). Hoje só é
-- usado no pagamento de fatura quando o usuário escolhe "não descontar do
-- saldo" (ver pay_card_invoice abaixo). Todas as transações existentes e
-- futuras continuam com o padrão (true) a menos que explicitamente marcadas.
alter table public.transactions add column if not exists affects_balance boolean not null default true;

-- Migração para instalações que já tinham a tabela `transactions` criada com
-- a constraint antiga (só 'income'/'expense'): sem isto, qualquer tentativa
-- de salvar uma transação "Outros" (type = 'neutral') é rejeitada pelo
-- banco com "violates check constraint", mesmo o app já enviando o valor
-- certo. Localiza a constraint de check da coluna `type` pelo catálogo (o
-- nome pode variar entre instalações) e a recria permitindo 'neutral'.
do $$
declare
  v_conname text;
begin
  select con.conname into v_conname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
  where rel.relname = 'transactions'
    and con.contype = 'c'
    and att.attname = 'type';

  if v_conname is not null then
    execute format('alter table public.transactions drop constraint %I', v_conname);
  end if;

  alter table public.transactions
    add constraint transactions_type_check check (type in ('income', 'expense', 'neutral'));
end $$;

create index if not exists idx_transactions_card on public.transactions (card_id);

-- Registra qual competência (mês) de fatura de cada cartão já foi paga, e
-- qual transação de saída representa esse pagamento. Uma linha por
-- card_id + competencia; nunca é apagada, só criada/atualizada via RPC.
create table if not exists public.card_invoice_payments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  competencia text not null, -- formato 'YYYY-MM'
  amount numeric(14,2) not null,
  paid_at timestamptz not null default now(),
  payment_transaction_id uuid references public.transactions (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (card_id, competencia)
);

create index if not exists idx_card_invoice_payments_card on public.card_invoice_payments (card_id);

-- The `invites` table only ever holds short-lived, disposable pairing
-- codes (never real user data), so instead of chasing missing columns one
-- at a time on installs that had an older/divergent version of this table,
-- we just drop and recreate it fresh here. CASCADE removes any old
-- policies/indexes tied to it — both get recreated further below anyway.
drop table if exists public.invites cascade;
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.shared_accounts (id) on delete cascade,
  code text not null unique,
  created_by uuid references public.profiles (id) on delete set null,
  email text,
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Calcula a competência (mês 'YYYY-MM') de fatura a que uma compra
-- pertence: se o dia da compra é até o fechamento, ela entra na fatura
-- que fecha NESTE mês; se é depois do fechamento, ela "vira o mês" e entra
-- na fatura seguinte. Usada tanto pelas queries do app quanto por
-- pay_card_invoice() abaixo, então fica centralizada aqui.
create or replace function public.invoice_competencia(p_date date, p_closing_day integer)
returns text
language sql
immutable
as $$
  select to_char(
    date_trunc('month', p_date)
      + (case when extract(day from p_date) <= p_closing_day then 0 else 1 end) * interval '1 month',
    'YYYY-MM'
  );
$$;

create index if not exists idx_profiles_shared_account on public.profiles (shared_account_id);
create index if not exists idx_categories_account on public.categories (account_id);
create index if not exists idx_transactions_account on public.transactions (account_id);
create index if not exists idx_transactions_account_date on public.transactions (account_id, date desc);
create index if not exists idx_invites_code on public.invites (code);
create index if not exists idx_invites_account on public.invites (account_id);

-- ---------------------------------------------------------------------------
-- 2. AUTO-CREATE PROFILE ON SIGN-UP
-- Supabase Auth stores users in auth.users; we mirror a row into
-- public.profiles automatically so the app always has one to read/update.
-- ---------------------------------------------------------------------------

drop function if exists public.handle_new_user() cascade;
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. HELPER FUNCTION
-- Returns the caller's shared_account_id. Marked SECURITY DEFINER so it
-- bypasses RLS when it reads public.profiles — this is what lets us write
-- non-recursive policies below (a policy on `profiles` that queried
-- `profiles` directly would recurse infinitely).
-- ---------------------------------------------------------------------------

-- CASCADE here also drops any RLS policies from a previous run that
-- reference this function (they all get recreated further below anyway).
drop function if exists public.get_my_account_id() cascade;
create or replace function public.get_my_account_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select active_account_id from public.profiles where id = auth.uid();
$$;

-- Verifica se o usuário logado é membro de um orçamento específico
-- (não necessariamente o ativo — usado para listar orçamentos e checar
-- permissão antes de trocar/sair de um deles).
drop function if exists public.is_account_member(uuid) cascade;
create or replace function public.is_account_member(p_account_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.account_members
    where account_id = p_account_id and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- Every table is scoped to "rows belonging to MY shared account". No user
-- can read or write another couple's data under any circumstance.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.shared_accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.invites enable row level security;
alter table public.account_members enable row level security;
alter table public.cards enable row level security;
alter table public.card_invoice_payments enable row level security;

-- profiles: see your own row, and anyone who shares ANY orçamento with you
-- (not just the active one) — never anyone else's.
drop policy if exists "profiles_select_self_and_partner" on public.profiles;
create policy "profiles_select_self_and_partner"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or id in (
      select am2.user_id
      from public.account_members am1
      join public.account_members am2 on am2.account_id = am1.account_id
      where am1.user_id = auth.uid()
    )
  );

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- shared_accounts: visible to any member (regardless of which one is
-- currently active). Created/joined only via RPC below.
drop policy if exists "shared_accounts_select_member" on public.shared_accounts;
create policy "shared_accounts_select_member"
  on public.shared_accounts for select
  to authenticated
  using (public.is_account_member(id));

-- account_members: visible to fellow members of that same account. No
-- direct insert/update/delete — only via SECURITY DEFINER RPCs below.
drop policy if exists "account_members_select" on public.account_members;
create policy "account_members_select"
  on public.account_members for select
  to authenticated
  using (public.is_account_member(account_id));

-- categories: strictly scoped to the caller's own shared account.
drop policy if exists "categories_select_member" on public.categories;
create policy "categories_select_member"
  on public.categories for select
  to authenticated
  using (account_id = public.get_my_account_id());

drop policy if exists "categories_insert_member" on public.categories;
create policy "categories_insert_member"
  on public.categories for insert
  to authenticated
  with check (account_id = public.get_my_account_id());

drop policy if exists "categories_update_member" on public.categories;
create policy "categories_update_member"
  on public.categories for update
  to authenticated
  using (account_id = public.get_my_account_id())
  with check (account_id = public.get_my_account_id());

drop policy if exists "categories_delete_member" on public.categories;
create policy "categories_delete_member"
  on public.categories for delete
  to authenticated
  using (account_id = public.get_my_account_id());

-- transactions: strictly scoped to the caller's own shared account.
-- Both partners may edit/delete ANY transaction in the account (per spec),
-- but may only ever create a transaction attributed to themselves.
drop policy if exists "transactions_select_member" on public.transactions;
create policy "transactions_select_member"
  on public.transactions for select
  to authenticated
  using (account_id = public.get_my_account_id());

drop policy if exists "transactions_insert_member" on public.transactions;
create policy "transactions_insert_member"
  on public.transactions for insert
  to authenticated
  with check (
    account_id = public.get_my_account_id()
    and user_id = auth.uid()
  );

drop policy if exists "transactions_update_member" on public.transactions;
create policy "transactions_update_member"
  on public.transactions for update
  to authenticated
  using (account_id = public.get_my_account_id())
  with check (account_id = public.get_my_account_id());

drop policy if exists "transactions_delete_member" on public.transactions;
create policy "transactions_delete_member"
  on public.transactions for delete
  to authenticated
  using (account_id = public.get_my_account_id());

-- cards: strictly scoped to the caller's own shared account.
drop policy if exists "cards_select_member" on public.cards;
create policy "cards_select_member"
  on public.cards for select
  to authenticated
  using (account_id = public.get_my_account_id());

drop policy if exists "cards_insert_member" on public.cards;
create policy "cards_insert_member"
  on public.cards for insert
  to authenticated
  with check (account_id = public.get_my_account_id());

drop policy if exists "cards_update_member" on public.cards;
create policy "cards_update_member"
  on public.cards for update
  to authenticated
  using (account_id = public.get_my_account_id())
  with check (account_id = public.get_my_account_id());

drop policy if exists "cards_delete_member" on public.cards;
create policy "cards_delete_member"
  on public.cards for delete
  to authenticated
  using (account_id = public.get_my_account_id());

-- card_invoice_payments: só leitura direta (scoped via join com cards do
-- meu orçamento); toda escrita passa pela RPC pay_card_invoice() abaixo.
drop policy if exists "card_invoice_payments_select_member" on public.card_invoice_payments;
create policy "card_invoice_payments_select_member"
  on public.card_invoice_payments for select
  to authenticated
  using (
    card_id in (
      select id from public.cards where account_id = public.get_my_account_id()
    )
  );

-- invites: visible to the account they belong to (so either partner can see
-- an outstanding code) and to whoever created them. Never created/redeemed
-- directly by the client — only through the RPC functions below.
drop policy if exists "invites_select_member_or_owner" on public.invites;
create policy "invites_select_member_or_owner"
  on public.invites for select
  to authenticated
  using (
    account_id = public.get_my_account_id()
    or created_by = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- 5. LOCK DOWN DIRECT TABLE ACCESS
-- Supabase grants broad default privileges to `anon`/`authenticated` on new
-- tables. RLS controls *which rows*; these grants control *which operations
-- and columns* are reachable from the client at all — defense in depth.
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.shared_accounts, public.categories,
  public.transactions, public.invites, public.account_members, public.cards,
  public.card_invoice_payments from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
-- Note: shared_account_id can NEVER be updated directly by the client, only
-- through create_shared_account() / accept_invite() below. This is what
-- stops someone from hijacking their way into another couple's account.

grant select on public.shared_accounts to authenticated;
-- no insert/update/delete: accounts are only created via create_shared_account()

grant select, insert, update, delete on public.categories to authenticated;

grant select, insert, update, delete on public.transactions to authenticated;

grant select, insert, update, delete on public.cards to authenticated;

grant select on public.card_invoice_payments to authenticated;
-- no insert/update/delete: faturas só são marcadas como pagas via
-- pay_card_invoice() abaixo, nunca por escrita direta do cliente.

grant select on public.invites to authenticated;
-- no insert/update/delete: invites are only created/redeemed via RPC below

grant select on public.account_members to authenticated;
-- no insert/update/delete: membership only changes via RPC below

-- ---------------------------------------------------------------------------
-- 6. RPC FUNCTIONS
-- SECURITY DEFINER so they can perform the multi-table writes the client
-- isn't allowed to do directly, but every function independently re-checks
-- auth.uid() and ownership before touching anything.
-- ---------------------------------------------------------------------------

-- Creates a brand new shared account for the caller and seeds default categories.
drop function if exists public.create_shared_account(text, numeric) cascade;
create or replace function public.create_shared_account(
  p_name text,
  p_initial_balance numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Você precisa estar autenticado(a).';
  end if;

  -- Um usuário pode ter vários orçamentos ao mesmo tempo, então não
  -- bloqueamos mais por já pertencer a outro — só criamos este e o
  -- deixamos ativo.
  insert into public.shared_accounts (name, initial_balance, created_by)
  values (p_name, coalesce(p_initial_balance, 0), v_uid)
  returning id into v_account_id;

  insert into public.account_members (account_id, user_id)
  values (v_account_id, v_uid);

  update public.profiles set active_account_id = v_account_id where id = v_uid;

  insert into public.categories (account_id, name, type, color, is_default) values
    (v_account_id, 'Alimentação', 'expense', '#f97316', true),
    (v_account_id, 'Transporte',  'expense', '#3b82f6', true),
    (v_account_id, 'Moradia',     'expense', '#8b5cf6', true),
    (v_account_id, 'Saúde',       'expense', '#ef4444', true),
    (v_account_id, 'Lazer',       'expense', '#ec4899', true),
    (v_account_id, 'Compras',     'expense', '#eab308', true),
    (v_account_id, 'Salário',     'income',  '#16a34a', true),
    (v_account_id, 'Outros',      'both',    '#64748b', true);

  return v_account_id;
end;
$$;

-- Generates a one-time invite code for the caller's shared account.
drop function if exists public.create_invite(text) cascade;
create or replace function public.create_invite(p_email text default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_account_id uuid;
  v_code text;
  v_expires timestamptz := now() + interval '7 days';
  v_member_count int;
begin
  if v_uid is null then
    raise exception 'Você precisa estar autenticado(a).';
  end if;

  v_account_id := public.get_my_account_id();
  if v_account_id is null then
    raise exception 'Você precisa pertencer a um orçamento compartilhado primeiro.';
  end if;

  select count(*) into v_member_count
  from public.account_members where account_id = v_account_id;

  if v_member_count >= 2 then
    raise exception 'Este orçamento já tem dois membros.';
  end if;

  -- invalidate previous unused invites for this account so old codes die
  update public.invites
    set expires_at = now()
    where account_id = v_account_id and used_at is null and expires_at > now();

  v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  insert into public.invites (account_id, code, created_by, email, expires_at)
  values (v_account_id, v_code, v_uid, nullif(trim(p_email), ''), v_expires);

  return json_build_object('code', v_code, 'expires_at', v_expires);
end;
$$;

-- Redeems an invite code and joins the caller to that shared account.
drop function if exists public.accept_invite(text) cascade;
create or replace function public.accept_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.invites%rowtype;
  v_member_count int;
begin
  if v_uid is null then
    raise exception 'Você precisa estar autenticado(a).';
  end if;

  select * into v_invite
  from public.invites
  where code = upper(trim(p_code))
    and used_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Código de convite inválido ou expirado.';
  end if;

  if v_invite.created_by = v_uid then
    raise exception 'Você não pode usar seu próprio código de convite.';
  end if;

  -- Um usuário pode ter vários orçamentos ao mesmo tempo, então só
  -- bloqueamos entrar duas vezes no MESMO orçamento, não em pertencer a
  -- outros.
  if exists (
    select 1 from public.account_members
    where account_id = v_invite.account_id and user_id = v_uid
  ) then
    raise exception 'Você já faz parte deste orçamento.';
  end if;

  select count(*) into v_member_count
  from public.account_members where account_id = v_invite.account_id;

  if v_member_count >= 2 then
    raise exception 'Este orçamento já tem dois membros.';
  end if;

  insert into public.account_members (account_id, user_id)
  values (v_invite.account_id, v_uid);

  update public.profiles set active_account_id = v_invite.account_id where id = v_uid;

  update public.invites
    set used_by = v_uid, used_at = now()
    where id = v_invite.id;

  return v_invite.account_id;
end;
$$;

-- Switches which of the caller's accounts is "active" (the one shown on
-- dashboard/transactions). Purely a view change — never removes any
-- membership, always reversible.
drop function if exists public.switch_active_account(uuid) cascade;
create or replace function public.switch_active_account(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Você precisa estar autenticado(a).';
  end if;

  if not exists (
    select 1 from public.account_members
    where account_id = p_account_id and user_id = v_uid
  ) then
    raise exception 'Você não faz parte deste orçamento.';
  end if;

  update public.profiles set active_account_id = p_account_id where id = v_uid;
end;
$$;

-- Lists every account the caller belongs to, flagging which is active —
-- powers the account switcher in the UI.
drop function if exists public.get_my_accounts() cascade;
create or replace function public.get_my_accounts()
returns table (
  id uuid,
  name text,
  initial_balance numeric,
  created_by uuid,
  created_at timestamptz,
  is_active boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select sa.id, sa.name, sa.initial_balance, sa.created_by, sa.created_at,
         (sa.id = p.active_account_id) as is_active
  from public.shared_accounts sa
  join public.account_members am on am.account_id = sa.id
  join public.profiles p on p.id = auth.uid()
  where am.user_id = auth.uid()
  order by sa.created_at asc;
$$;

-- Lets the caller permanently leave ONE specific shared account (removes
-- their membership row). Since a user can belong to several accounts at
-- once, this only affects that one — any other accounts they're a member
-- of are untouched. If the account they left was the active one, another
-- account they still belong to (if any) automatically becomes active;
-- otherwise they land back on /onboarding. If the caller was the
-- account's creator and someone else is still in it, admin rights
-- (shared_accounts.created_by) are handed off to that remaining member.
-- The abandoned account itself, and any categories/transactions in it,
-- are kept as-is — never deleted — so nobody loses their transaction
-- history by leaving.
drop function if exists public.leave_shared_account_permanently(uuid) cascade;
create or replace function public.leave_shared_account_permanently(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_creator uuid;
  v_remaining uuid;
  v_was_active boolean;
  v_next_account uuid;
begin
  if v_uid is null then
    raise exception 'Você precisa estar autenticado(a).';
  end if;

  if not exists (
    select 1 from public.account_members
    where account_id = p_account_id and user_id = v_uid
  ) then
    raise exception 'Você não faz parte deste orçamento.';
  end if;

  delete from public.account_members
  where account_id = p_account_id and user_id = v_uid;

  select created_by into v_creator from public.shared_accounts where id = p_account_id;
  if v_creator = v_uid then
    select user_id into v_remaining
    from public.account_members
    where account_id = p_account_id
    limit 1;

    update public.shared_accounts set created_by = v_remaining where id = p_account_id;
  end if;

  select (active_account_id = p_account_id) into v_was_active
  from public.profiles where id = v_uid;

  if v_was_active then
    select account_id into v_next_account
    from public.account_members
    where user_id = v_uid
    order by joined_at desc
    limit 1;

    update public.profiles set active_account_id = v_next_account where id = v_uid;
  end if;
end;
$$;

-- Lets the account's creator remove their partner from the shared
-- account. Only the original creator (shared_accounts.created_by) may
-- call this, and only to remove someone else — use
-- leave_shared_account_permanently to remove yourself. The removed
-- partner keeps their transaction history; it just stops being reachable
-- once they're no longer a member (same "kept, not deleted" rule as
-- leaving).
drop function if exists public.remove_partner(uuid) cascade;
create or replace function public.remove_partner(p_partner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_account_id uuid;
  v_creator uuid;
  v_partner_active uuid;
  v_next_account uuid;
begin
  if v_uid is null then
    raise exception 'Você precisa estar autenticado(a).';
  end if;

  if p_partner_id = v_uid then
    raise exception 'Use a opção "Sair definitivamente" para remover a si mesmo(a).';
  end if;

  v_account_id := public.get_my_account_id();
  if v_account_id is null then
    raise exception 'Você não pertence a nenhum orçamento compartilhado.';
  end if;

  select created_by into v_creator
  from public.shared_accounts where id = v_account_id;

  if v_creator is null or v_creator <> v_uid then
    raise exception 'Só quem criou o orçamento pode remover o parceiro(a).';
  end if;

  if not exists (
    select 1 from public.account_members
    where account_id = v_account_id and user_id = p_partner_id
  ) then
    raise exception 'Essa pessoa não faz parte do seu orçamento.';
  end if;

  delete from public.account_members
  where account_id = v_account_id and user_id = p_partner_id;

  select active_account_id into v_partner_active
  from public.profiles where id = p_partner_id;

  if v_partner_active = v_account_id then
    select account_id into v_next_account
    from public.account_members
    where user_id = p_partner_id
    order by joined_at desc
    limit 1;

    update public.profiles set active_account_id = v_next_account where id = p_partner_id;
  end if;
end;
$$;

-- Paga a fatura de um cartão para uma competência ('YYYY-MM'): soma todas
-- as compras daquele cartão que caem nessa competência, gera UMA transação
-- de despesa (is_invoice_payment = true, card_id = null) no valor da
-- DIFERENÇA ainda não paga — essa é a única coisa que efetivamente sai do
-- saldo em conta — e atualiza (upsert) o registro da competência em
-- card_invoice_payments. As compras individuais do cartão nunca são
-- alteradas; elas continuam existindo só para compor o histórico e o total
-- da fatura.
--
-- IMPORTANTE: pagar uma fatura NÃO bloqueia novos lançamentos na mesma
-- competência. Se, depois de paga, entrarem novas compras que ainda caem
-- nesse mesmo ciclo (data <= dia de fechamento), elas formam uma NOVA
-- fatura em aberto (o valor excedente/"top-up") — e podem ser pagas de
-- novo, o que gera apenas a diferença como débito e atualiza o valor total
-- já pago daquela competência. Antes essa diferença era simplesmente
-- ignorada (a competência já constava como "paga" e qualquer transação
-- dali era descartada do cálculo), fazendo os novos lançamentos somem sem
-- nunca contar em fatura nenhuma — esse é o bug corrigido aqui.
drop function if exists public.pay_card_invoice(uuid, text) cascade;
drop function if exists public.pay_card_invoice(uuid, text, date) cascade;

create or replace function public.pay_card_invoice(
  p_card_id uuid,
  p_competencia text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.pay_card_invoice(p_card_id, p_competencia, current_date, true);
end;
$$;

create or replace function public.pay_card_invoice(
  p_card_id uuid,
  p_competencia text,
  p_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.pay_card_invoice(p_card_id, p_competencia, p_date, true);
end;
$$;

-- p_affects_balance: true (padrão) gera a saída normalmente, descontando
-- do saldo em conta. false marca a fatura como paga e registra a transação
-- do mesmo jeito (para aparecer no histórico e não contar de novo como
-- gasto por categoria), mas ela NÃO desconta do saldo — para quando o
-- pagamento foi feito com dinheiro que não passou pela conta compartilhada.
create or replace function public.pay_card_invoice(
  p_card_id uuid,
  p_competencia text,
  p_date date,
  p_affects_balance boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_account_id uuid;
  v_card public.cards%rowtype;
  v_already_paid numeric(14,2);
  v_total numeric(14,2);
  v_delta numeric(14,2);
  v_tx_id uuid;
begin
  if v_uid is null then
    raise exception 'Você precisa estar autenticado(a).';
  end if;

  v_account_id := public.get_my_account_id();
  if v_account_id is null then
    raise exception 'Você precisa pertencer a um orçamento compartilhado primeiro.';
  end if;

  select * into v_card from public.cards where id = p_card_id;
  if not found or v_card.account_id <> v_account_id then
    raise exception 'Cartão não encontrado.';
  end if;

  if p_competencia !~ '^\d{4}-\d{2}$' then
    raise exception 'Competência inválida.';
  end if;

  -- Quanto já foi pago anteriormente nessa competência (0 se for a
  -- primeira vez que essa fatura é paga).
  select amount into v_already_paid
  from public.card_invoice_payments
  where card_id = p_card_id and competencia = p_competencia;
  v_already_paid := coalesce(v_already_paid, 0);

  -- Total atual de todas as compras dessa competência, incluindo
  -- lançamentos criados depois do último pagamento.
  select coalesce(sum(amount), 0) into v_total
  from public.transactions
  where card_id = p_card_id
    and public.invoice_competencia(date, v_card.closing_day) = p_competencia;

  if v_total <= 0 then
    raise exception 'Não há gastos nessa fatura.';
  end if;

  v_delta := v_total - v_already_paid;
  if v_delta <= 0 then
    raise exception 'Esta fatura já foi paga.';
  end if;

  insert into public.transactions (
    account_id, user_id, type, amount, category_id, description, note, date,
    card_id, is_invoice_payment, affects_balance
  )
  values (
    v_account_id, v_uid, 'expense', v_delta, null,
    'Fatura ' || v_card.name || ' (' || p_competencia || ')', null, p_date,
    null, true, coalesce(p_affects_balance, true)
  )
  returning id into v_tx_id;

  insert into public.card_invoice_payments (card_id, competencia, amount, payment_transaction_id, paid_at)
  values (p_card_id, p_competencia, v_total, v_tx_id, now())
  on conflict (card_id, competencia)
  do update set
    amount = v_total,
    payment_transaction_id = v_tx_id,
    paid_at = now();

  return v_tx_id;
end;
$$;

-- Only signed-in users may call these — never anon.
revoke execute on function public.create_shared_account(text, numeric) from public, anon;
revoke execute on function public.create_invite(text) from public, anon;
revoke execute on function public.accept_invite(text) from public, anon;
revoke execute on function public.switch_active_account(uuid) from public, anon;
revoke execute on function public.leave_shared_account_permanently(uuid) from public, anon;
revoke execute on function public.remove_partner(uuid) from public, anon;
revoke execute on function public.get_my_accounts() from public, anon;
revoke execute on function public.pay_card_invoice(uuid, text) from public, anon;
revoke execute on function public.pay_card_invoice(uuid, text, date) from public, anon;
revoke execute on function public.pay_card_invoice(uuid, text, date, boolean) from public, anon;

grant execute on function public.create_shared_account(text, numeric) to authenticated;
grant execute on function public.create_invite(text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.switch_active_account(uuid) to authenticated;
grant execute on function public.leave_shared_account_permanently(uuid) to authenticated;
grant execute on function public.remove_partner(uuid) to authenticated;
grant execute on function public.get_my_accounts() to authenticated;
grant execute on function public.pay_card_invoice(uuid, text) to authenticated;
grant execute on function public.pay_card_invoice(uuid, text, date) to authenticated;
grant execute on function public.pay_card_invoice(uuid, text, date, boolean) to authenticated;

-- ============================================================================
-- Done. Next steps:
-- 1. Copy your Project URL and anon key (Project Settings > API) into
--    NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
-- 2. In Authentication > URL Configuration, make sure your site URL / redirect
--    URLs include your local dev URL and your Vercel deployment URL.
-- 3. Run `pnpm install && pnpm dev` locally to confirm sign-up, onboarding,
--    and the invite flow all work end to end before deploying.
-- ============================================================================
