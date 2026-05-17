alter table public.incomes
add column if not exists updated_at timestamptz not null default now();

alter table public.expenses
add column if not exists updated_at timestamptz not null default now();

alter table public.goals
add column if not exists updated_at timestamptz not null default now();

alter table public.monthly_configs
add column if not exists updated_at timestamptz not null default now();

alter table public.monthly_closes
add column if not exists updated_at timestamptz not null default now();

alter table public.month_states
add column if not exists updated_at timestamptz not null default now();

alter table public.app_settings
add column if not exists updated_at timestamptz not null default now();

alter table public.incomes replica identity full;
alter table public.expenses replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.monthly_configs'::regclass
      and contype in ('p', 'u')
      and conkey = array[
        (select attnum from pg_attribute where attrelid = 'public.monthly_configs'::regclass and attname = 'household_id'),
        (select attnum from pg_attribute where attrelid = 'public.monthly_configs'::regclass and attname = 'month')
      ]::smallint[]
  ) then
    alter table public.monthly_configs add constraint monthly_configs_household_month_key unique (household_id, month);
  end if;
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.monthly_closes'::regclass
      and contype in ('p', 'u')
      and conkey = array[
        (select attnum from pg_attribute where attrelid = 'public.monthly_closes'::regclass and attname = 'household_id'),
        (select attnum from pg_attribute where attrelid = 'public.monthly_closes'::regclass and attname = 'month')
      ]::smallint[]
  ) then
    alter table public.monthly_closes add constraint monthly_closes_household_month_key unique (household_id, month);
  end if;
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.month_states'::regclass
      and contype in ('p', 'u')
      and conkey = array[
        (select attnum from pg_attribute where attrelid = 'public.month_states'::regclass and attname = 'household_id'),
        (select attnum from pg_attribute where attrelid = 'public.month_states'::regclass and attname = 'month')
      ]::smallint[]
  ) then
    alter table public.month_states add constraint month_states_household_month_key unique (household_id, month);
  end if;
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.app_settings'::regclass
      and contype in ('p', 'u')
      and conkey = array[
        (select attnum from pg_attribute where attrelid = 'public.app_settings'::regclass and attname = 'household_id')
      ]::smallint[]
  ) then
    alter table public.app_settings add constraint app_settings_household_id_key unique (household_id);
  end if;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_incomes_updated_at on public.incomes;
create trigger touch_incomes_updated_at
before update on public.incomes
for each row execute function public.touch_updated_at();

drop trigger if exists touch_expenses_updated_at on public.expenses;
create trigger touch_expenses_updated_at
before update on public.expenses
for each row execute function public.touch_updated_at();

drop trigger if exists touch_goals_updated_at on public.goals;
create trigger touch_goals_updated_at
before update on public.goals
for each row execute function public.touch_updated_at();

drop trigger if exists touch_monthly_configs_updated_at on public.monthly_configs;
create trigger touch_monthly_configs_updated_at
before update on public.monthly_configs
for each row execute function public.touch_updated_at();

drop trigger if exists touch_monthly_closes_updated_at on public.monthly_closes;
create trigger touch_monthly_closes_updated_at
before update on public.monthly_closes
for each row execute function public.touch_updated_at();

drop trigger if exists touch_month_states_updated_at on public.month_states;
create trigger touch_month_states_updated_at
before update on public.month_states
for each row execute function public.touch_updated_at();

drop trigger if exists touch_app_settings_updated_at on public.app_settings;
create trigger touch_app_settings_updated_at
before update on public.app_settings
for each row execute function public.touch_updated_at();
