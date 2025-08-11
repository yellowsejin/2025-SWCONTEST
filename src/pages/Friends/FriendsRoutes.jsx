import { Routes, Route, Navigate } from "react-router-dom";
import AddFriend from "./AddFriend";
import FriendRequests from "./FriendRequests";
import MyFriends from "./MyFriends";

export default function FriendsRoutes() {
  return (
    <Routes>
      {/* 기본 경로에서 AddFriend 보여주기 */}
      <Route index element={<AddFriend />} />

      <Route path="add" element={<AddFriend />} />
      <Route path="requests" element={<FriendRequests />} />
      <Route path="list" element={<MyFriends />} />

      {/* 혹시 기본 경로로 다시 리다이렉트 하고 싶으면 아래처럼 */}
      {/* <Route index element={<Navigate to="add" replace />} /> */}
    </Routes>
  );
}
