import { useCategory } from "../../contexts/CategoryContext";
import { useState } from "react";
import "../../assets/scss/section/Category.scss";


function Category({ closePopup }) { // ✅ props 받기
  const { categories, addCategory, setCategories } = useCategory();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#a2d2ff");

  const handleAdd = () => {
  const trimmedName = newName.trim();
  if (!trimmedName) return;

  const newCat = {
    name: trimmedName,
    color: newColor,
    items: [],
    locked: false,
  };

  addCategory(newCat);
  setNewName("");
  setNewColor("#a2d2ff");
};


  const handleDelete = (nameToDelete) => {
    setCategories(prev => prev.filter(cat => cat.name !== nameToDelete));
  };
  
  

  return (
    <div className="C-popup">
      <div className="popup-header">
        <h2>카테고리 관리</h2>
        <button className="close-btn" onClick={closePopup}>✕</button> {/* ✅ 팝업 닫기 */}
      </div>

      <div className="new-category">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
        />
        <input
          type="text"
          placeholder="카테고리를 작성하세요."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="add-btn" onClick={handleAdd}>＋</button>
      </div>

      <div className="category-list">
        {categories.map((cat) => (
          <div key={cat.name} className="category-item">
            <div className="item-left">
              <div className="color-dot" style={{ backgroundColor: cat.color }}></div>
              <span>{cat.name}</span>
            </div>
            {!cat.locked && (
              <div className="item-actions">
                <button onClick={() => handleDelete(cat.name)}>🗑</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Category;
