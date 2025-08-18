import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AddFriend from "./AddFriend.jsx";
import FriendRequests from "./FriendRequests.jsx";
import MyFriends from "./MyFriends.jsx";
import FriendCalendarPage from "./FriendCalendarPage.jsx";

export default function FriendsRoutes() {
  return (
    <Routes>
      {/* ✅ /friends 들어오면 무조건 AddFriend */}
      <Route index element={<AddFriend />} />

      {/* 하위 경로 */}
      <Route path="add" element={<AddFriend />} />
      <Route path="requests" element={<FriendRequests />} />
      <Route path="list" element={<MyFriends />} />
      <Route path=":friendUid/calendar" element={<FriendCalendarPage />} />

      {/* 안전망 */}
      <Route path="*" element={<Navigate to="add" replace />} />
    </Routes>
  );
}
