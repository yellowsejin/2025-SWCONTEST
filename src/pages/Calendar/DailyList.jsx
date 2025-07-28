import { useCategory } from "../../contexts/CategoryContext";
import { useNavigate } from "react-router-dom";
import "../../assets/scss/section/DailyList.scss";

function DailyList({ date }) {
  const navigate = useNavigate();
  const { categories } = useCategory();

  const goToCategory = () => {
    navigate("/category");
  };

  const goToAddItem = () => {
    navigate("/add-item");
  };

  const defaultCategoryName = "루틴";

  // 안전하게 categories 확인
  const defaultCategory = categories?.find(
    (cat) => cat.name === defaultCategoryName
  );
  const userCategories = categories?.filter(
    (cat) => cat.name !== defaultCategoryName
  );

  const getFormattedDate = (dateObj) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekday = days[dateObj.getDay()];
    return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
  };

  const displayDate = date ? getFormattedDate(new Date(date)) : "";

  return (
     <div className="DailyList-wrapper">
        <div className="DailyList-page">
            <header className="daily-header">
                <div className="title-block">
                    <h2>일일리스트</h2>
                    <p>{displayDate}</p>
                </div>
                <button onClick={goToCategory} className="category">
                    카테고리
                </button>
            </header>


      {defaultCategory && (
        <div className="category-block">
          <div className="category-header">
            <div className="category-title">
              <div
                className="color-dot"
                style={{ backgroundColor: defaultCategory.color }}
              ></div>
              <span>{defaultCategory.name}</span>
              {defaultCategory.locked && <span className="lock">🔒</span>}
            </div>
            <button onClick={goToAddItem} className="add-button">
              ＋
            </button>
          </div>

          <ul className="task-list">
            {defaultCategory.items.map((item, index) => (
              <li key={index}>
                <input type="checkbox" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {userCategories &&
        userCategories.map((cat) => (
          <div key={cat.name} className="category-block">
            <div className="category-header">
              <div className="category-title">
                <div
                  className="color-dot"
                  style={{ backgroundColor: cat.color }}
                ></div>
                <span>{cat.name}</span>
                {cat.locked && <span className="lock">🔒</span>}
              </div>
              <button onClick={goToAddItem} className="add-button">
                ＋
              </button>
            </div>

            <ul className="task-list">
              {cat.items.map((item, index) => (
                <li key={index}>
                  <input type="checkbox" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
    </div>
  );
}

export default DailyList;
