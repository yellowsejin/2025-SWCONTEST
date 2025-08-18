import { useEffect, useState } from "react";
import { getFirestore, collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { app } from "../firebase";  // ✅ 경로 수정

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
  const db = getFirestore(app);

  // 1) 친구 UID 불러오기
  useEffect(() => {
    if (!myUid || !friendDocId) {
      setLoading(false); // ✅ uid 없으면 바로 로딩 해제
      return;
    }

    const ref = doc(db, "users", myUid, "friends", friendDocId);
    console.log("🔍 친구 문서 확인:", ref.path);

    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        const uid = snap.data().uid;
        console.log("✅ friendUid 읽힘:", uid);
        setFriendUid(uid);
        setLoading(false); // ✅ 친구 uid 읽었을 때도 로딩 해제
      } else {
        console.warn("❌ 친구 문서 없음:", myUid, friendDocId);
        setLoading(false);
      }
    }).catch((err) => {
      console.error("❌ 친구 문서 읽기 오류:", err);
      setLoading(false);
    });
  }, [myUid, friendDocId, db]);

  // 2) 친구 todos 구독
  useEffect(() => {
    if (!friendUid) return;

    console.log("📂 구독 시작 → users/", friendUid, "/todos");
    setLoading(true); // ✅ 새 구독 시작하면 로딩 켜기

    const colRef = collection(db, "users", friendUid, "todos");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        console.log("📥 todos 문서 개수:", snap.size);

        const arr = snap.docs.map((d) => {
          const raw = d.data();
          return {
            id: d.id,
            ...raw,
            startDate: toYMD(raw.startDate) || toYMD(raw.date),
            endDate: toYMD(raw.endDate) || toYMD(raw.date),
          };
        });

        console.log("📥 todos 데이터:", arr);
        setItems(arr.filter(isPublicItem));
        setLoading(false); // ✅ 데이터 들어왔으니 로딩 해제
      },
      (err) => {
        console.error("❌ 친구 todos 구독 오류:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [friendUid, db]);

  return { items, loading };
}
