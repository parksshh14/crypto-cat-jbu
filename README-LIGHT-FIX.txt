crypto-cat-jbu — 아이디 로그인 오류 및 라이트 테마 수정

이 ZIP은 기존 프로젝트 파일을 교체하기 위한 패치입니다. Supabase 스키마나 기존 설정 파일은 교체하지 않습니다.

GitHub 저장소 crypto-cat-jbu에서 아래 파일을 같은 경로에 덮어쓰고 Commit changes를 눌러 주세요.
- public/index.html
- public/styles.css
- public/ticket.js
- public/validator.html
- public/validator.js

public/supabase-config.js는 기존 파일을 그대로 유지하세요.
Vercel 배포가 완료된 뒤 모바일 브라우저에서 페이지를 새로고침하세요. 캐시가 남으면 강력 새로고침하거나 시크릿 창에서 확인해 주세요.

아이디 로그인:
- 아이디는 영문 소문자, 숫자, _ 또는 - 3~24자
- 비밀번호는 6자 이상
- 코드는 아이디를 `아이디@users.crypto-cat-jbu.com` 형식의 로그인 별칭으로 변환합니다.
- Supabase Authentication > Sign In / Providers > Email에서 Confirm email을 꺼야 테스트 회원가입 후 즉시 로그인 세션이 생성됩니다.
- 이 방식은 실제 이메일 인증이나 비밀번호 재설정을 지원하지 않는 프로토타입용 로그인입니다.

검표원 계정:
Supabase Dashboard > Authentication > Users에서 이메일 별칭 `validator01@users.crypto-cat-jbu.com`으로 검표원 사용자를 만들고, SQL Editor에서 다음을 실행하세요.

UPDATE public.profiles SET role='validator'
WHERE id=(SELECT id FROM auth.users WHERE email='validator01@users.crypto-cat-jbu.com');

화면은 모바일 우선 무채색 라이트 테마(흰색·검정·회색)로 변경했습니다.

참고: 만약 같은 오류가 계속 나오면, Vercel에 새 파일이 실제 배포되었는지와 브라우저가 이전 `ticket.js`를 캐시하고 있지 않은지 먼저 확인해 주세요.
