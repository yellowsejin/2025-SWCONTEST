// src/components/ButtonNav.jsx
import React, { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "../assets/scss/ButtonNav.scss";

function BottomNav() {
  const location = useLocation();

  // 오늘 경로 (원하면 '/daily'만 써도 됨 — 아래선 to:'/daily'로 사용)
  const todayPath = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `/daily/${y}-${m}-${day}`;
  }, []);

  const navItems = [
    { name: "quest",     to: "/quest",        icon: "/img/navi_quest.png" },
    { name: "Friends",   to: "/friends",      icon: "/img/navi_friends.png" },
    { name: "Home",      to: "/calendar",     icon: "/img/navi_home.png" },
    // 활성 표시가 날짜 바뀌어도 유지되도록 to는 '/daily'로, 클릭 시 오늘로 이동하고 싶으면 onClick에서 처리
    { name: "ToDo",      to: "/daily",        icon: "/img/navi_todo.png", onClickNavigate: true },
    { name: "수정s town", to: "",       icon: "/img/navi_town.png" },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(({ name, to, icon, onClickNavigate }) => (
        <NavLink
          key={name}
          to={to}
          // '/daily/xxxx-xx-xx' 같은 하위 경로도 활성화되게 end={false}
          end={false}
          className={({ isActive }) => {
            // ToDo는 '/daily/...' 전부 활성 처리
            const active =
              isActive ||
              (to === "/daily" && location.pathname.startsWith("/daily"));
            return `nav-item ${active ? "active" : ""}`;
          }}
          onClick={(e) => {
            // ToDo 탭을 눌렀을 때 항상 '오늘'로 보내고 싶다면:
            if (onClickNavigate && to === "/daily") {
              e.preventDefault();
              window.history.pushState({}, "", todayPath);
              // 수동 내비게이션 후 popstate 트리거 (리액트라우터가 감지)
              window.dispatchEvent(new PopStateEvent("popstate"));
            }
          }}
          aria-label={name}
        >
          <img src={icon} alt={name} />
          <span>{name}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
