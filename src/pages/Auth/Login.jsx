// src/pages/Auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { upsertPublicProfile } from "../../utils/upsertPublicProfile";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ idOrEmail: "", password: "" });
  const [msg, setMsg] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // 아이디 → 이메일 매핑 (usernames/{idLower} → { email })
  const resolveEmail = async (idOrEmail) => {
    const v = idOrEmail.trim();
    if (v.includes("@")) return v; // 이미 이메일
    const snap = await getDoc(doc(db, "usernames", v.toLowerCase()));
    if (!snap.exists()) throw new Error("존재하지 않는 아이디입니다.");
    const { email } = snap.data() || {};
    if (email) return email;
    throw new Error("아이디 매핑 정보가 손상되었습니다. (email 없음)");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("로그인 중…");
    try {
      const email = await resolveEmail(form.idOrEmail);
      const cred = await signInWithEmailAndPassword(auth, email, form.password);

      // (선택) 토큰/유저 정보 저장
      const token = await cred.user.getIdToken();
      localStorage.setItem("idToken", token);
      localStorage.setItem("uid", cred.user.uid);
      localStorage.setItem("email", cred.user.email || email);

      // ✅ 공개 프로필 동기화 (표시명 추정: 이메일 입력이면 기존 displayName 유지)
      const displayNameGuess = form.idOrEmail.includes("@")
        ? (cred.user.displayName || "사용자")
        : form.idOrEmail.trim();
      await upsertPublicProfile(cred.user, { displayName: displayNameGuess });

      setMsg("✅ 로그인 성공!");
      navigate("/calendar", { replace: true });
    } catch (err) {
      const m = err?.code || err?.message || "로그인 실패";
      let friendly = "로그인 실패";
      if (m.includes("auth/invalid-credential") || m.includes("auth/wrong-password"))
        friendly = "비밀번호가 올바르지 않습니다.";
      else if (m.includes("auth/user-not-found"))
        friendly = "존재하지 않는 계정입니다.";
      else if (m.includes("존재하지 않는 아이디"))
        friendly = "존재하지 않는 아이디입니다.";
      setMsg(`❌ ${friendly}`);
      console.error(err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>
          Dooop ! 에 오신 것을 <br /> 환영해요 :)
        </h1>
        <p className="login-subtext">
          Dooop ! 으로 단어와 일정을 관리하고, 작고 작은 성취의 즐거움을 느껴보세요
        </p>

        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="text"
            name="idOrEmail"
            placeholder="이메일 또는 아이디"
            value={form.idOrEmail}
            onChange={onChange}
          />
          <input
            type="password"
            name="password"
            placeholder="비밀번호 입력"
            value={form.password}
            onChange={onChange}
          />
          <button type="submit">로그인</button>
        </form>

        {msg && <p className="login-msg">{msg}</p>}

        <div className="login-links">
          <a onClick={() => navigate("/find-id")}>아이디 찾기</a>
          <a onClick={() => navigate("/find-password")}>비밀번호 찾기</a>
          <a onClick={() => navigate("/signup")}>회원가입</a>
        </div>
      </div>
    </div>
  );
}
