// src/contexts/CategoryContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, app } from "../firebase";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

const CategoryContext = createContext(null);

export function CategoryProvider({ children }) {
  const db = useMemo(() => getFirestore(app), []);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // 로그인된 사용자의 카테고리 실시간 구독 (최초 한 번만)
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setCategories([]);
        setLoading(false);
        return;
      }
      const q = query(
        collection(db, "users", user.uid, "categories"),
        orderBy("createdAt", "asc")
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCategories(list);
          setLoading(false);
        },
        (err) => {
          console.error("categories onSnapshot error:", err);
          setLoading(false);
        }
      );
      return () => unsub();
    });
    return () => unsubAuth();
  }, [db]);

  const addCategory = async ({ name, color }) => {
    const user = auth.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    if (!name?.trim()) throw new Error("카테고리 이름을 입력하세요.");

    await addDoc(collection(db, "users", user.uid, "categories"), {
      name: name.trim(),
      color: color || "#8ED080",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateCategoryColor = async (categoryId, newColor) => {
    const user = auth.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    if (!categoryId) throw new Error("categoryId가 없습니다.");

    await updateDoc(doc(db, "users", user.uid, "categories", categoryId), {
      color: newColor || "#8ED080",
      updatedAt: serverTimestamp(),
    });
  };

  const value = {
    categories,
    loading,
    addCategory,
    updateCategoryColor,  // 색상 변경용
  };

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

export const useCategory = () => useContext(CategoryContext);
