// src/pages/Calendar/Category.jsx
import { useState } from "react";
import { useCategory } from "../../contexts/CategoryContext";
import "../../assets/scss/section/Category.scss"; // 있어도/없어도 기능엔 영향 X

export default function Category({ closePopup }) {
  const {
    categories = [],
    addCategory,
    updateCategoryName,
    updateCategoryColor,
    deleteCategory,
  } = useCategory();

  // 추가 폼
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#8ED080");
  const [saving, setSaving] = useState(false);

  const onAdd = async () => {
    const name = newName.trim();
    if (!name) return alert("이름을 입력하세요.");
    try {
      setSaving(true);
      await addCategory({ name, color: newColor });
      setNewName("");
    } catch (e) {
      alert(e.message || "추가 실패");
    } finally {
      setSaving(false);
    }
  };

  // 이름 수정
  const [editingId, setEditingId] = useState(null);
  const [nameDraft, setNameDraft] = useState("");

  const beginEdit = (cat) => {
    setEditingId(cat.id);
    setNameDraft(cat.name);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setNameDraft("");
  };
  const saveEdit = async (id) => {
    const nm = nameDraft.trim();
    if (!nm) return alert("이름을 입력하세요.");
    try {
      await updateCategoryName(id, nm);
      cancelEdit();
    } catch (e) {
      alert(e.message || "수정 실패");
    }
  };

  const onColorChange = async (id, color) => {
    try {
      await updateCategoryColor(id, color);
    } catch (e) {
      alert(e.message || "색상 변경 실패");
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("이 카테고리를 삭제할까요?")) return;
    try {
      await deleteCategory(id);
    } catch (e) {
      alert(e.message || "삭제 실패");
    }
  };

  const opStyle = {
    padding: "4px 8px",
    border: "1px solid #e1e1e1",
    background: "#f7f7f7",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    lineHeight: 1.2,
  };

  return (
    <div className="cat-modal" style={{ position: "fixed", inset: 0, zIndex: 10000 }}>
      <div
        className="cat-dialog"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 340,
          maxWidth: "calc(100% - 40px)",
          background: "#fff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 12px 32px rgba(0,0,0,.2)",
        }}
      >
        <div
          className="cat-head"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>카테고리</h3>
          <button className="x" onClick={closePopup} aria-label="닫기" style={{ fontSize: 20, lineHeight: 1 }}>
            ×
          </button>
        </div>

        {/* 추가 폼 */}
        <div className="cat-add" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="카테고리 이름"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            aria-label="새 색상"
            style={{ width: 36, height: 36, padding: 0, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <button onClick={onAdd} disabled={saving || !newName.trim()}>
            {saving ? "추가중…" : "추가"}
          </button>
        </div>

        {/* 목록 */}
        <ul
          className="cat-list"
          style={{ margin: 0, padding: 0, listStyle: "none", maxHeight: 320, overflow: "auto" }}
        >
          {categories.map((cat) => (
            <li
              key={cat.id || cat.name}
              className="cat-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                width: "100%",
              }}
            >
              {/* 색상 */}
              <label className="color" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input
                  type="color"
                  value={cat.color || "#8ED080"}
                  onChange={(e) => onColorChange(cat.id, e.target.value)}
                  aria-label={`${cat.name} 색상 변경`}
                  style={{
                    width: 28, height: 28, padding: 0,
                    border: "1px solid #ddd", borderRadius: 6, cursor: "pointer",
                  }}
                />
                <span
                  className="dot"
                  style={{
                    width: 14, height: 14, borderRadius: "50%",
                    border: "1px solid #ddd",
                    background: cat.color || "#8ED080",
                  }}
                />
              </label>

              {/* 이름/수정 */}
              {editingId === cat.id ? (
                <input
                  className="name-edit"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(cat.id);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  autoFocus
                  style={{ flex: "1 1 auto", minWidth: 0 }}
                />
              ) : (
                <span className="name" style={{ flex: "1 1 auto", minWidth: 0 }}>
                  {cat.name}
                </span>
              )}

              {/* 조작: re / del — 항상 보이도록 강제 */}
              <div
                className="ops"
                style={{
                  display: "flex",
                  gap: 8,
                  marginLeft: "auto",
                  opacity: 1,
                  visibility: "visible",
                }}
              >
                {editingId === cat.id ? (
                  <>
                    <button className="op save" onClick={() => saveEdit(cat.id)} style={opStyle}>
                      저장
                    </button>
                    <button className="op cancel" onClick={cancelEdit} style={opStyle}>
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <button className="op re" title="이름 수정" onClick={() => beginEdit(cat)} style={opStyle}>
                      re
                    </button>
                    <button className="op del" title="삭제" onClick={() => onDelete(cat.id)} style={opStyle}>
                      del
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
