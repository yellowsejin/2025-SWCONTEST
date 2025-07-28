import { NavLink } from "react-router-dom";
import "../assets/scss/section/Nav.scss";

import questIcon from "./Quest.png";
import friendsIcon from "./Friends.png";
import calendarIcon from "./Calendar.png";
import todoIcon from "./Todo.png";
import townIcon from "./town.png";

function Nav() {
  const tabs = [
    { to: "/quest", label: "quest", icon: questIcon },
    { to: "/friends", label: "Friends", icon: friendsIcon },
    { to: "/calendar", label: "Home", icon: calendarIcon },
    { to: "/todo", label: "Todo", icon: todoIcon },
    { to: "/town", label: "town", icon: townIcon },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => (isActive ? "tab active" : "tab")}
        >
          <img src={tab.icon} alt={tab.label} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default Nav;
