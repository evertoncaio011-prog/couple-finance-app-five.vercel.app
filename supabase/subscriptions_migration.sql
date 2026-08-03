-- ============================================================================
-- Assinaturas (Stripe) — execute este script no SQL Editor do Supabase.
-- Uma assinatura por orçamento (shared_accounts), não por usuário — o
-- casal inteiro fica premium junto quando um dos dois assina.
-- ============================================================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.shared_accounts (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  -- Espelha o status da assinatura no Stripe: 'trialing', 'active',
  -- 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid'.
  -- Null = nunca assinou (plano grátis).
  status text,
  plan text not null default 'premium',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_status on public.subscriptions (status);

alter table public.subscriptions enable row level security;

-- Membros do orçamento podem VER o status da própria assinatura (pra
-- mostrar "Premium ativo" nas Configurações), mas não podem criar, editar
-- ou apagar linha nenhuma por conta própria — isso só acontece via
-- webhook do Stripe, que usa a service_role key (contorna RLS de
-- propósito) depois de validar a assinatura de verdade com o Stripe.
drop policy if exists "subscriptions_select_member" on public.subscriptions;
create policy "subscriptions_select_member"
  on public.subscriptions for select
  to authenticated
  using (account_id = public.get_my_account_id());

revoke insert, update, delete on public.subscriptions from authenticated;
revoke all on public.subscriptions from anon;
grant select on public.subscriptions to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();
