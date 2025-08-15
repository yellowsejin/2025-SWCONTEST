// src/pages/Settings/Profile.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../assets/scss/section/Profile.scss";

// Firebase
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { app } from "../../firebase";

export default function Profile() {
  const nav = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  // 백엔드 메타
  const [meta, setMeta] = useState({
    displayId: "",   // 가입 시 저장한 사용자 ID (users/{uid}.id)
    email: "",       // 가입 이메일 (users/{uid}.email or auth)
    coin: 0,         // users/{uid}.point
    level: 1,        // users/{uid}.level
    loading: true,
  });

  useEffect(() => {
    let unsubAuth = null;
    let unsubUser = null;

    unsubAuth = onAuthStateChanged(auth, (u) => {
      if (unsubUser) { unsubUser(); unsubUser = null; }
      if (!u) { setMeta({ displayId: "", email: "", coin: 0, level: 1, loading: false }); return; }

      const userRef = doc(db, "users", u.uid);
      unsubUser = onSnapshot(userRef, (snap) => {
        const d = snap.data() || {};
        setMeta({
          displayId: d.id || u.displayName || u.uid,  // 우선순위: users.id > auth.displayName > uid
          email: d.email || u.email || "",
          coin: d.point ?? 0,
          level: d.level ?? 1,
          loading: false,
        });
      });
    });

    return () => {
      if (unsubUser) unsubUser();
      if (unsubAuth) unsubAuth();
    };
  }, [auth, db]);

  const { displayId, email, coin, level, loading } = meta;

  return (
    <div className="mypage">
      {/* 헤더 */}
      <div className="Profile-header">
        <img className="back" src="/img/back.png" alt="뒤로" onClick={() => nav(-1)} />
        <h1>마이페이지</h1>
      </div>

      {/* 탭 */}
      <div className="profile-tabs" role="tablist">
        <NavLink to="/profile" end className={({isActive}) => `tab ${isActive ? "active" : ""}`}>Profile</NavLink>
        <NavLink to="/level" className={({isActive}) => `tab ${isActive ? "active" : ""}`}>level</NavLink>
        <NavLink to="/followers" className={({isActive}) => `tab ${isActive ? "active" : ""}`}>Followers</NavLink>
      </div>

      {/* 섹션 타이틀 + 메타 */}
      <div className="section-row">
        <h2 className="section-title">프로필 설정</h2>
        <div className="meta">
          <div className="coin">
            <img src="/img/coin.png" alt="coin" />
            <span className="metric">{loading ? "-" : coin}</span>
          </div>
          <div className="level">
            <img src="/img/level.png" alt="level" />
            <span className="metric">Lv.{loading ? "-" : level}</span>
          </div>
        </div>
      </div>

      {/* 프로필 카드: 사용자 ID / 이메일 표시 */}
      <div className="card profile-card">
        {/* 사용자 ID */}
        <div className="row">
          <span className="row-text">{loading ? "" : (displayId || "사용자 ID 없음")}</span>
        </div>

        <div className="divider" />

        {/* 이메일 */}
        <div className="row">
          <span className="subtext">{loading ? "" : (email || "이메일 없음")}</span>
        </div>
      </div>

      {/* 보안 섹션 */}
      <h2 className="section-title security-title">보안</h2>
      <div className="card security-card">
        <button className="row" type="button" onClick={() => nav("/settings/verify-password")}>
          <span className="row-text">암호 확인</span>
          <img className="trailing-icon" src="/img/next.png" alt="" />
        </button>

        <div className="divider" />

        <button className="row" type="button" onClick={() => nav("/settings/change-password")}>
          <span className="row-text">암호 변경</span>
          <img className="trailing-icon" src="/img/re.png" alt="" />
        </button>
      </div>
    </div>
  );
}
