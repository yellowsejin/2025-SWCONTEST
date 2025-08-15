// src/hooks/useFriendCalendar.js
import { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { app } from "../firebase";

// YYYY-MM-DD 문자열로 정규화
function toYMD(v) {
  if (!v) return null;
  // Firestore Timestamp?
  if (typeof v === "object" && typeof v.toDate === "function") {
    const d = v.toDate();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  // 이미 문자열?
  if (typeof v === "string") return v.slice(0, 10);
  return null;
}

function isPublicItem(it) {
  if (typeof it?.isPublic === "boolean") return it.isPublic;
  if (typeof it?.public === "boolean") return it.public;
  const s = String(it?.isPublic ?? it?.public ?? "").toLowerCase();
  return s === "true"; // "true"/"false" 문자열 대응
}

/**
 * 친구 UID의 공개 일정만 구독 (보안규칙이 공개 문서만 허용한다고 가정)
 * 컬렉션명: users/{friendUid}/calendar  (다르면 아래 경로만 바꿔줘)
 */
export default function useFriendCalendar(friendUid) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore(app);

  useEffect(() => {
    if (!friendUid) return;
    setLoading(true);

    const colRef = collection(db, "users", friendUid, "calendar"); // ← 컬렉션명 다르면 여기만 수정
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const arr = snap.docs.map((d) => {
          const raw = d.data();
          const startDate = toYMD(raw.startDate) || toYMD(raw.date) || raw.startDate || raw.date;
          const endDate =
            toYMD(raw.endDate) ||
            startDate || // end 없으면 start로 처리(단일 일자)
            raw.endDate;

        return {
            id: d.id,
            ...raw,
            startDate,
            endDate,
          };
        });

        // 공개만
        setItems(arr.filter(isPublicItem));
        setLoading(false);
      },
      (err) => {
        console.error("친구 캘린더 구독 오류:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [friendUid]);

  return { items, loading };
}
