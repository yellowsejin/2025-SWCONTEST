// src/pages/Settings/Level.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../assets/scss/section/level.scss";

// ▼ 파이어베이스
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { app } from "../../firebase";      // 이미 쓰는 firebase 초기화 모듈

export default function Level() {
  const nav = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  // ▼ 실시간 사용자 레벨/포인트 상태
  const [stats, setStats] = useState({
    level: 1,
    completedCount: 0,         // 이번 레벨에서 쌓인 개수
    requiredTodoCount: 10,     // 다음 레벨까지 필요한 개수 (기본 10)
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubAuth = null;
    let unsubUser = null;

    unsubAuth = onAuthStateChanged(auth, (u) => {
      if (unsubUser) { unsubUser(); unsubUser = null; }
      if (!u) { setLoading(false); return; }

      const userRef = doc(db, "users", u.uid);
      unsubUser = onSnapshot(userRef, (snap) => {
        const d = snap.data() || {};
        const required =
          (d.questStatus && d.questStatus.requiredTodoCount) ||
          d.nextThreshold || 10;

        setStats({
          level: d.level || 1,
          completedCount: d.completedCount || 0,
          requiredTodoCount: required,
        });
        setLoading(false);
      });
    });

    return () => {
      if (unsubUser) unsubUser();
      if (unsubAuth) unsubAuth();
    };
  }, [auth, db]);

  const { level, completedCount, requiredTodoCount } = stats;

  const percent = useMemo(() => {
    const p = (completedCount / requiredTodoCount) * 100;
    return Math.max(0, Math.min(100, p));
  }, [completedCount, requiredTodoCount]);

  const remainPoints = Math.max(0, requiredTodoCount - completedCount);

  // UI
  const totalLevels = 15;
  const [visibleCount, setVisibleCount] = useState(12);
  const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);

  return (
    <div className="mypage">
      <div className="Profile-header">
        <img className="back" src="/img/back.png" alt="뒤로" onClick={() => nav(-1)} />
        <h1>마이페이지</h1>
      </div>

      <div className="after-header">
        <div className="profile-tabs" role="tablist">
          <NavLink to="/profile" end className={({ isActive }) => `tab ${isActive ? "active" : ""}`}>Profile</NavLink>
          <NavLink to="/level" className={({ isActive }) => `tab ${isActive ? "active" : ""}`}>level</NavLink>
          <NavLink to="/followers" className={({ isActive }) => `tab ${isActive ? "active" : ""}`}>Followers</NavLink>
        </div>

        <div className="level-page">
          <div className="level-header">
            <div className="title-row">
              <h2 className="title"><span className="lvl-number">&nbsp;{level} Level</span></h2>
              <span className="progress-number">
                {loading ? "-" : `${completedCount} / ${requiredTodoCount}`}
              </span>
            </div>

            <div className="level-bar">
              <div className="fill" style={{ width: `${percent}%` }} />
            </div>

            <div className="next-info">
              <p>다음 {level + 1} Level까지 {remainPoints}개의 포인트가 남았습니다.</p>
            </div>
          </div>

          <div className="level-grid no-scroll">
            {levels.slice(0, visibleCount).map((lv) => (
              <div className={`level-card ${lv <= level ? "achieved" : ""}`} key={lv}>
                <span className="level-text">Lv {lv}</span>
              </div>
            ))}
          </div>

          {visibleCount < totalLevels && (
            <button type="button" className="level-more" onClick={() => setVisibleCount(totalLevels)}>
              더 보기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
