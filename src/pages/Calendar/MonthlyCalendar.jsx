import React, { useMemo, useState } from "react";
import "../../assets/scss/section/Calendar.scss";
import { useNavigate, useParams } from "react-router-dom";
import { useSchedule } from "../../contexts/ScheduleContext";
import { useCategory } from "../../contexts/CategoryContext";
import useFriendCalendar from "../../hooks/useFriendCalendar";

/* ---------- 카테고리/색상 유틸 ---------- */
const resolveCategory = (item, categories) => {
  if (!item || !categories?.length) return undefined;

  const idCandidate =
    item.categoryId ??
    (item.category && typeof item.category === "object" ? item.category.id : undefined);

  const nameCandidateRaw =
    item.categoryName ??
    (typeof item.category === "string" ? item.category : item.category?.name);

  const idStr = idCandidate != null ? String(idCandidate) : null;
  const nameCandidate = typeof nameCandidateRaw === "string" ? nameCandidateRaw.trim() : "";

  if (idStr) {
    const byId = categories.find((c) => String(c.id) === idStr);
    if (byId) return byId;
  }
  if (nameCandidate) {
    const byName = categories.find((c) => c.name === nameCandidate);
    if (byName) return byName;
  }
  return undefined;
};

function MonthlyCalendar() {
  const { schedulesByDate } = useSchedule(); // 내 캘린더(기존)
  const { categories } = useCategory();
  const navigate = useNavigate();

  // ▼ 친구 모드
  const { friendId } = useParams();
  const isFriendView = !!friendId;

  // ▼ 친구 공개 일정(훅 사용)
  const { items: friendItems, loading: friendLoading } = useFriendCalendar(friendId);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [isYearSelectOpen, setIsYearSelectOpen] = useState(false);
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);

  const daysInMonth = useMemo(
    () => new Date(currentYear, currentMonth + 1, 0).getDate(),
    [currentYear, currentMonth]
  );

  const yStr = String(currentYear);
  const mStr = String(currentMonth + 1).padStart(2, "0");

  // ▼ 날짜 비교 보강: endDate 없으면 startDate로 대체, 앞 10자리만 비교
  const isInDateRange = (item, ymd) => {
    const s = item?.startDate ? String(item.startDate).slice(0, 10) : null;
    const eRaw = item?.endDate ?? item?.startDate;
    const e = eRaw ? String(eRaw).slice(0, 10) : null;
    if (!s || !e) return false;
    return s <= ymd && ymd <= e;
  };

  const handleDateClick = (day) => {
    const dateStr = `${yStr}-${mStr}-${String(day).padStart(2, "0")}`;
    if (isFriendView) navigate(`/daily/${dateStr}?uid=${friendId}`);
    else navigate(`/daily/${dateStr}`);
  };

  const renderCalendar = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const startBlank = (firstDay + 6) % 7; // 월=0 기준
    const cells = [];

    for (let i = 0; i < startBlank; i++) {
      cells.push(<div key={`blank-${i}`} className="calendar-cell empty-cell" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yStr}-${mStr}-${String(day).padStart(2, "0")}`;

      let daySchedules;
      if (isFriendView) {
        daySchedules = friendItems.filter((it) => isInDateRange(it, dateStr));
      } else {
        daySchedules = (schedulesByDate?.[dateStr] || []).filter((item) =>
          resolveCategory(item, categories)
        );
      }

      const maxItemsToShow = 4;
      const displayed = daySchedules.slice(0, maxItemsToShow);

      cells.push(
        <div
          key={day}
          className="calendar-cell"
          onClick={() => handleDateClick(day)}
          style={{ cursor: "pointer" }}
        >
          <div className="date-number">{day}</div>
          <div className="badges">
            {displayed.map((item) => {
              const cat = isFriendView ? undefined : resolveCategory(item, categories);
              const color = cat?.color || item?.color || "#8ED080";
              const done = !!item.done;
              return (
                <span
                  key={item.id ? `${item.id}-${dateStr}` : `${dateStr}-${item.title}`}
                  className={`todo-badge ${done ? "done" : "pending"}`}
                  style={{ "--badge-color": color }}
                  title={item.title}
                >
                  {item.title}
                </span>
              );
            })}
            {daySchedules.length > maxItemsToShow && (
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
        <div className="calendar-month-title">
          <span className="select-wrap">
            <button
              type="button"
              className="title-btn"
              onClick={() => {
                setIsYearSelectOpen((v) => !v);
                setIsMonthSelectOpen(false);
              }}
            >
              {isFriendView ? "친구 캘린더 · " : ""}
              {currentYear}년
            </button>
            <div className="month-popup" data-open={isYearSelectOpen}>
              <ul>
                {Array.from({ length: 30 }, (_, i) => 2010 + i).map((y) => (
                  <li
                    key={y}
                    className={y === currentYear ? "active" : ""}
                    onClick={() => {
                      setCurrentYear(y);
                      setIsYearSelectOpen(false);
                    }}
                  >
                    {y}년
                  </li>
                ))}
              </ul>
            </div>
          </span>

          <span className="select-wrap">
            <button
              type="button"
              className="title-btn"
              onClick={() => {
                setIsMonthSelectOpen((v) => !v);
                setIsYearSelectOpen(false);
              }}
            >
              {currentMonth + 1}월
            </button>
            <div className="month-popup" data-open={isMonthSelectOpen}>
              <ul>
                {Array.from({ length: 12 }, (_, i) => i).map((m) => (
                  <li
                    key={m}
                    className={m === currentMonth ? "active" : ""}
                    onClick={() => {
                      setCurrentMonth(m);
                      setIsMonthSelectOpen(false);
                    }}
                  >
                    {m + 1}월
                  </li>
                ))}
              </ul>
            </div>
          </span>
        </div>

        <div className="calendar-box">
          <div className="calendar-header">
            {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {isFriendView && friendLoading ? (
            <div style={{ padding: 16 }}>로딩 중…</div>
          ) : (
            <div className="calendar-grid">{renderCalendar()}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MonthlyCalendar;
