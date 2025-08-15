// src/api/categories.js
import { CF } from "../constants/functions";
import { getIdTokenOrThrow } from "../utils/authToken";
import {
  collection, query, orderBy, onSnapshot, getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

// 실시간/단건 읽기용 참조
const userCategoriesCol = (uid) => collection(db, "users", uid, "categories");

// ★ Functions: 추가
export async function apiAddCategory({ uid, name, color }) {
  const idToken = await getIdTokenOrThrow();
  const res = await fetch(CF.addCategory, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ uid, name, color }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) throw new Error(data?.error || "카테고리 추가 실패");
  return data; // { success: true, id: "<newId>" }
}

// ★ Functions: 삭제
export async function apiDeleteCategory({ uid, categoryId }) {
  const idToken = await getIdTokenOrThrow();
  const res = await fetch(CF.deleteCategory, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ uid, categoryId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) throw new Error(data?.error || "카테고리 삭제 실패");
  return data; // { success: true }
}

// 단건 가져오기(초기 로드용이 필요하면)
export async function fetchCategories(uid) {
  const q = query(userCategoriesCol(uid), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// 실시간 구독(권장: UI 자동 반영)
export function subscribeCategories(uid, cb) {
  const q = query(userCategoriesCol(uid), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(list);
  });
}
