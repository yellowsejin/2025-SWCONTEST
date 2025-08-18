import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import { CategoryProvider } from "./contexts/CategoryContext";
import { ScheduleProvider } from "./contexts/ScheduleContext.jsx";
import { FriendProvider } from "./contexts/FriendContext.jsx";

import BottomNav from "./components/ButtonNav";

// 로그인 파일 경로 유지 (네 프로젝트 구조에 맞춤)
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import FindId from "./pages/Auth/FindId";
import FindPassword from "./pages/Auth/FindPassword";

import MonthlyCalendar from "./pages/Calendar/MonthlyCalendar";
import DailyList from "./pages/Calendar/DailyList";
import Quest from "./pages/Quest/Quest";
import Category from "./pages/Calendar/Category";
import Settings from "./pages/Settings/Settings.jsx";
import Profile from "./pages/Settings/Profile.jsx";
import Level from "./pages/Settings/level.jsx";

import FriendsRoutes from "./pages/Friends/FriendsRoutes.jsx";
import AddDailyItem from "./pages/Calendar/AddDailyItem.jsx";

// 네비 숨길 경로
const HIDDEN_NAV_PREFIXES = [
  "/", "/signup", "/find-id", "/find-password",
  "/level", "/profile", "/settings"
];

// 간단 보호 라우트 (새 파일 없이)
function Protected({ authed, loading, children }) {
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!authed) return <Navigate to="/" replace />;
  return children;
}

function AppContent() {
  const location = useLocation();
  const shouldHideNav = HIDDEN_NAV_PREFIXES.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + "/")
  );

  // 인증 상태
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthed(!!u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const isFriendCalendar = location.pathname.startsWith("/calendar/");

  return (
    <>
      <Routes>
        {/* 인증 (공개) */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/find-id" element={<FindId />} />
        <Route path="/find-password" element={<FindPassword />} />

        {/* 메인 탭 (보호) */}
        <Route
          path="/calendar"
          element={
            <Protected authed={authed} loading={loading}>
              <MonthlyCalendar />
            </Protected>
          }
        />
        <Route
          path="/daily/:date"
          element={
            <Protected authed={authed} loading={loading}>
              <DailyList />
            </Protected>
          }
        />
        <Route
          path="/quest"
          element={
            <Protected authed={authed} loading={loading}>
              <Quest />
            </Protected>
          }
        />
        <Route
          path="/mypage"
          element={
            <Protected authed={authed} loading={loading}>
              <Profile />
            </Protected>
          }
        />

        {/* 기타 (보호) */}
        <Route
          path="/settings"
          element={
            <Protected authed={authed} loading={loading}>
              <Settings />
            </Protected>
          }
        />
        <Route
          path="/category"
          element={
            <Protected authed={authed} loading={loading}>
              <Category />
            </Protected>
          }
        />
        <Route
          path="/AddDailyItem"
          element={
            <Protected authed={authed} loading={loading}>
              <AddDailyItem />
            </Protected>
          }
        />
        <Route
          path="/level"
          element={
            <Protected authed={authed} loading={loading}>
              <Level />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected authed={authed} loading={loading}>
              <Profile />
            </Protected>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <Protected authed={authed} loading={loading}>
              <div>Edit Profile</div>
            </Protected>
          }
        />

        {/* 친구 (보호) */}
        <Route
          path="/friends/*"
          element={
            <Protected authed={authed} loading={loading}>
              <FriendsRoutes />
            </Protected>
          }
        />

        <Route
          path="/room/:friendId"
          element={
            <Protected authed={authed} loading={loading}>
              <div>방 놀러가기</div>
            </Protected>
          }
        />

        {/* 친구 공개 캘린더: 공개 보기 용도 */}
        <Route
          path="/calendar/:friendId"
          element={<MonthlyCalendar />}
        />

        {/* 그 외 모든 경로는 월캘린더로 정리 */}
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>

      {/* 친구 캘린더일 때 하단 바 표시 */}
      {(!shouldHideNav || isFriendCalendar) && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScheduleProvider>
        <CategoryProvider>
          <FriendProvider>
            <AppContent />
          </FriendProvider>
        </CategoryProvider>
      </ScheduleProvider>
    </BrowserRouter>
  );
}
