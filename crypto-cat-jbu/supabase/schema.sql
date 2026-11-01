-- Supabase SQL Editor에서 전체 실행하세요.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'attendee' check (role in ('attendee','validator')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id,email,role) values(new.id,new.email,'attendee')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists "read own tickets" on public.tickets;
create policy "read own tickets" on public.tickets for select to authenticated using (user_id = auth.uid());

create or replace function public.issue_ticket()
returns table(ticket_id uuid, token text, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions
as $$
declare v_token text; v_id uuid; v_exp timestamptz;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_exp := now() + interval '1 minute';
  insert into public.tickets(user_id,token_hash,expires_at)
  values(auth.uid(), encode(digest(convert_to(v_token,'UTF8'),'sha256'),'hex'),v_exp)
  returning id into v_id;
  return query select v_id,v_token,v_exp;
end;
$$;

create or replace function public.verify_ticket(p_token text)
returns table(status text)
language plpgsql security definer set search_path = public, extensions
as $$
declare v_hash text; v_role text; v_id uuid; v_exp timestamptz; v_used timestamptz;
begin
  if auth.uid() is null then return query select 'forbidden'::text; return; end if;
  select role into v_role from public.profiles where id=auth.uid();
  if v_role is distinct from 'validator' then return query select 'forbidden'::text; return; end if;
  v_hash := encode(digest(convert_to(coalesce(p_token,''),'UTF8'),'sha256'),'hex');
  update public.tickets t set used_at=now()
    where t.token_hash=v_hash and t.used_at is null and t.expires_at>now()
    returning t.id into v_id;
  if v_id is not null then return query select 'valid'::text; return; end if;
  select t.expires_at,t.used_at into v_exp,v_used from public.tickets t where t.token_hash=v_hash;
  if not found then return query select 'invalid'::text;
  elsif v_used is not null then return query select 'already_used'::text;
  elsif v_exp <= now() then return query select 'expired'::text;
  else return query select 'invalid'::text;
  end if;
end;
$$;

revoke all on function public.issue_ticket() from public;
revoke all on function public.verify_ticket(text) from public;
grant execute on function public.issue_ticket() to authenticated;
grant execute on function public.verify_ticket(text) to authenticated;
grant select on public.tickets, public.profiles to authenticated;
