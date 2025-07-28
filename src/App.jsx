import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";

import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import FindId from "./pages/Auth/FindId";
import FindPassword from "./pages/Auth/FindPassword";
import MonthlyCalendar from "./pages/Calendar/MonthlyCalendar";
import DailyList from "./pages/Calendar/DailyList";
import Category from './pages/Calendar/Category';
import AddDailyItem from './pages/Calendar/AddDailyItem';
import AddFriend from "./pages/Friends/AddFriend";
import Quest from "./pages/Quest/Quest";
import Nav from "./components/Nav";

import { CategoryProvider } from "./contexts/CategoryContext";
import { ScheduleProvider } from "./contexts/ScheduleContext";

function AppRoutes() {
  const location = useLocation();
  const hideNavRoutes = ["/", "/login", "/signup", "/find-id", "/find-password"];

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/find-id" element={<FindId />} />
        <Route path="/find-password" element={<FindPassword />} />
        <Route path="/list" element={<DailyList />}/>
        <Route path="/category" element={<Category />} />
        <Route path="/add-item" element={<AddDailyItem />} />

        <Route path="/quest" element={<Quest />} />
        <Route path="/friends" element={<AddFriend />} />
        <Route path="/calendar" element={<MonthlyCalendar />} />
        <Route path="/todo" element={<DailyList />} />
        <Route path="/room" element={<MonthlyCalendar />} />
      </Routes>

      {!hideNavRoutes.includes(location.pathname) && <Nav />}
    </>
  );
}

function App() {
  const [schedules, setSchedules] = useState([]);

  const addSchedule = (newItem) => {
    setSchedules(prev => [...prev, newItem]);
  };

  return (
    <ScheduleProvider>
        <CategoryProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </CategoryProvider>
    </ScheduleProvider>
  );
}

export default App;
