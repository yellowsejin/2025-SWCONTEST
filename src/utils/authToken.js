// src/utils/authToken.js
import { auth } from "../firebase";

export async function getIdTokenOrThrow() {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  return await user.getIdToken();
}
