crypto-cat-jbu 정리본

[파일 구조]
- index.html: 메인 QR 티켓 페이지 (유일한 index.html)
- validator.html: 검표원 페이지
- admin.html: 관리자 페이지
- ticket.js / validator.js / admin.js: 각 페이지 기능
- styles.css: 공통 디자인
- supabase-config.js: Supabase 프로젝트 연결 설정
- supabase/: 데이터베이스 SQL 파일

[GitHub 업로드]
1. 이 폴더 안의 모든 파일과 supabase 폴더를 GitHub 저장소 최상위(root)에 업로드하세요.
2. 별도의 public 폴더는 없습니다. index.html도 하나만 있습니다.
3. Vercel 프로젝트의 Root Directory는 ./ 로 설정하세요.

[Supabase]
- 기존 Supabase 프로젝트/데이터를 삭제하지 마세요.
- 기존 데이터베이스를 이미 설정했다면 schema.sql을 다시 실행하지 마세요.
- 관리자 페이지 기능을 위해 Supabase SQL Editor에서
  supabase/admin-page-migration.sql 을 실행하세요.
- 관리자 계정은 먼저 일반 회원가입을 완료한 뒤, SQL Editor에서 아래 쿼리의
  '관리자아이디'를 실제 아이디로 바꿔 실행해야 합니다.

  update public.profiles
  set role = 'admin'
  where email = lower('관리자아이디') || '@users.crypto-cat-jbu.com';

[Supabase 설정 확인]
- supabase-config.js에는 기존 프로젝트 URL과 publishable/anon 키가 복사되어 있습니다.
- 배포 후 연결 오류가 나면 기존 백업의 실제 설정값과 비교하세요.
