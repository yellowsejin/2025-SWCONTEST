import { useEffect, useRef, useState } from "react";
import { useCategory } from "../../contexts/CategoryContext";

// 아이콘 경로는 프로젝트 위치에 맞게
import reIcon  from "../../assets/img/re.png";
import delIcon from "../../assets/img/del.png";

export default function CategorySheet({ onClose }) {
  const {
    categories,
    addCategory,
    updateCategoryColor,
    updateCategoryName,
    deleteCategory
  } = useCategory();

  // 추가용
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#8ED080");

  // 수정중 상태
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName]   = useState("");
  const [editColor, setEditColor] = useState("#8ED080");

  const sheetRef = useRef(null);

  // 바깥 클릭 닫기
  useEffect(() => {
    const handler = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addCategory({ name: newName, color: newColor });
    setNewName("");
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color || "#8ED080");
  };

  const saveEdit = async (cat) => {
    if (!editName.trim()) return;
    if (cat.name !== editName) await updateCategoryName(cat.id, editName.trim());
    if (cat.color !== editColor) await updateCategoryColor(cat.id, editColor);
    setEditingId(null);
  };

  return (
    <>
      <div className="category-sheet-overlay" />
      <div ref={sheetRef} className="category-sheet">
        <div className="cs-header">
          <span>카테고리</span>
          <button className="cs-close" onClick={onClose}>×</button>
        </div>

        {/* 추가 영역 */}
        <div className="cs-add">
          <div className="color-dot" style={{ background: newColor }}>
            <input type="color" value={newColor} onChange={(e)=>setNewColor(e.target.value)} />
          </div>
          <input
            className="cs-input"
            placeholder="카테고리를 작성하세요."
            value={newName}
            onChange={(e)=>setNewName(e.target.value)}
            onKeyDown={(e)=>e.key==='Enter' && handleAdd()}
          />
          <button className="cs-add-btn" type="button" onClick={handleAdd}>＋</button>
        </div>

        <div className="cs-divider" />

        {/* 리스트 */}
        <ul className="cs-list">
          {categories.map((cat) => (
            <li key={cat.id} className="cs-item">
              <div className="color-dot" style={{ background: editingId===cat.id ? editColor : (cat.color||"#8ED080") }}>
                <input
                  type="color"
                  value={editingId===cat.id ? editColor : (cat.color||"#8ED080")}
                  onChange={(e) => editingId===cat.id
                    ? setEditColor(e.target.value)
                    : updateCategoryColor(cat.id, e.target.value)}
                />
              </div>

              {editingId===cat.id ? (
                <input
                  className="cs-input"
                  value={editName}
                  onChange={(e)=>setEditName(e.target.value)}
                  onKeyDown={(e)=>e.key==='Enter' && saveEdit(cat)}
                  autoFocus
                />
              ) : (
                <span className="cs-name">{cat.name}</span>
              )}

              <div className="cs-actions">
                {editingId===cat.id ? (
                  <>
                    <button className="cs-btn" onClick={()=>saveEdit(cat)}>
                      <img src={reIcon} alt="save"/>
                    </button>
                    <button className="cs-btn" onClick={()=>setEditingId(null)}>취소</button>
                  </>
                ) : (
                  <>
                    <button className="cs-btn" onClick={()=>startEdit(cat)}>
                      <img src={reIcon} alt="edit"/>
                    </button>
                    <button className="cs-btn" onClick={()=>deleteCategory(cat.id)}>
                      <img src={delIcon} alt="delete"/>
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
