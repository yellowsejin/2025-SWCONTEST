// src/utils/upsertPublicProfile.js
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 로그인/회원가입 직후 publicProfiles/{uid} 생성·업데이트
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
    doc(db, "publicProfiles", user.uid),
    {
      displayName,
      photoURL,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
