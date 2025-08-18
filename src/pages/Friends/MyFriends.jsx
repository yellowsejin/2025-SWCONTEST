// src/pages/Friends/MyFriends.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/scss/section/Friends.scss";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { app } from "../../firebase";

export default function MyFriends() {
  const nav = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const pickId = (data = {}) => {
    const candidates = [
      "id", "Id", "ID",
      "userId", "userid",
      "username", "handle",
      "name", "displayName",
    ];
    for (const key of candidates) {
      if (data && Object.prototype.hasOwnProperty.call(data, key)) {
        const v = data[key];
        if (v != null && v !== "") {
          return String(v).trim().toLowerCase();
        }
      }
    }
    return "";
  };

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const offAuth = onAuthStateChanged(auth, (me) => {
      if (!me) {
        setFriends([]);
        setLoading(false);
        return;
      }

      const colRef = collection(db, `users/${me.uid}/friends`);
      const offSnap = onSnapshot(
        colRef,
        async (snap) => {
          const base = snap.docs.map((d) => {
            const data = d.data() || {};
            return {
              uid: data.uid || d.id,
              idFromFriendDoc: pickId(data),
            };
          });

          const rows = await Promise.all(
            base.map(async ({ uid, idFromFriendDoc }) => {
              if (idFromFriendDoc) {
                return { uid, id: idFromFriendDoc, idLabel: idFromFriendDoc };
              }
              try {
                const s = await getDoc(doc(db, "users", uid));
                const idFromProfile = s.exists() ? pickId(s.data()) : "";
                return { uid, id: idFromProfile || "", idLabel: idFromProfile || "" };
              } catch {
                return { uid, id: "", idLabel: "" };
              }
            })
          );

          setFriends(rows);
          setLoading(false);
        },
        () => {
          setFriends([]);
          setLoading(false);
        }
      );

      return () => offSnap();
    });

    return () => offAuth();
  }, []);

  return (
    <div id="friends-root" className="friends-list-page">
      <div className="friends-header">
        <img alt="back" className="back" src="/img/back.png" onClick={() => nav(-1)} />
        <h2 className="title">내 친구</h2>
        <img alt="gear" className="gear" src="/img/gear.png" onClick={() => nav("/settings")} />
      </div>

      <div className="friends-body">
        {loading ? (
          <p className="empty">불러오는 중…</p>
        ) : friends.length === 0 ? (
          <p className="empty">친구가 없습니다.</p>
        ) : (
          friends.map((f) => (
            <div className="friend-card" key={f.uid}>
              <span className="info">
                <strong className="name">{f.idLabel || "ID없음"}</strong>
              </span>
              <div className="btn-group">
                <button className="visit-btn" onClick={() => nav(`/room/${f.uid}`)}>
                  방문
                </button>
                {/* ✅ 캘린더 버튼 경로 수정 */}
                <button
                  className="calendar-btn"
                  onClick={() => nav(`/friends/${f.uid}/calendar`)}
                >
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


