import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { auth, app } from "../firebase";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  where,
  writeBatch,
  deleteField,        // ✅ 날짜별 완료 해제에 사용
} from "firebase/firestore";

const ScheduleContext = createContext(null);

/* ===== 유틸: YYYY-MM-DD 파싱/포맷 ===== */
const parseYMD = (s) => {
  const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = +m[1], mo = +m[2] - 1, d = +m[3];
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
};
const fmtYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

/* 특정 날짜에 완료됐는지 판정 */
const isDoneOn = (todo, dayKey) => {
  if (todo?.doneDates && typeof todo.doneDates === "object") {
    return !!todo.doneDates[dayKey];
  }
  // (호환) 1회성 일정만 기존 done 불린 사용
  const isOnce = todo?.repeat === "none" || todo?.repeat === "한번" || !todo?.repeat;
  if (isOnce && typeof todo?.done === "boolean") {
    return todo.startDate === dayKey ? !!todo.done : false;
  }
  return false;
};

/* ===== 반복 일정 확장 (각 발생 일자 생성) ===== */
function expandOccurrences(todo) {
  const start = parseYMD(todo.startDate || todo.date);
  const end = parseYMD(todo.endDate || todo.startDate || todo.date);
  const repeat = todo.repeat || "none";
  if (!start) return [];
  const last = end && end >= start ? end : start;

  const out = [];
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const addMonthsSafe = (d, n) => {
    const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
    const target = new Date(y, m + n, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(day, lastDay));
    return target;
  };

  const pushWithDate = (dateObj) => {
    const key = fmtYMD(dateObj);
    out.push({
      ...todo,
      __occurrenceDate: key,
      __isDone: isDoneOn(todo, key), // ✅ 해당 날짜의 완료 여부를 같이 내려줌
    });
  };

  if (repeat === "none") {
    pushWithDate(start);
  } else if (repeat === "daily") {
    for (let cur = new Date(start); cur <= last; cur = addDays(cur, 1)) pushWithDate(cur);
  } else if (repeat === "weekly") {
    for (let cur = new Date(start); cur <= last; cur = addDays(cur, 7)) pushWithDate(cur);
  } else if (repeat === "monthly") {
    for (let i = 0, cur = new Date(start); cur <= last; i += 1, cur = addMonthsSafe(start, i)) {
      pushWithDate(cur);
    }
  } else {
    pushWithDate(start);
  }
  return out;
}

export function ScheduleProvider({ children }) {
  const db = useMemo(() => getFirestore(app), []);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔄 로그인 유저의 todos 실시간 구독
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setTodos([]); setLoading(false); return;
      }
      const q = query(
        collection(db, "users", user.uid, "todos"),
        orderBy("startDate", "asc")
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setTodos(list);
          setLoading(false);
        },
        (err) => { console.error("todos onSnapshot error:", err); setLoading(false); }
      );
      return () => unsub();
    });
    return () => unsubAuth();
  }, [db]);

  // ✅ 추가 (doneDates 기본 제공)
  const addTodo = async ({
    title, categoryId = null, categoryName = null,
    startDate, endDate, repeat = "none", isPublic = false, memo = "",
  }) => {
    const user = auth.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    if (!title || !String(title).trim()) throw new Error("제목을 입력해주세요.");

    const payload = {
      title: String(title).trim(),
      categoryId: categoryId ?? null,
      categoryName: categoryName ?? null,
      startDate,
      endDate: endDate || startDate,
      repeat,
      isPublic: !!isPublic,
      // (호환용) 단건 일정에서는 기존 done도 사용할 수 있음 – 기본은 false
      done: false,
      doneDates: {},                 // ✅ 날짜별 완료 맵 (반복/단건 공통)
      memo: String(memo || ""),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await addDoc(collection(db, "users", user.uid, "todos"), payload);
  };

  // ✏️ 수정
  const updateTodo = async (id, patch) => {
    const user = auth.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    if (!id) throw new Error("todo id가 없습니다.");
    const ref = doc(db, "users", user.uid, "todos", id);
    await updateDoc(ref, { ...(patch || {}), updatedAt: serverTimestamp() });
  };

  // ☑️ (호환) 전역 done 토글 – 단건 일정에서만 의미 있음
  const toggleTodoDone = async (id, done) => {
    await updateTodo(id, { done: !!done });
  };

  // ☑️ 날짜별 완료 토글 (반복/단건 공통, 권장 사용)
  const toggleTodoDoneOnDate = async (id, dayKey, next) => {
    const user = auth.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    if (!id || !dayKey) throw new Error("id 또는 날짜 키가 없습니다.");
    const ref = doc(db, "users", user.uid, "todos", id);

    if (next) {
      await updateDoc(ref, { [`doneDates.${dayKey}`]: true, updatedAt: serverTimestamp() });
    } else {
      await updateDoc(ref, { [`doneDates.${dayKey}`]: deleteField(), updatedAt: serverTimestamp() });
    }
  };

  // 🗑️ 삭제
  const deleteTodo = async (todoId) => {
    const user = auth.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    if (!todoId) throw new Error("삭제할 항목 id가 없습니다.");
    await deleteDoc(doc(db, "users", user.uid, "todos", todoId));
  };

  // 🧹 카테고리 삭제 시 하위 투두 일괄 삭제
  const deleteTodosByCategory = async (categoryIdOrName) => {
    const user = auth.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    const todosRef = collection(db, "users", user.uid, "todos");
    const batch = writeBatch(db);

    const snapById = await getDocs(query(todosRef, where("categoryId", "==", categoryIdOrName)));
    snapById.forEach((d) => batch.delete(d.ref));
    const snapByName = await getDocs(query(todosRef, where("categoryName", "==", categoryIdOrName)));
    snapByName.forEach((d) => batch.delete(d.ref));

    await batch.commit();
  };

  // 🔎 날짜별 맵 (반복 포함 확장, 각 항목에 __isDone 포함)
  const schedulesByDate = useMemo(() => {
    if (!Array.isArray(todos)) return {};
    const map = {};
    for (const t of todos) {
      const occ = expandOccurrences(t);
      for (const o of occ) {
        const key = o.__occurrenceDate;
        (map[key] ||= []).push(o); // o.__isDone 가 이미 포함됨
      }
    }
    return map;
  }, [todos]);

  const value = {
    schedules: todos,
    todos,
    loading,
    addTodo,
    updateTodo,
    toggleTodoDone,          // (단건용 호환)
    toggleTodoDoneOnDate,    // ✅ 날짜별 완료 토글 (권장)
    deleteTodo,
    deleteTodosByCategory,
    schedulesByDate,
    isDoneOn,                // ✅ 어디서든 재사용 가능
    fmtYMD,
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

export const useSchedule = () => useContext(ScheduleContext);
