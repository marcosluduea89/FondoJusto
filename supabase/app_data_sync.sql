create table if not exists public.household_people (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  person_id text not null,
  name text not null,
  updated_at timestamptz not null default now(),
  unique (household_id, person_id)
);

alter table public.household_people enable row level security;

drop policy if exists "Members can manage household people" on public.household_people;
create policy "Members can manage household people"
on public.household_people
for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

alter table public.reimbursements
add column if not exists original_expense_id text,
add column if not exists person_id text,
add column if not exists source_month text,
add column if not exists target_month text,
add column if not exists applied_month text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'incomes_household_local_id_key') then
    alter table public.incomes add constraint incomes_household_local_id_key unique (household_id, local_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'expenses_household_local_id_key') then
    alter table public.expenses add constraint expenses_household_local_id_key unique (household_id, local_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reimbursements_household_local_id_key') then
    alter table public.reimbursements add constraint reimbursements_household_local_id_key unique (household_id, local_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'goals_household_local_id_key') then
    alter table public.goals add constraint goals_household_local_id_key unique (household_id, local_id);
  end if;
end;
$$;

drop policy if exists "Members can manage household invites" on public.household_invites;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_household_people_updated_at on public.household_people;
create trigger touch_household_people_updated_at
before update on public.household_people
for each row execute function public.touch_updated_at();

do $$
declare
  sync_table text;
begin
  foreach sync_table in array array[
    'household_people',
    'incomes',
    'expenses',
    'reimbursements',
    'goals',
    'monthly_configs',
    'monthly_closes',
    'month_states',
    'app_settings'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = sync_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', sync_table);
    end if;
  end loop;
end;
$$;
