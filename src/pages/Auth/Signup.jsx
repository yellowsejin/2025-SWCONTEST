import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ 추가
import "../../assets/scss/Signup.scss"; // SCSS 파일 경로 확인

function Signup() {
  const navigate = useNavigate(); // ✅ 네비게이트 훅 생성


  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [isValid, setIsValid] = useState(false);

  // ✅ 모든 필수 항목이 채워졌는지 확인
  useEffect(() => {
    const { name, email, username, password, confirmPassword, agree } = formData;
    setIsValid(
      name.trim() &&
      email.trim() &&
      username.trim() &&
      password.trim() &&
      confirmPassword.trim() &&
      password === confirmPassword &&
      agree
    );
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSignup = async () => {
    if (!isValid) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("회원가입 성공!");
        navigate("/login");
      } else {
        alert(`회원가입 실패: ${data.message || "에러 발생"}`);
      }
    } catch (err) {
      console.error("회원가입 에러:", err);
      alert("회원가입 요청 실패");
    }
  };

  return (
    <div className="signup-page">
      <h2 className="signup-title">회원가입</h2>

      <div className="form-group">
        <label>이름 <span className="required">*</span></label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>이메일 <span className="required">*</span></label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>아이디 <span className="required">*</span></label>
        <input type="text" name="username" value={formData.username} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>비밀번호 <span className="required">*</span></label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} />
        <small>8~16자</small>
      </div>

      <div className="form-group">
        <label>비밀번호 확인 <span className="required">*</span></label>
        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
      </div>

      <div className="checkbox-wrapper">
        <input type="checkbox" name="agree" checked={formData.agree} onChange={handleChange} />
        <span>개인정보 수집 및 이용에 동의합니다.</span>
      </div>

      <button className={`submit-button ${isValid ? "active" : ""}`} onClick={handleSignup}>
        완료
      </button>
    </div>
  );
}

export default Signup;