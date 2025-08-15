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

  // 로그인된 사용자의 카테고리 실시간 구독
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

  /** 카테고리 추가 */
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

  /** ✅ 카테고리 이름만 수정 */
  const updateCategoryName = async (categoryId, newName) => {
    const user = auth.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    if (!categoryId) throw new Error("categoryId가 없습니다.");
    if (!newName?.trim()) throw new Error("이름을 입력하세요.");

    await updateDoc(doc(db, "users", user.uid, "categories", categoryId), {
      name: newName.trim(),
      updatedAt: serverTimestamp(),
    });
  };

  /** ✅ 카테고리 색상만 수정 */
  const updateCategoryColor = async (categoryId, newColor) => {
    const user = auth.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    if (!categoryId) throw new Error("categoryId가 없습니다.");

    await updateDoc(doc(db, "users", user.uid, "categories", categoryId), {
      color: newColor || "#8ED080",
      updatedAt: serverTimestamp(),
    });
  };

  /** 이름/색 동시 수정(옵셔널) */
  const updateCategory = async (categoryId, { name, color }) => {
    const user = auth.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    if (!categoryId) throw new Error("categoryId가 없습니다.");

    const payload = { updatedAt: serverTimestamp() };
    if (typeof name === "string") payload.name = name.trim();
    if (typeof color === "string") payload.color = color;

    await updateDoc(doc(db, "users", user.uid, "categories", categoryId), payload);
  };

  /** 카테고리 삭제 + 하위 todos도 같이 삭제(요청하신 동작) */
  const deleteCategory = async (categoryId) => {
    const user = auth.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    if (!categoryId) throw new Error("categoryId가 없습니다.");

    const batch = writeBatch(db);

    // 1) 카테고리 문서 삭제
    batch.delete(doc(db, "users", user.uid, "categories", categoryId));

    // 2) 이 카테고리를 참조하는 todos 삭제 (categoryId로 연결된 것)
    const todosRef = collection(db, "users", user.uid, "todos");
    const byIdSnap = await getDocs(query(todosRef, where("categoryId", "==", categoryId)));
    byIdSnap.forEach((d) => batch.delete(d.ref));

    // 3) 혹시 과거 데이터에 categoryName만 저장된 경우도 방어(이름으로 삭제)
    const catDoc = categories.find((c) => c.id === categoryId);
    if (catDoc?.name) {
      const byNameSnap = await getDocs(query(todosRef, where("categoryName", "==", catDoc.name)));
      byNameSnap.forEach((d) => batch.delete(d.ref));
    }

    await batch.commit();
  };

  const value = {
    categories,
    loading,
    addCategory,
    updateCategoryName,   // ← ✅ 팝업에서 쓰는 함수
    updateCategoryColor,  // ← 색상 변경용
    updateCategory,       // ← 둘 다 바꿀 때
    deleteCategory,       // ← 삭제 + 하위 todos 삭제
  };

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

export const useCategory = () => useContext(CategoryContext);
