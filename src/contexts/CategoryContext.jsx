// src/contexts/CategoryContext.jsx

import { createContext, useContext, useState } from "react";

// 1. Context 생성
const CategoryContext = createContext();

// 2. Provider 정의
export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([
    {
      name: "루틴",
      color: "#d6ecc9",
      locked: false,
      items: ["물 2L 마시기"]
    }
  ]);

  // 3. 카테고리 추가 함수
  const addCategory = (newCat) => {
    setCategories(prev => [...prev, newCat]);
  };

  // 4. 항목 추가 함수
  const addItemToCategory = (categoryName, item) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.name === categoryName
          ? { ...cat, items: [...cat.items, item] }
          : cat
      )
    );
  };

  return (
    <CategoryContext.Provider value={{ categories, setCategories, addCategory, addItemToCategory }}>
      {children}
    </CategoryContext.Provider>
  );
};

// 5. Context 사용 훅
export const useCategory = () => useContext(CategoryContext);
