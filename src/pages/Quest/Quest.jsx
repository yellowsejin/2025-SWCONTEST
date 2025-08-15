import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/scss/section/Quest.scss";
import { onAuth, devLogin, callGetTodayQuest, callCompleteQuest } from "../../firebase";

export default function Quest() {
  const navigate = useNavigate();

  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [quests, setQuests] = useState([]);
  const [popup, setPopup] = useState({ open: false, amount: 0 });

  // 👇 추가: 초기 복원 완료 여부
  const [hydrated, setHydrated] = useState(false);

  // ====== 날짜 키 & 스토리지 유틸 ======
  const todayStr = getTodayStr(); // "YYYY-MM-DD" (로컬 기준)
  const storageKeyRef = useRef(null);
  const getKey = (u) => `dooop.quest.${u}.${todayStr}`;

  function getTodayStr() {
    const d = new Date(); // 로컬(Asia/Seoul) 기준
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

  // ✅ 자동 저장: 초기 복원(hydrated) 이후에만 동작하도록 **가드**
  useEffect(() => {
    if (!uid || !hydrated) return;
    saveSnapshot(uid, { points, quests });
  }, [uid, points, quests, hydrated]);

  // ====== 팝업 자동 닫힘 ======
  useEffect(() => {
    if (!popup.open) return;
    const t = setTimeout(() => setPopup({ open: false, amount: 0 }), 1000);
    return () => clearTimeout(t);
  }, [popup.open]);

  // ====== 로그인 상태 ======
  useEffect(() => {
    const unsub = onAuth(async (user) => {
      if (!user) {
        try {
          if (import.meta?.env?.DEV) {
            await devLogin(); // 개발 환경에서만
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

  // ====== 초기 로드(스냅샷 → 서버 병합) ======
  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    setHydrated(false); // 👈 새로 uid로 진입하면 다시 비수화 상태

    (async () => {
      setLoading(true);

      // 1) 로컬 스냅샷 우선 적용 (즉시 화면)
      const snap = loadSnapshot(uid);
      if (snap && !cancelled) {
        setPoints(snap.points ?? 0);
        setQuests(snap.quests ?? []);
        // setLoading(false); // 체감 속도 위해 놔둬도 되고, 아래 finally에서 정리됨
      }

      // 2) 서버 목록 불러오기 → 스냅샷과 병합 (포인트는 건드리지 않음)
      try {
        const { data } = await callGetTodayQuest(); // → [{id, text, rewardCoins}]
        const serverList =
          (data || []).map((q) => ({
            id: q.id,
            title: q.text || "",
            reward: q.rewardCoins ?? 0,
            state: "idle",
          })) ?? [];

        setQuests((prev) => {
          const byId = new Map(prev.map((q) => [q.id, q]));
          const merged = serverList.map((s) => {
            const local = byId.get(s.id);
            return local ? { ...s, state: local.state ?? s.state } : s;
          });
          return merged;
        });
      } catch (e) {
        console.error(e);
        if (!snap) alert("퀘스트를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHydrated(true); // 👈 이제부터 autosave 켜도 됨
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // ====== 상태 변경 헬퍼 (저장 X: autosave가 처리)
  const setQuestState = (id, next) => {
    setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, state: next } : q)));
  };

  // 시작/완료: 로컬 상태만 변경(서버 호출 없음)
  const onStart = (q) => setQuestState(q.id, "in_progress");
  const onComplete = (q) => setQuestState(q.id, "completed");

  // 보상받기: 서버 응답(newPoint)로 확정 (저장은 autosave가 처리)
  const onReward = async (q) => {
    try {
      if (q.state === "rewarded") return; // 이중 클릭 방지

      const resp = await callCompleteQuest({ questId: q.id });
      const payload = resp?.data ?? resp; // httpsCallable() or fetch() 대응
      if (payload?.success) {
        const added = typeof payload.added === "number" ? payload.added : (q.reward ?? 0);
        const newPt = typeof payload.newPoint === "number" ? payload.newPoint : (points + added);

        setPoints(newPt);
        setQuestState(q.id, "rewarded");
        setPopup({ open: true, amount: added });
      } else {
        throw new Error("보상 처리 실패");
      }
    } catch (e) {
      // 백엔드가 이미 지급된 퀘스트에 대해 "already-exists"를 던지는 경우
      const code = e?.code || e?.message || "";
      if (String(code).includes("already-exists")) {
        setQuestState(q.id, "rewarded");
        return;
      }
      console.error(e);
      alert("보상 수령 중 오류가 발생했습니다.");
    }
  };

  // 친구에게 뽐내기 (그대로)
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
      {/* 헤더 */}
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

        {/* 친구에게 뽐내기 버튼 */}
        <button className="brag-btn" onClick={onBragToFriends}>친구에게 뽐내기</button>
      </div>

      {/* 지급 팝업 */}
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