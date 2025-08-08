## 0808 오류수정<br />
전체 오류나서 코드 싹 고침 <br />
CompleteTodo, TodoCounters 함수 새로 추가함 <br />
레벨업 구현 = 투두 완료시 counter 증가 => 레벨업됨 <br />

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

BE_nuri

completeQuest -> 퀘스트 완료 시 포인트 지급

+0717 수정 api 함수 추가

**지우 0723 업로드**

로그인 및 회원가입 코딩

애뮬레이터 리로드 오류로 코딩확인 불가능

**세진 0723 push**

로그인 화면 및 전체 폴더/파일 세팅 1차 commit

**지우 0729 업로드**

회원가입 및 월캘린더 일일리스트 , 네비게이션 초기 디자인 완료

**지우 0808 업로드**
카테고리, 일일리스트 추가 및 삭제 / 캘린더 연동

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

2785b96 (first setting commit)
main
