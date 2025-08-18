import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import useFriendCalendar from "../../hooks/useFriendCalendar";
import "../../assets/scss/section/Calendar.scss";

export default function FriendCalendarPage() {
  const { friendUid } = useParams();
  const nav = useNavigate();
  const auth = getAuth();
  const myUid = auth.currentUser?.uid;

  const { items, loading } = useFriendCalendar(myUid, friendUid);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const daysInMonth = useMemo(
    () => new Date(currentYear, currentMonth + 1, 0).getDate(),
    [currentYear, currentMonth]
  );

  const yStr = String(currentYear);
  const mStr = String(currentMonth + 1).padStart(2, "0");

  // ✅ 문자열이면 그대로, Timestamp면 변환
  const toYMD = (v) => {
    if (!v) return null;
    if (typeof v === "object" && typeof v.toDate === "function") {
      const d = v.toDate();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
    }
    return String(v).slice(0, 10);
  };

  // ✅ 날짜 포함 여부 체크
  const isInDateRange = (item, ymd) => {
    const s = toYMD(item?.startDate);
    const e = toYMD(item?.endDate ?? item?.startDate);
    if (!s || !e) return false;
    return s <= ymd && ymd <= e;
  };

  if (loading) return <p style={{ padding: 16 }}>로딩 중…</p>;

  // ✅ 공개 여부 필터링
  const publicItems = items.filter(
    (it) =>
      it.isPublic === true ||
      it.isPublic === "true" ||
      it.public === true ||
      it.public === "true"
  );

  const renderCalendar = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const startBlank = (firstDay + 6) % 7;
    const cells = [];

    for (let i = 0; i < startBlank; i++) {
      cells.push(
        <div key={`blank-${i}`} className="calendar-cell empty-cell" />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yStr}-${mStr}-${String(day).padStart(2, "0")}`;
      const daySchedules = publicItems.filter((it) =>
        isInDateRange(it, dateStr)
      );
      const displayed = daySchedules.slice(0, 4);

      cells.push(
        <div key={day} className="calendar-cell" style={{ cursor: "default" }}>
          <div className="date-number">{day}</div>
          <div className="badges">
            {displayed.map((item) => (
              <span
                key={`${item.id}-${dateStr}`}
                className="todo-badge"
                style={{ "--badge-color": item.color || "#8ED080" }}
                title={item.title}
              >
                {item.title}
              </span>
            ))}
            {daySchedules.length > 4 && (
              <span className="todo-badge more-indicator" title="더 보기">
                …
              </span>
            )}
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="calendar-wrapper">
      <div className="monthly-calendar-page">
        <div className="calendar-header">
          <button onClick={() => nav(-1)}>← 뒤로</button>
          <h2>친구 캘린더</h2>
        </div>

        <div className="calendar-box">
          <div className="calendar-header">
            {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="calendar-grid">{renderCalendar()}</div>
        </div>
      </div>
    </div>
  );
}
