import React from "react";
import { useFriend } from "../../contexts/FriendContext";
import "../../assets/scss/section/Friends.scss";

export default function FriendRequests() {
  const { requests, acceptRequest, rejectRequest } = useFriend();

  return (
    <div className="friends-container">
      <h2>받은 신청</h2>
      {requests.length === 0 && <p>받은 신청이 없습니다.</p>}
      {requests.map((req) => (
        <div className="friend-card" key={req.id}>
          <span>{req.name} ID: {req.userId}</span>
          <div className="btn-group">
            <button className="reject-btn" onClick={() => rejectRequest(req.id)}>거절</button>
            <button className="accept-btn" onClick={() => acceptRequest(req.id)}>수락</button>
          </div>
        </div>
      ))}
    </div>
  );
}
