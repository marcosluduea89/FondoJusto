create table if not exists public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

alter table public.household_invites enable row level security;

drop policy if exists "Members can read household invites" on public.household_invites;
create policy "Members can read household invites"
on public.household_invites
for select
to authenticated
using (public.is_household_member(household_id));

drop policy if exists "Members can create household invites" on public.household_invites;
create policy "Members can create household invites"
on public.household_invites
for insert
to authenticated
with check (
  public.is_household_member(household_id)
  and created_by = auth.uid()
);

create or replace function public.join_household(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invite public.household_invites;
begin
  if auth.uid() is null then
    raise exception 'Usuario no autenticado';
  end if;

  select *
  into target_invite
  from public.household_invites
  where upper(code) = upper(trim(invite_code))
    and used_at is null
    and expires_at > now()
  limit 1;

  if target_invite.id is null then
    raise exception 'Codigo invalido o vencido';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (target_invite.household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  insert into public.profiles (id, display_name)
  values (auth.uid(), auth.email())
  on conflict (id) do update set display_name = excluded.display_name;

  update public.household_invites
  set used_by = auth.uid(),
      used_at = now()
  where id = target_invite.id
    and used_at is null;

  return target_invite.household_id;
end;
$$;

revoke all on function public.join_household(text) from public;
grant execute on function public.join_household(text) to authenticated;
