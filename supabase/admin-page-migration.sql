-- QR TICKET 관리자 페이지 설정
-- 먼저 관리자 아이디로 일반 회원가입을 완료한 뒤 아래 승격 SQL에서 아이디를 바꿔 실행하세요.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('attendee','validator','admin'));
alter table public.tickets add column if not exists cancelled_at timestamptz;

create or replace function public.admin_get_dashboard()
returns jsonb language plpgsql security definer set search_path=public
as $$
declare v_role text; v_result jsonb;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  select role into v_role from public.profiles where id=auth.uid();
  if v_role is distinct from 'admin' then raise exception '관리자 권한이 없습니다.'; end if;
  select jsonb_build_object(
    'users', coalesce((select jsonb_agg(jsonb_build_object('email',p.email,'role',p.role,'created_at',p.created_at) order by p.created_at desc) from public.profiles p), '[]'::jsonb),
    'tickets', coalesce((select jsonb_agg(jsonb_build_object('email',p.email,'issued_at',t.issued_at,'expires_at',t.expires_at,'used_at',t.used_at,'cancelled_at',t.cancelled_at) order by t.issued_at desc) from public.tickets t left join public.profiles p on p.id=t.user_id), '[]'::jsonb)
  ) into v_result;
  return v_result;
end; $$;
revoke all on function public.admin_get_dashboard() from public;
grant execute on function public.admin_get_dashboard() to authenticated;

-- 아래에서 '관리자아이디'를 실제 가입한 아이디로 변경한 뒤 별도로 실행하세요.
-- update public.profiles set role='admin'
-- where email = lower('관리자아이디') || '@users.crypto-cat-jbu.com';
