// src/constants/functions.js
export const CF_BASE = "https://us-central1-dooop-69a1b.cloudfunctions.net";
// 예) us-central1-dooop-69a1b

export const CF = {
  // 카테고리 (이미 사용중)
  addCategory:    `${CF_BASE}/addCategory`,
  deleteCategory: `${CF_BASE}/deleteCategory`,

  // ✅ 투두 추가/삭제
  addTodo:        `${CF_BASE}/addTodo`,
  deleteTodo:     `${CF_BASE}/deleteTodo`,
};
