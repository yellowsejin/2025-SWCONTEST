## 0727 추가기능(파일) 업로드<br />
AddCategory, AddTodo, DeleteCategory, DeleteTodo <br />
회원가입 후 카테고리/캘린더 문서 작성 가능하도록 기능 추가 <br />
firebase database에서 구조 확인 가능<br />


## 0724수정본 업로드<br />
+ 회원가입시 ID 기능 추가 => 로그인할때 email id password 빼먹지말고 받기<br />

## 20250717 누리 업로드<br />
**수정사항**<br />
윤서랑 파베에서 연결해둬서 회원가입하면 초기 데이터 저장됨!<br />
회원가입 시간/email/level(1)/point(0)/questStatus/room-furniture, theme/username 형식으로 생성<br />


## 파일 정리<br />
Login.js = 로그인 관리<br />
LogoutButton.js = 로그아웃 관리 (버튼으로 제작해뒀음)<br />
SignUp.js = 회원가입 관리<br />
WithDraw.js = 회원탈퇴 관리 * firebase의 경우 오래된 계정은 재로그인 - 회원탈퇴 절차 필요<br />
checkSession.js = 로그인 상태관리, 한 번 로그인하고 다시 들어가면 로그인 상태 유지되어있음<br />


## 엔드포인트 목록/호출방식<br />
- POST `/signup` → `{ email, password }`<br />
- POST `/login` → `{ email, password }` + `Authorization: Bearer <idToken>`<br />
- POST `/logout` → 헤더에 `Authorization`<br />
- POST `/withdraw` → 헤더에 `Authorization`<br />
- GET  `/checkSession` → 헤더에 `Authorization` (없으면 unauthenticated)<br />


## 사용 방법
1) npm start 실행 파일 내부에 .env.local 생성<br />
- .env.local파일에 실제 파이어베이스 키를 작성, 다른파일에서 불러오는 방식<br />
- 깃허브에 코드를 올려도 Firebase API 키 같은 중요한 정보는 노출되지 않도록! .env.local에 들어갈 내용은 카톡으로 전송해두겠습니당<br />
**- 사용한 .env.local 파일은 깃허브에 절대 올리지 말것!!!!-**<br />

