import { createContext, useContext, useState } from "react";

const ScheduleContext = createContext();

export function ScheduleProvider({ children }) {
  const [schedules, setSchedules] = useState([]);

  return (
    <ScheduleContext.Provider value={{ schedules, setSchedules }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export const useSchedule = () => useContext(ScheduleContext);
