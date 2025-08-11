import React, { createContext, useContext, useState } from "react";

const FriendContext = createContext();

export function FriendProvider({ children }) {
  const [friends, setFriends] = useState([]); // 내 친구 목록
  const [requests, setRequests] = useState([
    { id: 1, name: "수룡이", userId: "SooDragon" },
    { id: 2, name: "수정이", userId: "sungshinSooJeong" },
  ]); // 받은 친구 신청 목록

  // 친구 신청 수락
  const acceptRequest = (id) => {
    const accepted = requests.find(r => r.id === id);
    if (accepted) {
      setFriends(prev => [...prev, accepted]);
      setRequests(prev => prev.filter(r => r.id !== id));
    }
  };

  // 친구 신청 거절
  const rejectRequest = (id) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  return (
    <FriendContext.Provider value={{ friends, requests, acceptRequest, rejectRequest }}>
      {children}
    </FriendContext.Provider>
  );
}

export function useFriend() {
  return useContext(FriendContext);
}
