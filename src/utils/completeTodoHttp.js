// src/utils/completeTodoHttp.js
export async function completeTodoHttp(todoId, isDone) {
  try {
    const res = await fetch(
      "https://us-central1-dooop-69a1b.cloudfunctions.net/completeTodo",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: todoId, done: isDone }),
      }
    );

    if (!res.ok) {
      throw new Error("서버 응답 오류");
    }

    return await res.json();
  } catch (err) {
    console.error("completeTodoHttp 오류:", err);
    throw err;
  }
}
