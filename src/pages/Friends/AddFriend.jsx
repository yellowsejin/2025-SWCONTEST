import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFriend } from "../../contexts/FriendContext";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../firebase";
import "../../assets/scss/section/Friends.scss";

export default function AddFriend() {
  const nav = useNavigate();
  const myId = "sungshin5678"; // TODO: 로그인값으로 교체
  const { requests } = useFriend();
  const hasNewRequest = (requests?.length || 0) > 0;

  // 입력·검색 상태
  const [qText, setQText] = useState("");
  const [results, setResults] = useState([]);
  const [openDrop, setOpenDrop] = useState(false);
  const [selected, setSelected] = useState(null); // {id, name}

  // 카드 노출 제어: 제출 전엔 숨김
  const [showCard, setShowCard] = useState(false);

  // 요청 상태
  const [requestState, setRequestState] = useState(0); // 0=요청하기, 1=요청됨
  const [submitting, setSubmitting] = useState(false);

  const functions = getFunctions(app);
  const callSendFriendRequest = httpsCallable(functions, "sendFriendRequest");
  // 🔥 최소 수정: searchUsers 연결 제거
  // const callSearchUsers = httpsCallable(functions, "searchUsers");

  // 입력 디바운스 검색
  const timerRef = useRef();
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // 입력이 비면 카드도 숨김
    if (!qText.trim()) {
      setResults([]);
      setOpenDrop(false);
      setSelected(null);
      setShowCard(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      // 🔥 최소 수정: 백엔드 호출 제거하고 목업만 사용
      const mock = ["sooDragon", "sungshin5678", "sungho777"]
        .filter((id) => id.toLowerCase().includes(qText.trim().toLowerCase()))
        .slice(0, 5)
        .map((id) => ({ id, name: id }));
      setResults(mock);
      if (openDrop) setOpenDrop(true);
    }, 250);

    return () => timerRef.current && clearTimeout(timerRef.current);
  }, [qText]); // eslint-disable-line

  // 드롭다운에서 항목 선택
  const handlePick = (u) => {
    setSelected(u);
    setQText(u.id || u.userId || "");
    setOpenDrop(false);
  };

  // ✅ "검색 제출" : 아이콘 클릭 또는 Enter
  // 최소 수정 포인트: 선택값이 없으면 입력값 자체를 선택으로 사용
  const submitSearch = () => {
    const typed = qText.trim();
    if (!typed) {
      setShowCard(false);
      return;
    }

    if (!selected) {
      if (results.length > 0) {
        setSelected(results[0]);
      } else {
        setSelected({ id: typed, name: typed }); // ← 입력값을 그대로 선택으로
      }
    } else {
      const cur = selected.id || selected.userId || selected.name || "";
      if (cur !== typed) setSelected({ id: typed, name: typed }); // ← 입력이 바뀌었으면 갱신
    }

    setShowCard(true);
    setOpenDrop(false);
  };

  // 친구 요청
  const handleRequestClick = async () => {
    const targetId = (selected?.id || qText || "").trim();
    if (!targetId) return alert("친구 아이디를 입력하세요.");
    if (targetId === myId) return alert("본인 아이디에는 요청할 수 없어요.");
    if (requestState === 1 || submitting) return;

    try {
      setSubmitting(true);
      await callSendFriendRequest({ targetId });
      setRequestState(1);
    } catch (e) {
      alert(e?.message || "요청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="friends-root">
      {/* 헤더 */}
      <div className="friends-header">
        <img alt="back" className="back" src="/img/back.png" onClick={() => nav(-1)} />
        <h2 className="title">친구 추가</h2>
        <img alt="gear" className="gear" src="/img/gear.png" onClick={() => nav("/settings")} />
      </div>

      {/* 본문 (흐름 배치) */}
      <div className="friends-container flow">
        {/* 검색 입력 + 아이콘 + 드롭다운 */}
        <div className="search-wrap" onBlur={() => setTimeout(() => setOpenDrop(false), 150)}>
          <input
            type="text"
            placeholder="친구 아이디를 입력하세요."
            value={qText}
            onChange={(e) => {
              setQText(e.target.value);
              setSelected(null);      // 새로 입력하면 이전 선택 해제
            }}
            onFocus={() => results.length && setOpenDrop(true)}
            onKeyDown={(e) => e.key === "Enter" && submitSearch()}  // ← Enter로 제출
          />
          <button
            className="search-icon"
            aria-label="검색"
            onMouseDown={(e) => e.preventDefault()}
            onClick={submitSearch}                                  // ← 아이콘으로 제출
          >
            {/* ✅ 백그라운드 대신 직접 이미지 넣기 */}
            <img src="/img/search.png" alt="" aria-hidden="true" />
          </button>
          {openDrop && results.length > 0 && (
            <ul className="search-dropdown">
              {results.map((u, i) => (
                <li key={i} onMouseDown={(e) => e.preventDefault()} onClick={() => handlePick(u)}>
                  <span className="u-name">{u.name || u.id || u.userId}</span>
                  <span className="u-id">ID: {u.id || u.userId || u.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 받은 신청 + 내 친구 */}
        <div className="friends-row">
          <div className="received-box" onClick={() => nav("/friends/requests")} role="button">
            <div className="left">
              {hasNewRequest && <span className="req-badge" />}
              <div className="texts">
                <span className="label">받은 신청</span>
              </div>
            </div>
            <span className="next" aria-hidden />
          </div>

          <Link to="/friends/list" className="friends-btn">내 친구</Link>
        </div>

        {/* ✅ 제출 전에는 렌더링하지 않음 */}
        {showCard && (
          <div className="requests-list">
            <div className="friend-card">
              <span className="info">
                <strong className="name">{selected?.name || "검색 대상"}</strong>
                <span className="sep"> | </span>
                <span className="uid">ID: {selected?.id || qText}</span>
              </span>
              <div className="btn-group">
                <button
                  className={requestState ? "requested-btn" : "request-btn"}
                  onClick={handleRequestClick}
                  disabled={requestState === 1 || submitting}
                >
                  {submitting ? "전송 중…" : requestState ? "요청됨" : "요청하기"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}