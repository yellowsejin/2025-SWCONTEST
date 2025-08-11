// src/App.jsx
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { CategoryProvider } from "./contexts/CategoryContext";
import { ScheduleProvider } from "./contexts/ScheduleContext";
import { FriendProvider } from "./contexts/FriendContext";

import BottomNav from "./components/ButtonNav";

import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import FindId from "./pages/Auth/FindId";
import FindPassword from "./pages/Auth/FindPassword";
import MonthlyCalendar from "./pages/Calendar/MonthlyCalendar";
import DailyList from "./pages/Calendar/DailyList";
//import Quest from "./pages/Quest/Quest";
import Category from "./pages/Calendar/Category";
import Settings from "./pages/Settings/Settings.jsx";
//import Profile from "./pages/Settings/Profile.jsx";

import AddFriend from "./pages/Friends/AddFriend.jsx";
import FriendRequests from "./pages/Friends/FriendRequests.jsx";
import MyFriends from "./pages/Friends/MyFriends.jsx";
import FriendsRoutes from "./pages/Friends/FriendsRoutes.jsx";

// 오버레이 용이라면 라우트 불필요하지만, 유지해도 OK
import AddDailyItem from "./pages/Calendar/AddDailyItem.jsx";

// ✅ 네비 숨길 경로(앞부분 일치도 숨김)
const HIDDEN_NAV_PREFIXES = [
  "/", "/signup", "/find-id", "/find-password",
  "/level", "/profile", "/settings"
];

function AppContent() {
  const location = useLocation();
  const shouldHideNav = HIDDEN_NAV_PREFIXES.some(
    p => location.pathname === p || location.pathname.startsWith(p + "/")
  );

  return (
    <>
      <Routes>
        {/* 인증 */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/find-id" element={<FindId />} />
        <Route path="/find-password" element={<FindPassword />} />

        {/* 메인 탭 */}
        <Route path="/calendar" element={<MonthlyCalendar />} />
        <Route path="/daily" element={<DailyList />} />
        <Route path="/daily/:date" element={<DailyList />} />
        {/*<Route path="/quest" element={<Quest />} />*/}
        {/*<Route path="/mypage" element={<Profile />} />*/}

        {/* 기타 */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/category" element={<Category />} />
        {/* 필요할 때만 사용: 단독 페이지 테스트용 */}
        <Route path="/AddDailyItem" element={<AddDailyItem />} />

        {/* 예시 임시 페이지 */}
        {/* <Route path="/level" element={<div>Level</div>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<div>Edit Profile</div>} />*/}

        <Route path="/friends/*" element={
          <FriendProvider>
            <FriendsRoutes />
          </FriendProvider>
        } />

        <Route path="/room/:friendId" element={<div>방 놀러가기</div>} />
        <Route path="/calendar/:friendId" element={<div>친구 캘린더 보기</div>} />



      </Routes>

      {!shouldHideNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <ScheduleProvider>
      <CategoryProvider>
        <FriendProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </FriendProvider>
      </CategoryProvider>
    </ScheduleProvider>
  );
}