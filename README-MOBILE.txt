모바일 QR 티켓 업데이트 적용 안내

이 업데이트는 기존 Supabase 프로젝트/테이블을 새로 만들지 않습니다. 모바일 우선 UI와 카메라 검표 화면 파일을 교체합니다.

1. 기존 프로젝트에서 다음 파일을 교체하세요.
   public/index.html
   public/styles.css (기존 파일이 있으면 교체)
   public/ticket.js
   public/validator.html
   public/validator.js

2. public/supabase-config.js는 반드시 기존 파일을 유지하세요. 프로젝트 URL과 공개 키가 들어 있습니다.

3. ZIP 파일을 GitHub 저장소의 기존 파일과 같은 경로에 올리고 Commit changes를 누르세요. Vercel 자동 배포가 Ready가 될 때까지 기다립니다.

4. 스마트폰에서 Vercel URL을 열어 테스트하세요.
   참가자: https://YOUR-VERCEL-DOMAIN/
   검표원: https://YOUR-VERCEL-DOMAIN/validator.html

5. 아이디 로그인은 Supabase Auth 이메일 로그인에 가상 별칭 username@users.qr-ticket.invalid를 전달하는 프로토타입 방식입니다.
   - 아이디: 영문 소문자, 숫자, _ 또는 - 3~24자
   - 비밀번호: 최소 6자
   - 테스트 중 Supabase Authentication > Sign In / Providers > Email > Confirm email을 꺼야 바로 세션이 생깁니다.
   - 이 주소는 실제 이메일이 아니므로 이메일 인증/비밀번호 재설정 메일은 사용할 수 없습니다.

6. 검표원 계정은 Supabase Dashboard > Authentication > Users에서 아래와 같은 별칭으로 직접 추가하세요.
   예: validator01@users.qr-ticket.invalid
   그 다음 SQL Editor에서 아래를 실행하세요.
   UPDATE public.profiles SET role='validator'
   WHERE id=(SELECT id FROM auth.users WHERE email='validator01@users.qr-ticket.invalid');

중요: 이 프런트엔드는 기존 SQL 함수의 반환 형식에 맞춰 작성했습니다. 기존 issue_ticket 함수는 token, expires_at을 반환하고 verify_ticket 함수는 p_token 인자를 받으며 status 결과를 반환해야 합니다. 기존 schema.sql의 함수 이름/반환값이 다르면 프런트 코드 조정이 필요할 수 있습니다.

보안: 브라우저 코드에 service_role 또는 sb_secret 키를 넣지 마세요. 실제 운영 전에 비밀번호 재설정, 계정 복구, 속도 제한, RLS, 함수 권한을 검토하세요.
