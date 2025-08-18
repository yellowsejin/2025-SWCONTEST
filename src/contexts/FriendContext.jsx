// src/contexts/FriendContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  getFirestore, collection, onSnapshot, doc, getDoc, query, where
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions"; // 🔥 추가
import { auth, db as _db, app } from "../firebase";

const FriendContext = createContext(null);
export const useFriend = () => useContext(FriendContext);

export function FriendProvider({ children }) {
  const db = useMemo(() => _db || getFirestore(), []);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);   
  const [loading, setLoading] = useState(true);

  // 🔥 respondFriendRequest 연결
  const functions = getFunctions(app);
  const callRespondFriendRequest = httpsCallable(functions, "respondFriendRequest");

  const acceptRequest = async (requestId) => {
    await callRespondFriendRequest({ requestId, action: "accept" });
  };

  const rejectRequest = async (requestId) => {
    await callRespondFriendRequest({ requestId, action: "reject" });
  };

  useEffect(() => {
    let unsubAuth = null, unsubFriends = null, unsubRequests = null;

    unsubAuth = onAuthStateChanged(auth, (u) => {
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
        const rows = await Promise.all(uniq.map(async (peerUid) => {
          let s = await getDoc(doc(db, "users", peerUid));
          if (!s.exists()) s = await getDoc(doc(db, "users_public", peerUid));
          const p = s.exists() ? s.data() : {};
          return {
            uid: peerUid,
            name: p.name || p.nickname || "로딩중...",
            userId: p.userId || p.email || peerUid,
          };
        }));
        setFriends(rows);
        setLoading(false);
      };

      // 내 친구 목록 구독
      unsubFriends = onSnapshot(
        collection(db, "users", u.uid, "friends"),
        (snap) => {
          const uids = snap.docs
            .filter(d => {
              const v = d.data() || {};
              return v.accepted === true || v.status === "accepted";
            })
            .map(d => (d.data().uid || d.data().friendUid || d.id));
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
          const list = snap.docs.map(d => ({
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
      if (unsubRequests) unsubRequests();
    };
  }, [db]);

  // Context value에 함수 포함
  const value = useMemo(
    () => ({ friends, requests, loading, acceptRequest, rejectRequest }),
    [friends, requests, loading]
  );

  return <FriendContext.Provider value={value}>{children}</FriendContext.Provider>;
}
