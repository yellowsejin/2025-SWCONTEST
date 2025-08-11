import { createContext, useContext, useState } from "react";

const ScheduleContext = createContext();

export function ScheduleProvider({ children }) {
  const [schedules, setSchedules] = useState({});

  // 일정 추가
  const addSchedule = (date, item) => {
    console.log("addSchedule 호출됨", date, item);
    setSchedules((prev) => ({
      ...prev,
      [date]: [...(prev[date] || []), item],
    }));
  };

  // 일정 수정 (날짜 동일)
  const updateSchedule = (date, id, updatedItem) => {
    setSchedules((prev) => {
      if (!prev[date]) return prev;
      const updatedDaySchedules = prev[date].map((item) =>
        item.id === id ? updatedItem : item
      );
      return {
        ...prev,
        [date]: updatedDaySchedules,
      };
    });
  };

  // 일정 날짜 이동 + 수정
  const moveSchedule = (oldDate, newDate, id, updatedFields) => {
    setSchedules((prev) => {
      const oldItems = prev[oldDate];
      if (!oldItems) return prev;

      const itemIndex = oldItems.findIndex((item) => item.id === id);
      if (itemIndex === -1) return prev;

      const oldItem = oldItems[itemIndex];
      const updatedOld = oldItems.filter((item) => item.id !== id);
      const updatedNew = [...(prev[newDate] || []), { ...oldItem, ...updatedFields }];

      const newState = {
        ...prev,
        [oldDate]: updatedOld,
        [newDate]: updatedNew,
      };

      if (newState[oldDate]?.length === 0) {
        delete newState[oldDate];
      }

      return newState;
    });
  };

  // 일정 삭제
  const deleteSchedule = (date, id) => {
    setSchedules((prev) => {
      const updated = { ...prev };
      if (updated[date]) {
        updated[date] = updated[date].filter((item) => item.id !== id);
        if (updated[date].length === 0) {
          delete updated[date];
        }
      }
      return updated;
    });
  };

  return (
    <ScheduleContext.Provider
      value={{
        schedules,
        addSchedule,
        updateSchedule,
        moveSchedule,
        deleteSchedule,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export const useSchedule = () => useContext(ScheduleContext);
