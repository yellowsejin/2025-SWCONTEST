// src/contexts/FriendContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  getFirestore, collection, onSnapshot, doc, getDoc, query, where
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, db as _db, app } from "../firebase";

const FriendContext = createContext(null);
export const useFriend = () => useContext(FriendContext);

export function FriendProvider({ children }) {
  const db = useMemo(() => _db || getFirestore(), []);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cloud Functions
  const functions = getFunctions(app);
  const callRespondFriendRequest = httpsCallable(functions, "respondFriendRequest");

  const acceptRequest = async (requestId) => {
    await callRespondFriendRequest({ requestId, action: "accept" });
  };

  const rejectRequest = async (requestId) => {
    await callRespondFriendRequest({ requestId, action: "reject" });
  };

  // 문자열 안전 트림 → 빈 문자열이면 undefined 반환
  const safe = (s) => {
    if (typeof s !== "string") return undefined;
    const t = s.trim();
    return t === "" ? undefined : t;
  };

  useEffect(() => {
    let unsubAuth = null, unsubFriends = null, unsubRequests = null;

    unsubAuth = onAuthStateChanged(auth, (u) => {
      // 기존 구독 해제
      if (unsubFriends) { unsubFriends(); unsubFriends = null; }
      if (unsubRequests) { unsubRequests(); unsubRequests = null; }

      if (!u) {
        setFriends([]);
        setRequests([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const joinProfiles = async (uids) => {
        const uniq = Array.from(new Set(uids.filter(Boolean)));
        const rows = await Promise.all(
          uniq.map(async (peerUid) => {
            // users 우선 → 없으면 users_public
            let s = await getDoc(doc(db, "users", peerUid));
            if (!s.exists()) s = await getDoc(doc(db, "users_public", peerUid));
            const p = s.exists() ? (s.data() || {}) : {};

            // ✅ 데이터 층에서는 기본 문자열(예: '이름없음', '로딩중...')을 절대 넣지 않음
            const name = safe(p.name) ?? safe(p.nickname) ?? undefined;

            return {
              uid: peerUid,
              name, // undefined일 수 있음 → 렌더에서 `name ?? "로딩중..."` 등으로 처리
              userId: safe(p.userId) ?? safe(p.email) ?? peerUid,
            };
          })
        );
        setFriends(rows);
        setLoading(false);
      };

      // 내 친구 목록 구독
      unsubFriends = onSnapshot(
        collection(db, "users", u.uid, "friends"),
        (snap) => {
          const uids = snap.docs
            .filter((d) => {
              const v = d.data() || {};
              return v.accepted === true || v.status === "accepted";
            })
            .map((d) => {
              const v = d.data() || {};
              return v.uid || v.friendUid || d.id;
            });
          joinProfiles(uids);
        },
        () => {
          setFriends([]);
          setLoading(false);
        }
      );

      // 받은 친구 신청 구독
      unsubRequests = onSnapshot(
        query(
          collection(db, "friendRequests"),
          where("to", "==", u.uid),
          where("status", "==", "pending")
        ),
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setRequests(list);
        },
        () => setRequests([])
      );
    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubFriends) unsubFriends();
      if (unsubRequests) unsubRequests();
    };
  }, [db]);

  // ⚠️ 렌더하는 컴포넌트에서는 반드시 null 병합 연산자(??)를 사용하세요.
  // 예) const displayName = selected?.name ?? selected?.nickname ?? "로딩중...";

  const value = useMemo(
    () => ({ friends, requests, loading, acceptRequest, rejectRequest }),
    [friends, requests, loading]
  );

  return <FriendContext.Provider value={value}>{children}</FriendContext.Provider>;
}
