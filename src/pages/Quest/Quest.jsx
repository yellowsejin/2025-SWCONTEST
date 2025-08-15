// src/pages/Quest/Quest.jsx (또는 현재 경로 그대로)
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/scss/section/Quest.scss";
import { onAuth, devLogin, callGetTodayQuest, callCompleteQuest } from "../../firebase";

// ✅ 추가: 포인트 실시간 구독을 위한 Firestore import
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { app } from "../../firebase";

export default function Quest() {
  const navigate = useNavigate();

  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [quests, setQuests] = useState([]);
  const [popup, setPopup] = useState({ open: false, amount: 0 });

  // 👇 추가: 초기 복원 완료 여부
  const [hydrated, setHydrated] = useState(false);

  // ====== 날짜 키 & 스냅샷 유틸 ======
  const todayStr = getTodayStr(); // "YYYY-MM-DD"
  const storageKeyRef = useRef(null);
  const getKey = (u) => `dooop.quest.${u}.${todayStr}`;

  const db = getFirestore(app); // ✅ Firestore 인스턴스

  function getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function loadSnapshot(u) {
    try {
      const raw = localStorage.getItem(getKey(u));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.uid !== u || parsed?.date !== todayStr) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveSnapshot(u, data) {
    const snapshot = {
      uid: u,
      date: todayStr,
      points: data.points,
      quests:
        data.quests?.map(({ id, title, reward, state }) => ({
          id, title, reward, state
        })) ?? [],
    };
    localStorage.setItem(getKey(u), JSON.stringify(snapshot));
  }

  // ✅ 자동 저장: 초기 복원(hydrated) 이후에만
  useEffect(() => {
    if (!uid || !hydrated) return;
    saveSnapshot(uid, { points, quests });
  }, [uid, points, quests, hydrated]);

  // 팝업 자동 닫힘
  useEffect(() => {
    if (!popup.open) return;
    const t = setTimeout(() => setPopup({ open: false, amount: 0 }), 1000);
    return () => clearTimeout(t);
  }, [popup.open]);

  // 로그인 상태 감시
  useEffect(() => {
    const unsub = onAuth(async (user) => {
      if (!user) {
        try {
          if (import.meta?.env?.DEV) {
            await devLogin();
            return;
          }
        } catch {}
        navigate("/login");
        return;
      }
      setUid(user.uid);
      storageKeyRef.current = getKey(user.uid);
    });
    return () => unsub();
  }, [navigate]);

  // ✅ 포인트 실시간 구독 (최소 수정 핵심)
  // users/{uid}.point 를 그대로 UI에 반영
  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "users", uid);
    const off = onSnapshot(ref, (ds) => {
      const p = ds?.data()?.point;
      if (typeof p === "number") setPoints(p);
    });
    return () => off();
  }, [uid, db]);

  // 초기 로드(스냅샷 → 서버 병합)
  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    setHydrated(false);

    (async () => {
      setLoading(true);

      // 1) 스냅샷 즉시 반영
      const snap = loadSnapshot(uid);
      if (snap && !cancelled) {
        setPoints(snap.points ?? 0);
        setQuests(snap.quests ?? []);
      }

      // 2) 서버 목록 불러오기 → 병합
      try {
        const resp = await callGetTodayQuest();
        const payload = resp?.data ?? resp;

        // 서버 퀘스트 배열 안전 파싱
        const rawList = Array.isArray(payload)
          ? payload
          : (payload?.data ?? payload?.quests ?? []);
        const serverList =
          (rawList || []).map((q) => ({
            id: q.id,
            title: q.text || q.title || "",
            reward: q.rewardCoins ?? q.reward ?? 0,
            state: "idle",
          })) ?? [];

        // 퀘스트는 병합 (로컬 우선)
        setQuests((prev) => {
          const byId = new Map(prev.map((q) => [q.id, q]));
          return serverList.map((s) => {
            const local = byId.get(s.id);
            return local ? { ...s, state: local.state ?? s.state } : s;
          });
        });

        // 포인트는 이제 onSnapshot이 실시간으로 넣어주므로 여기선 건드리지 않음
      } catch (e) {
        console.error(e);
        if (!snap) alert("퀘스트를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHydrated(true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [uid]);

  // ===== 상태 변경 헬퍼
  const setQuestState = (id, next) => {
    setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, state: next } : q)));
  };

  const onStart = (q) => setQuestState(q.id, "in_progress");
  const onComplete = (q) => setQuestState(q.id, "completed");

  // 보상받기
  const onReward = async (q) => {
    try {
      if (q.state === "rewarded") return;
      const resp = await callCompleteQuest({ questId: q.id });
      const payload = resp?.data ?? resp;
      if (payload?.success) {
        const added = typeof payload.added === "number" ? payload.added : (q.reward ?? 0);
        // UI 즉시 반응용 낙관적 업데이트 (실제 정답은 onSnapshot으로 교정됨)
        setPoints((v) => v + added);
        setQuestState(q.id, "rewarded");
        setPopup({ open: true, amount: added });
      } else {
        throw new Error("보상 처리 실패");
      }
    } catch (e) {
      const code = e?.code || e?.message || "";
      if (String(code).includes("already-exists")) {
        setQuestState(q.id, "rewarded");
        return;
      }
      console.error(e);
      alert("보상 수령 중 오류가 발생했습니다.");
    }
  };

  const onBragToFriends = () => {
    const completed = quests.filter((q) => q.state === "rewarded" || q.state === "completed");
    alert(`친구에게 ${completed.length}개의 퀘스트 현황을 보냈어요!`);
  };

  if (loading) {
    return (
      <div id="quest-root">
        <header className="quest-header">
          <img className="back" src="/img/back.png" alt="뒤로" onClick={() => navigate("/calendar")} />
          <h1 className="title">퀘스트</h1>
          <img className="gear" src="/img/gear.png" alt="설정" onClick={() => navigate("/settings")} />
        </header>
        <p style={{ padding: 24 }}>불러오는 중…</p>
      </div>
    );
  }

  return (
    <div id="quest-root">
      <header className="quest-header">
        <img className="back" src="/img/back.png" alt="뒤로" onClick={() => navigate("/calendar")} />
        <h1 className="title">퀘스트</h1>
        <img className="gear" src="/img/gear.png" alt="설정" onClick={() => navigate("/settings")} />
      </header>

      {/* 포인트 표시 */}
      <div className="point-row">
        <img className="coin" src="/img/coin.png" alt="코인" />
        <span className="point-text">{points}</span>
      </div>

      {/* 카드 리스트 */}
      <div className="card-list">
        {quests.map((q) => (
          <article
            key={q.id}
            className={`card ${q.state === "completed" ? "is-completed" : ""} ${q.state === "rewarded" ? "is-rewarded" : ""}`}
          >
            <div className="left">
              <div className="texts">
                <h2 className="q-title">{q.title}</h2>
                <div className="q-point">
                  <img src="/img/coin.png" alt="" />
                  <span>{q.reward} 포인트</span>
                </div>
              </div>
            </div>

            {q.state === "idle" && <button className="btn start" onClick={() => onStart(q)}>시작하기</button>}
            {q.state === "in_progress" && <button className="btn done" onClick={() => onComplete(q)}>완료</button>}
            {q.state === "completed" && <button className="btn reward" onClick={() => onReward(q)}>보상받기</button>}
          </article>
        ))}

        <button className="brag-btn" onClick={onBragToFriends}>친구에게 뽐내기</button>
      </div>

      {popup.open && (
        <div className="popup" role="dialog" onClick={() => setPopup({ open: false, amount: 0 })}>
          <div className="popup-box">
            <p>{popup.amount}코인이 지급되었습니다!</p>
          </div>
        </div>
      )}
    </div>
  );
}
