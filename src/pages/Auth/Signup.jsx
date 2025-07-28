import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../assets/scss/section/Singup.scss";

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    agree: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }
    if (form.password.length < 8 || form.password.length > 16) {
        alert('비밀번호는 8자 이상 16자 이하로 입력해주세요.');
        return;
  }

    if (!form.agree) {
      alert('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }

    // 회원가입 로직 처리 후
    alert('회원가입 완료!');
    navigate('/login');
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h1>회원가입</h1>
        <form className="signup-form" onSubmit={handleSubmit}>
          <label className="signup-label">
            이름<span className="required">*</span>
            <input 
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label className="signup-label">
            이메일
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </label>

          <label className="signup-label">
            아이디<span className="required">*</span>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </label>

          <label className="signup-label">
            비밀번호<span className="required">*</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            minLength={8}
            maxLength={16}
            />
          </label>
          <div className="password-hint">8~16자</div>

          <label className="signup-label">
            비밀번호 확인<span className="required">*</span>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </label>

          <label className="checkbox" >
            <input
              type="checkbox"
              name="agree"
              checked={form.agree}
              onChange={handleChange}
            />
            개인정보 수집 및 이용에 동의합니다.
          </label>

          <button type="submit">완료</button>
        </form>
      </div>
    </div>
  );
}

export default Signup;
