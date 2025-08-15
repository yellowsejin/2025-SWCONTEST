// src/contexts/FriendContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  getFirestore, collection, onSnapshot, doc, getDoc,
} from "firebase/firestore";
import { auth, db as _db } from "../firebase";

const FriendContext = createContext(null);
export const useFriend = () => useContext(FriendContext);

export function FriendProvider({ children }) {
  const db = useMemo(() => _db || getFirestore(), []);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubAuth = null, unsubFriends = null;

    unsubAuth = onAuthStateChanged(auth, (u) => {
      if (unsubFriends) { unsubFriends(); unsubFriends = null; }
      if (!u) { setFriends([]); setLoading(false); return; }

      setLoading(true);

      const joinProfiles = async (uids) => {
        const uniq = Array.from(new Set(uids.filter(Boolean)));
        const rows = await Promise.all(uniq.map(async (peerUid) => {
          let s = await getDoc(doc(db, "users", peerUid));
          if (!s.exists()) s = await getDoc(doc(db, "users_public", peerUid));
          const p = s.exists() ? s.data() : {};
          return {
            uid: peerUid,
            name: p.name || p.nickname || "이름없음",
            userId: p.userId || p.email || peerUid,
          };
        }));
        setFriends(rows);
        setLoading(false);
      };

      unsubFriends = onSnapshot(collection(db, "users", u.uid, "friends"), (snap) => {
        const uids = snap.docs
          .filter(d => {
            const v = d.data() || {};
            return v.accepted === true || v.status === "accepted";
          })
          .map(d => (d.data().uid || d.data().friendUid || d.id));
        joinProfiles(uids);
      }, () => {
        setFriends([]);
        setLoading(false);
      });
    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubFriends) unsubFriends();
    };
  }, [db]);

  const value = useMemo(() => ({ friends, loading }), [friends, loading]);
  return <FriendContext.Provider value={value}>{children}</FriendContext.Provider>;
}
