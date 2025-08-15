// src/pages/Calendar/DailyList.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useCategory } from "../../contexts/CategoryContext";
import { useSchedule } from "../../contexts/ScheduleContext";
import { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth"; // 그대로 사용
import Category from "./Category";
import AddDailyItem from "./AddDailyItem";
import "../../assets/scss/section/DailyList.scss";

/* ====== completeTodo HTTP 유틸 (기존 그대로) ====== */
const PROJECT_ID = "dooop-69a1b";
const COMPLETE_TODO_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/completeTodo`;

async function completeTodoHttp(uid, todoId) {
  const res = await fetch(COMPLETE_TODO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, todoId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success !== true) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}
/* ============================================== */

const parseYMD = (s) => {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = +m[1], mo = +m[2] - 1, d = +m[3];
  return new Date(y, mo, d);
};
const formatKR = (d) =>
  d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

export default function DailyList() {
  const { date } = useParams(); // "YYYY-MM-DD"
  const nav = useNavigate();

  const { categories } = useCategory();
  const { schedules, schedulesByDate, loading, toggleTodoDone } = useSchedule();

  const [currentDate, setCurrentDate] = useState(() => parseYMD(date) || new Date());
  useEffect(() => {
    setCurrentDate(parseYMD(date) || new Date());
  }, [date]);

  const dayKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

  const itemsForThisDate = useMemo(() => {
    if (schedulesByDate && schedulesByDate[dayKey]) return schedulesByDate[dayKey];
    if (Array.isArray(schedules)) return schedules.filter((t) => (t.startDate || t.date) === dayKey);
    return [];
  }, [schedulesByDate, schedules, dayKey]);

  // ✅ 최소수정: 카테고리 버킷을 id와 name 모두로 매핑
  const grouped = useMemo(() => {
    const byKey = new Map();
    categories.forEach((c) => {
      const bucket = { cat: c, items: [] };
      if (c?.id)   byKey.set(String(c.id), bucket);   // id 접근
      if (c?.name) byKey.set(String(c.name), bucket); // name 접근
    });

    itemsForThisDate.forEach((t) => {
      const key =
        t.categoryId != null
          ? String(t.categoryId)
          : t.categoryName || t.category;
      if (!key) return;
      if (!byKey.has(key)) return;
      byKey.get(key).items.push(t);
    });

    // Map -> 고유 버킷 리스트(중복 제거)
    const uniq = new Set();
    const buckets = [];
    for (const [, bucket] of byKey.entries()) {
      if (!uniq.has(bucket)) {
        uniq.add(bucket);
        buckets.push(bucket);
      }
    }
    return buckets;
  }, [categories, itemsForThisDate]);

  const [showCategory, setShowCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editItem, setEditItem] = useState(null);

  const openAdd = (catName) => {
    setSelectedCategory(catName);
    setEditItem(null);
    setShowAddItem(true);
  };

  const openEdit = (todo) => {
    setSelectedCategory(todo.categoryName || todo.category);
    setEditItem(todo);
    setShowAddItem(true);
  };

  // ✅ 체크 ON 시 서버 먼저 → 성공하면 로컬 토글
  const onToggle = async (e, todo) => {
    e.stopPropagation();
    const next = !(todo.done ?? todo.completed ?? false);

    if (next) {
      try {
        const uid = getAuth().currentUser?.uid;
        if (!uid) throw new Error("로그인이 필요합니다.");
        await completeTodoHttp(uid, todo.id || todo.todoId);
        await toggleTodoDone(todo.id, true);
      } catch (err) {
        console.error("[completeTodoHttp]", err);
        alert(err.message || "성취도 반영 실패");
      }
    } else {
      // 체크 해제는 로컬만
      try {
        await toggleTodoDone(todo.id, false);
      } catch (err) {
        console.error("[toggleTodoDone]", err);
      }
    }
  };

  return (
    <div className="DailyList-wrapper">
      <header className="page-header">
        <img
          src="/img/back.png"
          alt="뒤로"
          className="back"
          onClick={() => nav("/calendar")}
        />
        <h1 className="title">일일리스트</h1>
        <img
          src="/img/gear.png"
          alt="설정"
          className="gear"
          onClick={() => nav("/settings")}
        />
      </header>

      <div className="daily-date">
        <p className="date-text">{formatKR(currentDate)}</p>
        <button
          className="category-btn"
          onClick={() => setShowCategory(true)}
        >
          카테고리
        </button>
      </div>

      {loading && <p className="loading-hint">불러오는 중…</p>}

      <div className="category-list">
        {!loading && grouped.length === 0 ? (
          <p className="empty-hint">카테고리를 추가하면 여기서부터 보입니다.</p>
        ) : (
          grouped.map(({ cat, items }) => (
            <section key={cat.id ?? cat.name} className="category-section">
              <div className="cat-header">
                <div className="cat-dot" style={{ background: cat.color }} />
                <h2 className="cat-name">{cat.name}</h2>
                <button
                  className="add-btn"
                  aria-label="항목 추가"
                  onClick={() => openAdd(cat.name)}
                >
                  +
                </button>
              </div>

              <ul className="todo-list">
                {items.map((t) => (
                  <li
                    key={
                      t.id ||
                      t.todoId ||
                      t._id ||
                      `${t.title}-${t.startDate || t.date || dayKey}`
                    }
                    className="todo-item"
                    onClick={() => openEdit(t)}
                  >
                    <input
                      type="checkbox"
                      /* ✅ 완료표시: done 없으면 completed도 인식 */
                      checked={!!(t.done ?? t.completed ?? false)}
                      onChange={(e) => onToggle(e, t)}
                      onClick={(e) => e.stopPropagation()}
                      className="todo-check"
                      style={{ "--check-color": cat.color }}
                    />
                    <span className="todo-title">
                      {!(t.isPublic ?? t.public ?? true) && (
                        <span className="lock" title="비공개">🔒</span>
                      )}
                      {t.title}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {showCategory && (
        <div className="overlay">
          <Category closePopup={() => setShowCategory(false)} />
        </div>
      )}

      {showAddItem && (
        <AddDailyItem
          date={dayKey}
          category={selectedCategory}
          editItem={editItem}
          closePopup={() => setShowAddItem(false)}
        />
      )}
    </div>
  );
}
