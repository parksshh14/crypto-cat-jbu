-- QR 티켓 취소 기능 추가용 SQL
-- Supabase Dashboard > SQL Editor에서 전체 실행하세요.
alter table public.tickets add column if not exists cancelled_at timestamptz;

create or replace function public.cancel_ticket(p_ticket_id uuid)
returns table(status text)
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then
    return query select 'forbidden'::text; return;
  end if;
  update public.tickets
     set cancelled_at = now()
   where id = p_ticket_id
     and user_id = auth.uid()
     and used_at is null
     and cancelled_at is null
     and expires_at > now()
   returning id into v_id;
  if v_id is not null then
    return query select 'cancelled'::text;
  else
    return query select 'not_cancellable'::text;
  end if;
end;
$$;
revoke all on function public.cancel_ticket(uuid) from public;
grant execute on function public.cancel_ticket(uuid) to authenticated;
