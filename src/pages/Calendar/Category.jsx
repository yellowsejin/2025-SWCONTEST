import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCategory } from "../../contexts/CategoryContext";

function Category() {
  const { categories, addCategory, setCategories } = useCategory();
  const navigate = useNavigate();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#a2d2ff");

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newCat = {
      name: newName,
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
    <div className="min-h-screen bg-[#f1f5f9] px-4 py-6">
      <h2 className="text-xl font-bold mb-4">카테고리 관리</h2>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-md font-semibold mb-2">새 카테고리 추가</h3>
        <input
          type="text"
          placeholder="카테고리 이름"
          className="border p-2 rounded w-full mb-2"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="color"
          className="w-12 h-8 rounded border"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
        />
        <button
          onClick={handleAdd}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          추가
        </button>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="flex items-center justify-between bg-white p-4 rounded shadow"
          >
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: cat.color }}
              ></div>
              <span className="font-semibold">{cat.name}</span>
            </div>
            {!cat.locked && (
              <button
                onClick={() => handleDelete(cat.name)}
                className="text-red-500 font-bold"
              >
                삭제
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate(-1)}
        className="mt-6 block w-full text-center py-2 bg-gray-300 rounded"
      >
        돌아가기
      </button>
    </div>
  );
}

export default Category;
