import React from "react";
import { useFriend } from "../../contexts/FriendContext";
import { useNavigate } from "react-router-dom";
import "../../assets/scss/section/Friends.scss";

function MyFriends() {
  const { friends } = useFriend();
  const navigate = useNavigate();

  return (
    <div className="friends-container">
      <h2>내 친구</h2>
      {friends.length === 0 ? (
        <p>친구가 없습니다.</p>
      ) : (
        friends.map((friend) => (
          <div className="myfriend-card" key={friend.id}>
            <div>
              <p style={{ margin: 0, fontSize: "16px" }}>{friend.name}</p>
              <p style={{ margin: 0,fontWeight:"bold", fontSize: "20px", color: "black" }}>
                Lv. {friend.level || "1"} &nbsp;&nbsp; {friend.size || "3/5"}
              </p>
            </div>
            <div className="btn-group">
              <button
                className="visit-btn"
                onClick={() => navigate(`/room/${friend.id}`)}
              >
                방 놀러가기
              </button>
              <button
                className="calendar-btn"
                onClick={() => navigate(`/calendar/${friend.id}`)}
              >
                캘린더 보기
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default MyFriends;
