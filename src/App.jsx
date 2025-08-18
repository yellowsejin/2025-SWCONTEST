// src/App.jsx
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import { CategoryProvider } from "./contexts/CategoryContext";
import { ScheduleProvider } from "./contexts/ScheduleContext.jsx";
import { FriendProvider } from "./contexts/FriendContext.jsx";

import BottomNav from "./components/ButtonNav";

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

const HIDDEN_NAV_PREFIXES = [
  "/", "/signup", "/find-id", "/find-password",
  "/level", "/profile", "/settings"
];

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

  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthed(!!u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

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
          path="/friends/:friendId/calendar"
          element={
            <Protected authed={authed} loading={loading}>
              <MonthlyCalendar />
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

        {/* 기본 리디렉트 */}
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>

      {!shouldHideNav && <BottomNav />}
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
