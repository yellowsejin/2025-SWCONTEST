
## 20250717 누리 업로드
**수정사항**
윤서랑 파베에서 연결해둬서 회원가입하면 초기 데이터 저장됨!
회원가입 시간/email/level(1)/point(0)/questStatus/room-furniture, theme/username 형식으로 생성

## 0724수정본 업로드
+ 회원가입시 ID 기능 추가 => 로그인할때 email id password 빼먹지말고 받기


## 파일 정리
Login.js = 로그인 관리
LogoutButton.js = 로그아웃 관리 (버튼으로 제작해뒀음)
SignUp.js = 회원가입 관리
WithDraw.js = 회원탈퇴 관리 * firebase의 경우 오래된 계정은 재로그인 - 회원탈퇴 절차 필요
checkSession.js = 로그인 상태관리, 한 번 로그인하고 다시 들어가면 로그인 상태 유지되어있음


## 엔드포인트 목록/호출방식
- POST `/signup` → `{ email, password }`
- POST `/login` → `{ email, password }` + `Authorization: Bearer <idToken>`
- POST `/logout` → 헤더에 `Authorization`
- POST `/withdraw` → 헤더에 `Authorization`
- GET  `/checkSession` → 헤더에 `Authorization` (없으면 unauthenticated)


## 사용 방법
1) npm start 실행 파일 내부에 .env.local 생성
- .env.local파일에 실제 파이어베이스 키를 작성, 다른파일에서 불러오는 방식
- 깃허브에 코드를 올려도 Firebase API 키 같은 중요한 정보는 노출되지 않도록! .env.local에 들어갈 내용은 카톡으로 전송해두겠습니당
**- 사용한 .env.local 파일은 깃허브에 절대 올리지 말것!!!!-**

