import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useFriend } from "../../contexts/FriendContext";
import "../../assets/scss/section/Friends.scss";

export default function AddFriend() {
  const myId = "sungshin5678";
  const { requests } = useFriend();

  // 요청 상태: 0 = 요청하기, 1 = 요청됨
  const [requestState, setRequestState] = useState(0);

  const handleRequestClick = () => {
    setRequestState(prev => (prev + 1) % 2);
  };

  const buttonText = ["요청하기", "요청됨"];
  const buttonClass = ["request-btn", "requested-btn"];

  return (
    <div className="friends-container">
      <h2>친구 추가</h2>

      <div className="search-box">
        <input type="text" placeholder="친구 아이디를 입력하세요. 🔍" />
      </div>

      <div className="BB">
        <Link to="/friends/received" className="Add-btn">
          받은 신청 {requests.length > 0 && <span className="badge">{requests.length}</span>}
        </Link>
        <Link to="/friends/list" className="friends-btn">내 친구</Link>
      </div>

      <div className="friend-card">
        <p>이수정ID : {myId}</p>
        <button
          className={buttonClass[requestState]}
          onClick={handleRequestClick}
        >
          {buttonText[requestState]}
        </button>
      </div>
    </div>
  );
}
