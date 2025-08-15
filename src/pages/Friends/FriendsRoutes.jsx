import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AddFriend from "./AddFriend.jsx";
import FriendRequests from "./FriendRequests.jsx"; // 파일명 정확히 맞추기!
import MyFriends from "./MyFriends.jsx";           // 파일명 정확히 맞추기!

export default function FriendsRoutes() {
  return (
    <Routes>
      {/* ✅ /friends 진입 시 기본으로 AddFriend 보여주기 */}
      <Route index element={<AddFriend />} />

      {/* ✅ 중첩 경로: /friends/add, /friends/requests, /friends/list */}
      <Route path="add" element={<AddFriend />} />
      <Route path="requests" element={<FriendRequests />} />
      <Route path="list" element={<MyFriends />} />

      {/* 안전망: 잘못된 하위경로는 /friends/add로 리다이렉트 */}
      <Route path="*" element={<Navigate to="add" replace />} />
    </Routes>
  );
}
