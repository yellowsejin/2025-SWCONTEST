// src/utils/upsertPublicProfile.js
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 로그인/회원가입 직후 users/{uid} 생성·업데이트
 * - displayName: 아이디나 닉네임 등 표시용 이름
 * - photoURL: 선택(없으면 null)
 */
export async function upsertPublicProfile(user, override = {}) {
  if (!user) return;

  const displayName =
    override.displayName ??
    user.displayName ??
    "사용자";

  const photoURL =
    override.photoURL ??
    user.photoURL ??
    null;

  await setDoc(
    // ✅ publicProfiles → users 로 변경
    doc(db, "users", user.uid),
    {
      displayName,
      photoURL,
      updatedAt: serverTimestamp(),
      uid: user.uid, // 규칙 조건(request.auth.uid == request.resource.data.uid) 맞추기 위해 추가
    },
    { merge: true }
  );
}
