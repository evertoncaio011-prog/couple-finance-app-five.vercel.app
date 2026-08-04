-- ============================================================================
-- Metas (goals) — execute este script no SQL Editor do Supabase.
-- Sistema simples: criar, editar, excluir meta e adicionar valor a ela.
-- Progresso, percentual e "quanto falta" são calculados no app (não aqui).
-- ============================================================================

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.shared_accounts (id) on delete cascade,
  name text not null,
  description text,
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  color text not null default '#0ea5e9',
  contributions jsonb not null default '{}'::jsonb,
  -- Preenchido automaticamente quando current_amount atinge target_amount
  -- (ver addGoalAmount/updateGoal em app/actions.ts). Null = ainda em aberto.
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Caso a tabela já exista de uma execução anterior deste script (sem a
-- coluna description), esta linha adiciona a coluna sem apagar nada.
alter table public.goals add column if not exists description text;
alter table public.goals add column if not exists contributions jsonb not null default '{}'::jsonb;

-- Quanto do current_amount foi adicionado com "não descontar do saldo"
-- marcado (ver addGoalAmount em app/actions.ts). current_amount continua
-- representando o progresso total da meta; excluded_amount é só a parte
-- dele que não deve contar como "reservado" ao calcular o saldo
-- disponível (ver sumGoalsReserved/computeUserGoalReservation).
alter table public.goals add column if not exists excluded_amount numeric(14,2) not null default 0;

create index if not exists idx_goals_account on public.goals (account_id);

alter table public.goals enable row level security;

drop policy if exists "goals_select_member" on public.goals;
create policy "goals_select_member"
  on public.goals for select
  to authenticated
  using (account_id = public.get_my_account_id());

drop policy if exists "goals_insert_member" on public.goals;
create policy "goals_insert_member"
  on public.goals for insert
  to authenticated
  with check (account_id = public.get_my_account_id());

drop policy if exists "goals_update_member" on public.goals;
create policy "goals_update_member"
  on public.goals for update
  to authenticated
  using (account_id = public.get_my_account_id())
  with check (account_id = public.get_my_account_id());

drop policy if exists "goals_delete_member" on public.goals;
create policy "goals_delete_member"
  on public.goals for delete
  to authenticated
  using (account_id = public.get_my_account_id());

-- Defesa em profundidade, no mesmo padrão do resto do schema.
revoke all on public.goals from anon;
grant select, insert, update, delete on public.goals to authenticated;
