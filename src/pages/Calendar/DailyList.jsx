import { useCategory } from "../../contexts/CategoryContext";
import Category from "./Category";
import { useSchedule } from "../../contexts/ScheduleContext";
import AddDailyItem from "./AddDailyItem";
import { useParams } from "react-router-dom";
import { useState } from "react";
import "../../assets/scss/section/DailyList.scss";

function DailyList() {
  const { date } = useParams();
  const { categories } = useCategory();
  const { schedules } = useSchedule();

  const [showCategory, setShowCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [currentDate, setCurrentDate] = useState(date ? new Date(date) : new Date());

  const defaultCategoryName = "루틴";
  const defaultCategory = categories?.find(cat => cat.name === defaultCategoryName);
  const userCategories = categories?.filter(cat => cat.name !== defaultCategoryName);

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 1);
    setCurrentDate(next);
  };

  const getFormattedDate = (dateObj) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekday = days[dateObj.getDay()];
    return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
  };

  const displayDate = getFormattedDate(currentDate);
  const currentDateStr = currentDate.toISOString().slice(0, 10);

  const renderTasks = (cat) => (
    schedules[currentDateStr]
      ?.filter(item => item.category === cat.name)
      .map((item, index) => (
        <div
          key={item.id}
          className="task-item"
          onClick={() => {
            setEditItem({
              ...item,
              date: item.date ? (typeof item.date === "string" ? item.date : new Date(item.date).toISOString().slice(0, 10)) : currentDateStr,
              index,
              startDate: item.startDate || currentDateStr,
              endDate: item.endDate || currentDateStr,
            });

            setShowAddItem(true);
          }}
        >
          <input type="checkbox" />
          <span>{item.title}</span>
        </div>
      ))
  );
  return (
    <div className="DailyList-wrapper">
      <div className="DailyList-page">
        <header className="daily-header">
          <div className="title-block">
            <h2>일일리스트</h2>
            <div className="date-nav">
              <button className="arrow-btn left" onClick={handlePrevDay}>◀</button>
              <h2 className="current-date">{displayDate}</h2>
              <button className="arrow-btn right" onClick={handleNextDay}>▶</button>
            </div>
          </div>
          <button onClick={() => setShowCategory(true)} className="category">카테고리</button>
        </header>

        {defaultCategory && (
          <>
            <div className="category-block">
              <div className="category-header">
                <div className="category-title">
                  <div className="color-dot" style={{ backgroundColor: defaultCategory.color }}></div>
                  <span>{defaultCategory.name}</span>
                  {defaultCategory.locked && <span className="lock">🔒</span>}
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory(defaultCategory.name);
                    setEditItem(null);
                    setShowAddItem(true);
                  }}
                  className="add-button"
                >
                  ＋
                </button>
              </div>
            </div>
            {renderTasks(defaultCategory)}
          </>
        )}

        {userCategories?.map(cat => (
          <div key={cat.name}>
            <div className="category-block">
              <div className="category-header">
                <div className="category-title">
                  <div className="color-dot" style={{ backgroundColor: cat.color }}></div>
                  <span>{cat.name}</span>
                  {cat.locked && <span className="lock">🔒</span>}
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setEditItem(null);
                    setShowAddItem(true);
                  }}
                  className="add-button"
                >
                  ＋
                </button>
              </div>
            </div>
            {renderTasks(cat)}
          </div>
        ))}
      </div>

      {showAddItem && (
        <div className="overlay">
          <AddDailyItem
            date={currentDateStr}
            category={selectedCategory}
            editItem={editItem}           // ✅ 추가
            closePopup={() => setShowAddItem(false)}
          />

        </div>
      )}
      {showCategory && (
        <div className="overlay">
          <Category closePopup={() => setShowCategory(false)} />
        </div>
      )}

    </div>
  );
}

export default DailyList;