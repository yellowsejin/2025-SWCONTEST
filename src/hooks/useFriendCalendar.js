import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { app } from "../firebase";

// YYYY-MM-DD 문자열 변환
function toYMD(v) {
  if (!v) return null;
  if (typeof v === "object" && typeof v.toDate === "function") {
    const d = v.toDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }
  if (typeof v === "string") return v.slice(0, 10);
  return null;
}

// 공개 여부 확인
function isPublicItem(it) {
  if (typeof it?.isPublic === "boolean") return it.isPublic;
  if (typeof it?.public === "boolean") return it.public;
  const s = String(it?.isPublic ?? it?.public ?? "").toLowerCase();
  return s === "true";
}

export default function useFriendCalendar(myUid, friendDocId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendUid, setFriendUid] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const db = getFirestore(app);

  // 1) friends/{friendDocId} 에서 친구 uid 읽기
  useEffect(() => {
    if (!myUid || !friendDocId) {
      setLoading(false);
      return;
    }

    const ref = doc(db, "users", myUid, "friends", friendDocId);
    console.log("🔍 친구 문서 확인:", ref.path);

    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) {
          const uid = snap.data().uid;
          console.log("✅ friendUid 읽힘:", uid);
          setFriendUid(uid);
        } else {
          console.warn("❌ 친구 문서 없음:", myUid, friendDocId);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("❌ 친구 문서 읽기 오류:", err);
        setLoading(false);
      });
  }, [myUid, friendDocId, db]);

  // 2) friendRequests 에서 status 확인
  useEffect(() => {
    if (!myUid || !friendUid) return;

    const q = query(
      collection(db, "friendRequests"),
      where("status", "==", "accepted")
    );

    getDocs(q)
      .then((snap) => {
        console.log("📑 friendRequests 검색 결과:", snap.size);
        const found = snap.docs.some((d) => {
          const data = d.data();
          console.log("➡️ friendRequest 문서:", data);
          return (
            (data.from === myUid && data.to === friendUid) ||
            (data.from === friendUid && data.to === myUid)
          );
        });

        if (found) {
          console.log("✅ 친구 상태: accepted");
          setAccepted(true);
        } else {
          console.warn("❌ 아직 친구 아님");
          setAccepted(false);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("❌ friendRequests 확인 오류:", err);
        setAccepted(false);
        setLoading(false);
      });
  }, [myUid, friendUid, db]);

  // 3) 친구 todos 구독 (공개 일정만)
  useEffect(() => {
    if (!friendUid || !accepted) return;

    console.log("📂 구독 시작 → users/", friendUid, "/todos");
    setLoading(true);

    const q = query(
      collection(db, "users", friendUid, "todos"),
      where("isPublic", "==", true)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        console.log("📥 todos 문서 개수:", snap.size);

        const arr = snap.docs.map((d) => {
          const raw = d.data();

          return {
            id: d.id,
            title: raw.title || raw.categoryName || "제목없음",
            startDate: toYMD(raw.startDate) || toYMD(raw.createdAt),
            endDate: toYMD(raw.endDate),
            repeat: raw.repeat || "none",
            done: raw.done ?? raw.completed ?? false,
            color: raw.color ?? raw.categoryColor ?? "#8ED080",
            isPublic: isPublicItem(raw),
          };
        });

        console.log("📥 todos 데이터:", arr);
        setItems(arr);
        setLoading(false);
      },
      (err) => {
        console.error("❌ 친구 todos 구독 오류:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [friendUid, accepted, db]);

  return { items, loading };
}
