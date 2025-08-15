// src/pages/Friends/MyFriends.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useFriend } from "../../contexts/FriendContext";
import "../../assets/scss/section/Friends.scss";

export default function FriendsList() {
  const nav = useNavigate();
  const { friends = [], loading } = useFriend();

  return (
    <div id="friends-root" className="friends-list-page">
      {/* 헤더 */}
      <div className="friends-header">
        <img alt="back" className="back" src="/img/back.png" onClick={() => nav(-1)} />
        <h2 className="title">내 친구</h2>
        <img alt="gear" className="gear" src="/img/gear.png" onClick={() => nav("/settings")} />
      </div>

      {/* 본문 */}
      <div className="friends-body">
        {loading ? (
          <p className="empty">불러오는 중…</p>
        ) : (friends?.length ?? 0) === 0 ? (
          <p className="empty">친구가 없습니다.</p>
        ) : (
          friends.map((f) => (
            <div className="friend-card" key={f.uid ?? f.id}>
              <span className="info">
                <strong className="name">{f.name ?? "이름없음"}</strong>
                <span className="sep"> | </span>
                <span className="uid">ID: {f.userId ?? f.uid ?? "unknown"}</span>
              </span>
              <div className="btn-group">
                <button className="visit-btn" onClick={() => nav(`/rooms/${f.uid}`)}>
                  방문
                </button>
                <button className="calendar-btn" onClick={() => nav(`/calendar/${f.uid}`)}>
                  캘린더
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
