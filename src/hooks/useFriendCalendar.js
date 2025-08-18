// src/hooks/useFriendCalendar.js
import { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { app } from "../firebase";

const db = getFirestore(app);

function toYMD(v) {
  if (!v) return null;
  if (typeof v?.toDate === "function") {
    const d = v.toDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  if (typeof v === "string") return v.slice(0,10);
  return null;
}

function isPublicItem(it) {
  if (typeof it?.isPublic === "boolean") return it.isPublic;
  if (typeof it?.public === "boolean") return it.public;
  const s = String(it?.isPublic ?? it?.public ?? "").toLowerCase();
  return s === "true";
}

export default function useFriendCalendar(myUid, friendUid) {
  const [schedules, setSchedules] = useState([]);
  const [categories, setCategories] = useState([]);   // 🔥 추가
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!myUid || !friendUid) return;

    setLoading(true);
    setError(null);

    // ✅ 친구 todos 구독
    const todoRef = collection(db, "users", friendUid, "todos");
    const unsubTodos = onSnapshot(
      todoRef,
      (snap) => {
        const items = [];
        snap.forEach((doc) => {
          const data = doc.data();
          if (isPublicItem(data)) {
            items.push({ id: doc.id, ...data, date: toYMD(data.date) });
          }
        });
        setSchedules(items);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("친구 일정을 가져오는 중 오류");
        setLoading(false);
      }
    );

    // ✅ 친구 categories 구독
    const catRef = collection(db, "users", friendUid, "categories");
    const unsubCats = onSnapshot(catRef, (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubTodos();
      unsubCats();
    };
  }, [myUid, friendUid]);

  return { schedules, categories, loading, error }; // 🔥 categories 같이 반환
}
