import { Routes, Route } from "react-router-dom";
import AddFriend from "./AddFriend";
import FriendRequests from "./FriendRequests";
import MyFriends from "./MyFriends";

function FriendsRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AddFriend />} />
      <Route path="received" element={<FriendRequests />} />
      <Route path="list" element={<MyFriends />} />
    </Routes>
  );
}

export default FriendsRoutes;
