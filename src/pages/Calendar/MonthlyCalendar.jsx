import React, { useState } from "react";
import "../../assets/scss/section/Calendar.scss";
import { useNavigate } from "react-router-dom";
import { useSchedule } from "../../contexts/ScheduleContext";

function MonthlyCalendar() {
  const { schedules } = useSchedule();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [isYearSelectOpen, setIsYearSelectOpen] = useState(false);
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);

  const navigate = useNavigate();

  const handleDateClick = (day) => {
    const month = currentMonth + 1;
    const dateStr = `${currentYear}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
    navigate(`/daily/${dateStr}`);
  };

  const renderCalendar = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const startBlank = (firstDay + 6) % 7;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cells = [];
    
     for (let i = 0; i < startBlank; i++) {
    cells.push(<div key={`blank-${i}`} className="calendar-cell empty-cell"></div>);
  }
    for (let day = 1; day <= daysInMonth; day++) {
      const month = currentMonth + 1;
      const dateStr = `${currentYear}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;

      const daySchedules = schedules[dateStr] || [];
      const maxItemsToShow = 4; // 최대 4개 일정 보여주기
      const displayedSchedules = daySchedules.slice(0, maxItemsToShow);

      cells.push(
        <div
          key={day}
          className="calendar-cell"
          onClick={() => handleDateClick(day)}
          style={{ cursor: "pointer" }}
        >
          <div className="date-number">{day}</div>

          <div className="schedule-list">
            {displayedSchedules.map((item) => (
              <div
                key={item.id}
                className="schedule-item"
                style={{ backgroundColor: item.color || "#888" }}
                title={item.title}
              >
                {item.title}
              </div>
            ))}
            {daySchedules.length > maxItemsToShow && (
              <div className="schedule-item more-indicator">...</div>
            )}
          </div>
        </div>
      );
    }
    return cells;
  };

  // 클릭 시 드롭다운 열리고 바로 focus + click 하여 펼치기
  const handleYearClick = (e) => {
    setIsYearSelectOpen(true);
    setIsMonthSelectOpen(false);
    setTimeout(() => {
      e.target.nextSibling?.focus();
      e.target.nextSibling?.click();
    }, 0);
  };

  const handleMonthClick = (e) => {
    setIsMonthSelectOpen(true);
    setIsYearSelectOpen(false);
    setTimeout(() => {
      e.target.nextSibling?.focus();
      e.target.nextSibling?.click();
    }, 0);
  };

  const handleYearChange = (e) => {
    setCurrentYear(Number(e.target.value));
    setIsYearSelectOpen(false);
  };

  const handleMonthChange = (e) => {
    setCurrentMonth(Number(e.target.value));
    setIsMonthSelectOpen(false);
  };

  return (
    <div className="calendar-wrapper">
      <div className="monthly-calendar-page">
        <div className="calendar-month-title">
          {isYearSelectOpen ? (
            <select
              className="dropdown-inline"
              value={currentYear}
              onChange={handleYearChange}
              autoFocus
            >
              {Array.from({ length: 30 }, (_, i) => {
                const year = 2010 + i;
                return (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                );
              })}
            </select>
          ) : (
            <span className="clickable" onClick={handleYearClick}>
              {currentYear}년
            </span>
          )}

          {isMonthSelectOpen ? (
            <select
              className="dropdown-inline"
              value={currentMonth}
              onChange={handleMonthChange}
              autoFocus
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {i + 1}월
                </option>
              ))}
            </select>
          ) : (
            <span className="clickable" onClick={handleMonthClick}>
              {currentMonth + 1}월
            </span>
          )}
        </div>

        <div className="calendar-box">
          <div className="calendar-header">
            {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="calendar-grid">{renderCalendar()}</div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyCalendar;
