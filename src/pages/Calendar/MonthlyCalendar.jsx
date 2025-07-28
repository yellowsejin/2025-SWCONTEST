import React, { useState, useContext } from "react";
import { useSchedule } from "../../contexts/ScheduleContext";
import "../../assets/scss/section/Calendar.scss";



function MonthlyCalendar() {
  const today = new Date();
  const { schedules } = useSchedule();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-based

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const renderCalendar = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0:일~6:토
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const blanks = (firstDay + 6) % 7; // 월요일 시작

    const cells = [];

    for (let i = 0; i < blanks; i++) {
      cells.push(<div className="calendar-cell empty" key={`blank-${i}`} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const daySchedules = schedules[dateStr] || [];

      cells.push(
        <div className="calendar-cell" key={dateStr}>
          <div className="date-number">{d}</div>
          {daySchedules.map((item, index) => (
            <div
              key={index}
              className="schedule-badge"
              style={{ backgroundColor: item.color }}
            >
              {item.title}
            </div>
          ))}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="monthly-calendar-page">
        <div className="calendar-top">
            <button className="arrow-button left" onClick={handlePrevMonth}>◀</button>
            <h2>{currentYear}년 {currentMonth + 1}월</h2>
            <button className="arrow-button right" onClick={handleNextMonth}>▶</button>
        </div>
        <div className="calendar-container">
        <div className="calendar-header"></div>

        <div className="calendar-weekdays">
          {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {renderCalendar()}
        </div>
      </div>
    </div>
  );
}

export default MonthlyCalendar;
