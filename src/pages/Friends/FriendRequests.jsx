import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFriend } from "../../contexts/FriendContext";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import "../../assets/scss/section/Friends.scss";

export default function FriendRequests() {
  const nav = useNavigate();
  const { requests = [], acceptRequest, rejectRequest } = useFriend();
  const [busyId, setBusyId] = useState(null);
  const [profiles, setProfiles] = useState({}); // { fromUid: { name, handle } }

  // 보낸 사람(from)의 프로필 조인 (수락 전 목록에서도 이름/ID 이쁘게)
  useEffect(() => {
    const load = async () => {
      const map = {};
      for (const r of requests) {
        const from = r?.fromId ?? r?.from;
        if (!from || map[from]) continue;
        const snap = await getDoc(doc(db, "users", from));
        const p = snap.data() || {};
        map[from] = {
          name: p.name ?? p.displayName ?? p.id ?? from,
          handle: p.id ?? p.userId ?? from, // 화면에 보일 ID(커스텀 id 우선)
        };
      }
      setProfiles(map);
    };
    if (requests?.length) load();
  }, [requests]);

  const safeRequests = Array.isArray(requests) ? requests.filter((r) => r && r.id) : [];

  const onAccept = async (req) => {
    try {
      setBusyId(req.id);
      await acceptRequest(req.id);
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (req) => {
    try {
      setBusyId(req.id);
      await rejectRequest(req.id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div id="friends-root" className="requests-page">
      <div className="friends-header">
        <img alt="back" className="back" src="/img/back.png" onClick={() => nav(-1)} />
        <h2 className="title">받은 신청</h2>
        <img alt="gear" className="gear" src="/img/gear.png" onClick={() => nav("/settings")} />
      </div>

      <div className="requests-body">
        {safeRequests.length === 0 && <p className="empty">받은 신청이 없습니다.</p>}

        {safeRequests.map((req) => {
          const from = req?.fromId ?? req?.from;
          const p = from ? profiles[from] : null;
          const name = p?.name ?? "이름없음";
          const handle = p?.handle ?? (from || "unknown");

          return (
            <div className="friend-card" key={req.id}>
              <span className="info">
                <strong className="name">{name}</strong>
                <span className="sep"> | </span>
                <span className="uid">ID: {handle}</span>
              </span>

              <div className="btn-group">
                <button className="reject-btn" onClick={() => onReject(req)} disabled={busyId === req.id}>
                  {busyId === req.id ? "처리중…" : "거절"}
                </button>
                <button className="accept-btn" onClick={() => onAccept(req)} disabled={busyId === req.id}>
                  {busyId === req.id ? "처리중…" : "수락"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}