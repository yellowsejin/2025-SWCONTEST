import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/scss/section/Friends.scss";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { app } from "../../firebase";

export default function FriendsList() {
  const nav = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * 회원가입/프로필/친구문서 어디에 저장됐든
   * - 다양한 키 후보를 탐색해서
   * - 문자열로 변환하고
   * - 앞뒤 공백 제거 후
   * - 소문자로 정규화하여 반환
   */
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
          // 1) 친구 문서에서 uid + (표시용 id 후보) 수집
          const base = snap.docs.map((d) => {
            const data = d.data() || {};
            return {
              uid: data.uid || d.id,
              idFromFriendDoc: pickId(data), // 다양한 키를 지원 + 소문자 정규화
            };
          });

          // 2) 각 친구 uid의 users/{uid} 프로필과 조인
          const rows = await Promise.all(
            base.map(async ({ uid, idFromFriendDoc }) => {
              if (idFromFriendDoc) {
                // 친구 문서에 이미 id가 있으면 그걸 사용
                return { uid, id: idFromFriendDoc, idLabel: idFromFriendDoc };
              }
              try {
                const s = await getDoc(doc(db, "users", uid));
                const idFromProfile = s.exists() ? pickId(s.data()) : "";
                // UID 폴백 제거: id가 없으면 빈 문자열
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
        ) : friends.length === 0 ? (
          <p className="empty">친구가 없습니다.</p>
        ) : (
          friends.map((f) => (
            <div className="friend-card" key={f.uid}>
              <span className="info">
                {/* ✅ 오직 가입 ID(소문자 정규화)만 노출. 없으면 'ID없음' */}
                <strong className="name">{f.idLabel || "ID없음"}</strong>
              </span>
              <div className="btn-group">
                <button className="visit-btn" onClick={() => nav(`/rooms/${f.uid}`)}>방문</button>
                <button className="calendar-btn" onClick={() => nav(`/calendar/${f.uid}`)}>캘린더</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}