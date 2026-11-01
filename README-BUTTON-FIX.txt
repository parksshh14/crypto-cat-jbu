버튼 배치/로그인 상태/티켓 취소 수정

중요: 이 프로젝트에는 저장소 최상위와 public/ 폴더에 index.html 및 ticket.js가 모두 있습니다.
Vercel이 어느 경로를 배포하든 수정이 적용되도록 두 위치를 같은 코드로 맞췄습니다.

적용 순서
1. ZIP 압축을 풉니다.
2. GitHub 저장소에 다음 파일을 해당 경로 그대로 덮어쓰고 Commit 합니다.
   - index.html
   - ticket.js
   - public/index.html
   - public/ticket.js
3. Supabase Dashboard > SQL Editor에서 supabase/cancel-ticket-migration.sql 전체를 실행합니다.
   이 단계는 티켓 취소 기능에 필요합니다. 기존 티켓 테이블을 삭제하지 않습니다.
4. Vercel Deployments에서 새 배포가 Ready가 될 때까지 기다립니다.
5. 사이트에서 강력 새로고침(Ctrl+Shift+R) 합니다.

기대 화면
- 로그아웃: 아이디/비밀번호, 큰 로그인 버튼, 그 아래 작은 회원가입 버튼
- 로그인: 입력란/회원가입 숨김, 큰 버튼 글자는 로그아웃
- 티켓 발급 후: QR 티켓 발급하기 버튼이 QR 티켓 취소하기로 변경

supabase-config.js는 덮어쓰지 마세요. 기존 프로젝트 URL과 공개 키가 들어 있습니다.
