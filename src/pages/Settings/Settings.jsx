// src/pages/Settings/Settings.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/scss/section/Settings.scss";

// 🔽 추가: Firebase Auth
import { getAuth, signOut } from "firebase/auth";
import { app } from "../../firebase"; // 네 프로젝트 경로에 맞게

export default function Settings() {
  const nav = useNavigate();
  const auth = getAuth(app);

  const [pushEnabled, setPushEnabled] = useState(
    localStorage.getItem("pushEnabled") === "true"
  );
  const [showWarn, setShowWarn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    localStorage.setItem("pushEnabled", String(pushEnabled));
  }, [pushEnabled]);

  const requestNotifyPermission = async (checked) => {
    if (!("Notification" in window)) {
      alert("이 브라우저는 알림을 지원하지 않아요.");
      setPushEnabled(false);
      return;
    }
    if (checked) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        alert("알림 권한이 허용되지 않았어요.");
        setPushEnabled(false);
      } else {
        setPushEnabled(true);
      }
    } else {
      setPushEnabled(false);
    }
  };

  const onDeleteAccount = () => setShowWarn(true);
  const confirmDelete = () => {
    setShowWarn(false);
    alert("계정이 삭제되었습니다(임시).");
  };
// ✅ 로그아웃 (백엔드 쿠키 만료 + 클라 signOut + 루트로 이동)
const handleLogout = async () => {
  if (loggingOut) return;
  setLoggingOut(true);
  try {
    // 1) 백엔드 호출 (쿠키 전송)
    //    백엔드 실패하더라도 클라 로그아웃은 계속 진행
    try {
      await fetch("https://us-central1-dooop-69a1b.cloudfunctions.net/logout", {
        method: "POST",
        credentials: "include", // __session 쿠키 포함
        headers: { "Content-Type": "application/json" },
      });
    } catch (_) {
      /* 서버 통신 실패는 무시하고 계속 진행 */
    }

    // 2) Firebase Auth 로그아웃
    await signOut(auth);

    // 3) (선택) 로컬 캐시 정리
    // localStorage.clear();

    // 4) 루트로 강제 이동 (빈 화면 방지용 풀 리로드)
    window.location.href = "/";
  } catch (e) {
    console.error(e);
    alert(`로그아웃 중 오류: ${e.message}`);
    setLoggingOut(false);
  }
};


  console.log("Settings v2 loaded");

  return (
    <div className="settings-page">
      {/* 헤더 */}
      <div className="settings-header">
        <img className="back" src="/img/back.png" alt="뒤로" onClick={() => nav(-1)} />
        <h1>설정</h1>
        <img className="alert" src="/img/alert.png" alt="알림" />
      </div>

      {/* 상단 옵션 박스 */}
      <div className="settings-card">
        <div className="row">
          <span className="row-text">알림 켜기</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={(e) => requestNotifyPermission(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="divider" />

        <button className="row" type="button">
          <span className="row-text">완료한 퀘스트 확인하기</span>
          <img className="nav-icon" src="/img/setting_navi.png" alt="" />
        </button>

        <div className="divider" />

        <button className="row" type="button">
          <span className="row-text">홈 화면 편집</span>
          <img className="nav-icon" src="/img/setting_navi.png" alt="" />
        </button>

        <div className="divider" />

        <button className="row" type="button">
          <span className="row-text">차단 유저 관리</span>
          <img className="nav-icon" src="/img/setting_navi.png" alt="" />
        </button>
      </div>

      {/* 하단 액션 */}
      <div className="actions">
        <button className="action-card" type="button" onClick={() => nav("/profile")}>
          마이페이지
        </button>

        <button className="action-card" type="button">
          Dooop팀에게 피드백 보내기
        </button>

        {/* ✅ 로그아웃 버튼 */}
        <button
          className="action-card"
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "로그아웃 중…" : "로그아웃"}
        </button>

        <button className="action-card danger" type="button" onClick={onDeleteAccount}>
          계정 삭제하기
        </button>
      </div>

      {/* 경고 모달 */}
      {showWarn && (
        <div className="modal-backdrop" onClick={() => setShowWarn(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p>계정을 삭제하면 다시 복구할 수 없습니다.</p>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowWarn(false)}>
                취소
              </button>
              <button type="button" className="danger" onClick={confirmDelete}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
