import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, functions } from "../firebase";

const FriendContext = createContext(null);

export function FriendProvider({ children }) {
  const [uid, setUid] = useState(null);
  const [requests, setRequests] = useState([]); // 받은 신청(pending)
  const [friends, setFriends] = useState([]);   // 내 친구 목록

  // 로그인 UID
  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (u) => setUid(u ? u.uid : null));
  }, []);

  // 받은 요청 구독
  useEffect(() => {
    if (!uid) { setRequests([]); return; }
    const q = query(collection(db, "friendRequests"), where("to", "==", uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRequests(rows.filter((r) => r.status === "pending"));
      },
      (err) => console.error("[friendRequests listen error]", err)
    );
    return () => unsub();
  }, [uid]);

  // 내 친구 목록 구독: users/{uid}/friends → users/{friendUid} 조인
  useEffect(() => {
    if (!uid) { setFriends([]); return; }
    const unsub = onSnapshot(
      collection(db, "users", uid, "friends"),
      async (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) })); // id = friendUid
        const profiles = await Promise.all(
          rows.map(async (r) => {
            const ps = await getDoc(doc(db, "users", r.id));
            const p = ps.data() || {};
            const name = p.name ?? p.displayName ?? p.id ?? r.id; // 사람이 읽는 이름
            // ✅ 아이디/핸들 정보는 제공하지 않음 (|와 ID가 화면에 뜨지 않도록)
            return { uid: r.id, name };
          })
        );
        setFriends(profiles);
      },
      (err) => console.error("[friends listen error]", err)
    );
    return () => unsub();
  }, [uid]);

  // 수락/거절
  const respond = httpsCallable(functions, "respondFriendRequest");

  const acceptRequest = async (requestIdOrObj) => {
    const requestId =
      typeof requestIdOrObj === "object" ? requestIdOrObj?.requestId : requestIdOrObj;
    if (!requestId) return;
    try {
      await respond({ requestId, action: "accept" });
    } catch (e) {
      console.error("[acceptRequest]", e?.code, e?.message);
      alert(e?.message ?? "수락 실패");
    }
  };

  const rejectRequest = async (requestIdOrObj) => {
    const requestId =
      typeof requestIdOrObj === "object" ? requestIdOrObj?.requestId : requestIdOrObj;
    if (!requestId) return;
    try {
      await respond({ requestId, action: "reject" });
    } catch (e) {
      console.error("[rejectRequest]", e?.code, e?.message);
      alert(e?.message ?? "거절 실패");
    }
  };

  const value = useMemo(
    () => ({ uid, requests, friends, acceptRequest, rejectRequest }),
    [uid, requests, friends]
  );

  return <FriendContext.Provider value={value}>{children}</FriendContext.Provider>;
}

export function useFriend() {
  const ctx = useContext(FriendContext);
  if (!ctx) throw new Error("useFriend must be used within a FriendProvider");
  return ctx;
}