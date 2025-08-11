import React from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault(); // 폼 제출 기본 동작 막기 (새로고침 방지)
    // 로그인 로직 성공 시
    navigate("/calendar");
  };

  return (
    <div className='login-page'>
      <div className="login-container">
        <h1>Doooop에 오신 것을 <br /> 환영해요 :) </h1>
        <p className="login-subtext">
          Doooop으로 단어와 일정을 관리하고, 작고 작은 성취의 즐거움을 느껴보세요
        </p>

        <form className="login-form" onSubmit={handleLogin}>
          <input type="text" placeholder="아이디 입력" />
          <input type="password" placeholder="비밀번호 입력" />
          <button type="submit">로그인</button>
        </form>

        <div className="login-links">
          <a onClick={() => navigate("/find-id")}>아이디 찾기</a>
          <a onClick={() => navigate("/find-password")}>비밀번호 찾기</a>
          <a onClick={() => navigate("/signup")}>회원가입</a>
        </div>
      </div>
    </div>
  );
}

export default Login;