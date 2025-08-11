// src/pages/Settings/Settings.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/scss/section/Settings.scss"; // SCSS 파일 경로 확인

export default function Settings() {
  const nav = useNavigate();

  // 알림 토글 상태 (로컬에 저장)
  const [pushEnabled, setPushEnabled] = useState(
    localStorage.getItem("pushEnabled") === "true"
  );
  const [showWarn, setShowWarn] = useState(false); // 계정삭제 경고 모달

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
        // 실제 푸시(푸시 서버/서비스워커 구독)는 나중에 연결
      }
    } else {
      setPushEnabled(false);
    }
  };

  const onDeleteAccount = () => setShowWarn(true);

  const confirmDelete = () => {
    setShowWarn(false);
    // TODO: 계정 삭제 로직 연결
    alert("계정이 삭제되었습니다(임시).");
  };

// 맨 위 또는 return 바로 위에
console.log("Settings v2 loaded");



  return (
    <div className="settings-page">
      {/* 헤더 */}
      <div className="settings-header">
        <img
          className="back"
          src="/img/back.png"
          alt="뒤로"
          onClick={() => nav(-1)}
        />
        <h1>설정</h1>
        <img className="alert" src="/img/alert.png" alt="알림" />
      </div>

      {/* 상단 옵션 박스 */}
      <div className="settings-card">
        {/* 알림 켜기 */}
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

        {/* 완료한 퀘스트 확인하기 */}
        <button className="row" type="button">
          <span className="row-text">완료한 퀘스트 확인하기</span>
          <img className="nav-icon" src="/img/setting_navi.png" alt="" />
        </button>

        <div className="divider" />

        {/* 홈 화면 편집 */}
        <button className="row" type="button">
          <span className="row-text">홈 화면 편집</span>
          <img className="nav-icon" src="/img/setting_navi.png" alt="" />
        </button>

        <div className="divider" />

        {/* 차단 유저 관리 */}
        <button className="row" type="button">
          <span className="row-text">차단 유저 관리</span>
          <img className="nav-icon" src="/img/setting_navi.png" alt="" />
        </button>
      </div>

      {/* 하단 액션 박스들 */}
      <div className="actions">
        <button
          className="action-card"
          type="button"
          onClick={() => nav("/profile")}
        >
          마이페이지
        </button>

        <button className="action-card" type="button">
          Dooop팀에게 피드백 보내기
        </button>

        <button className="action-card" type="button">
          로그아웃
        </button>

        <button
          className="action-card danger"
          type="button"
          onClick={onDeleteAccount}
        >
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