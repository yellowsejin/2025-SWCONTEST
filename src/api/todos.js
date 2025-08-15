// src/api/todos.js
import { CF } from "../constants/functions";
import { getIdTokenOrThrow } from "../utils/authToken";
import { db } from "../firebase";
import {
  collection, onSnapshot, orderBy, query, getDocs,
} from "firebase/firestore";

// 유저별 캘린더 컬렉션 참조
const userCalendarCol = (uid) => collection(db, "users", uid, "calendar");

// ===== Functions 호출 =====

// ➕ 투두 추가
export async function apiAddTodo({
  uid,
  title,
  categoryId,
  startDate, // "YYYY-MM-DD"
  endDate,   // "YYYY-MM-DD"
  repeat = "none",
  isPublic = false,
  memo = "",
}) {
  const idToken = await getIdTokenOrThrow();
  const res = await fetch(CF.addTodo, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      uid, title, categoryId, startDate, endDate, repeat, isPublic, memo,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    throw new Error(data?.error || "투두 추가 실패");
  }
  // { success: true, id: "<newId>" }
  return data;
}

// 🗑️ 투두 삭제
export async function apiDeleteTodo({ uid, todoId }) {
  const idToken = await getIdTokenOrThrow();
  const res = await fetch(CF.deleteTodo, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ uid, todoId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    throw new Error(data?.error || "투두 삭제 실패");
  }
  // { success: true }
  return data;
}

// ===== 읽기(실시간) =====
// 간단/안전하게 전체 구독 후 클라이언트에서 날짜 필터링 (초기 버전)
// 데이터가 많아지면 월 범위 쿼리로 바꾸자.
export function subscribeAllTodos(uid, cb) {
  const q = query(userCalendarCol(uid), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(list);
  });
}

// 단발성 전체 가져오기(원하면)
export async function fetchAllTodos(uid) {
  const q = query(userCalendarCol(uid), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
