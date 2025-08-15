// src/pages/Signup.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/scss/Signup.scss"; // 경로는 프로젝트 구조에 맞추세요

// ✅ Firebase & util
import { auth } from "../../firebase";
import { signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { upsertPublicProfile } from "../../utils/upsertPublicProfile";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    id: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [isValid, setIsValid] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const { email, id, password, confirmPassword, agree } = form;
    setIsValid(
      Boolean(email.trim()) &&
        Boolean(id.trim()) &&
        Boolean(password.trim()) &&
        Boolean(confirmPassword.trim()) &&
        password === confirmPassword &&
        agree
    );
  }, [form]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setMsg("가입 중…");

    try {
      // 1) Cloud Functions(서버)로 회원 생성 요청
      const res = await fetch(
        "https://us-central1-dooop-69a1b.cloudfunctions.net/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            id: form.id.trim(),
          }),
        }
      );

      // 2) 방어적 파싱
      let data = null;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        /* ignore */
      }

      if (!res.ok) {
        const errMsg = (data && (data.error || data.message)) || text || "서버 오류";
        throw new Error(errMsg);
      }

      // 3) 성공 후 즉시 로그인 (클라이언트 Auth 세션 확보)
      setMsg("회원가입 성공! 로그인 중…");
      const email = form.email.trim();
      const pwd = form.password;
      const cred = await signInWithEmailAndPassword(auth, email, pwd);

      // 4) (선택) Firebase Auth displayName을 아이디로 세팅
      try {
        if (!cred.user.displayName) {
          await updateProfile(cred.user, { displayName: form.id.trim() });
        }
      } catch {
        /* ignore */
      }

      // 5) ✅ 공개 프로필 upsert (친구목록 표시용)
      await upsertPublicProfile(cred.user, { displayName: form.id.trim() });

      setMsg("✅ 회원가입 & 로그인 완료!");
      navigate("/calendar", { replace: true });
    } catch (err) {
      setMsg(`❌ 오류: ${err.message}`);
      console.error(err);
    }
  };

  return (
    <div className="signup-page">
      <h2 className="signup-title">회원가입</h2>

      <form onSubmit={handleSignup}>
        <div className="form-group">
          <label>이메일 <span className="required">*</span></label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="email@example.com"
          />
        </div>

        <div className="form-group">
          <label>아이디 <span className="required">*</span></label>
          <input
            type="text"
            name="id"
            value={form.id}
            onChange={onChange}
            placeholder="표시명으로 사용됩니다"
          />
        </div>

        <div className="form-group">
          <label>비밀번호 <span className="required">*</span></label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="8~16자"
          />
          <small>8~16자</small>
        </div>

        <div className="form-group">
          <label>비밀번호 확인 <span className="required">*</span></label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={onChange}
            placeholder="비밀번호 확인"
          />
        </div>

        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            name="agree"
            checked={form.agree}
            onChange={onChange}
            id="agree"
          />
          <label htmlFor="agree">개인정보 수집 및 이용에 동의합니다.</label>
        </div>

        <button
          className={`submit-button ${isValid ? "active" : ""}`}
          disabled={!isValid}
          type="submit"
        >
          완료
        </button>
      </form>

      {msg && <p className="signup-msg">{msg}</p>}
    </div>
  );
}
